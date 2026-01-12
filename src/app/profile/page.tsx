"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { capitalizeFirstLetter } from "@/lib/utils";
import { getOtpChannel } from "@/lib/devConfig";

interface PendingUserData {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    auth_user_id: string | null;
}

export default function Profile() {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<PendingUserData | null>(null);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [showAddCity, setShowAddCity] = useState(false);
    const [newCityName, setNewCityName] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper function to get return URL and redirect
    // Helper function to get return URL and redirect
    const getReturnUrlAndRedirect = () => {
        const returnUrl = searchParams.get('returnUrl');
        const target = returnUrl ? decodeURIComponent(returnUrl) : "/user";
        console.log("🚀 Hard Redirecting to:", target);
        window.location.href = target;
    };

    useEffect(() => {
        // Check if user is already logged in via Supabase Auth session
        checkSession().catch((error) => {
            console.error("Error in checkSession:", error);
            // Don't block the UI if checkSession fails
        });
        loadCities();
    }, []);

    const loadCities = async () => {
        try {
            const { data, error } = await supabase
                .from("cities")
                .select("*")
                .order("display_order", { ascending: true });
            if (error) throw error;
            setCities(data || []);
        } catch (error) {
            console.error("Error loading cities:", error);
        }
    };

    const handleAddNewCity = async () => {
        if (!newCityName.trim()) {
            setError("Please enter a city name");
            return;
        }

        if (cities.some(c => c.name.toLowerCase() === newCityName.trim().toLowerCase())) {
            setError("This city already exists");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("cities")
                .insert([{
                    name: newCityName.trim(),
                    display_order: cities.length
                }])
                .select()
                .single();

            if (error) throw error;

            setCities(prev => [...prev, data]);
            setSelectedCities(prev => [...prev, data.id]);
            setNewCityName("");
            setShowAddCity(false);
        } catch (error: any) {
            console.error("Error adding city:", error);
            setError(error.message || "Failed to add city");
        }
    };

    const checkSession = async () => {
        // Check Supabase Auth session only
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session?.user && !error) {
            // Check if user is admin (in admins table)
            const { data: adminData } = await supabase
                .from("admins")
                .select("id, email")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            if (adminData) {
                // Admin detected - don't sign out, just don't redirect
                // Admin should use admin panel, not profile page
                // Keep session active so admin panel works
                return;
            }

            // Check if user exists in users table
            const { data: userData } = await supabase
                .from("users")
                .select("id, name, phone, email, auth_user_id")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            // Regular user with active session - redirect to user page or return URL
            if (userData) {
                getReturnUrlAndRedirect();
            }
        }
    };

    const handleLogin = async () => {
        if (!phone || phone.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Check if there's an active session
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Check if the active session is from an admin
                const { data: activeUserData } = await supabase
                    .from("users")
                    .select("auth_user_id, id, name")
                    .eq("auth_user_id", session.user.id)
                    .maybeSingle();

                if (activeUserData?.auth_user_id) {
                    // Admin is logged in - prevent regular user login
                    setError("An admin account is currently logged in. Please logout from the admin panel first, or use a different browser/incognito window.");
                    setLoading(false);
                    return;
                } else if (activeUserData) {
                    // Regular user is already logged in - redirect them
                    getReturnUrlAndRedirect();
                    setLoading(false);
                    return;
                } else {
                    // Session exists but user not found in database - sign out and continue
                    await supabase.auth.signOut();
                }
            }

            // Normalize phone number - extract only digits
            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            console.log("🔍 Checking for existing user...");
            // console.log("[LoginDebug] Starting login flow with phone:", phone);
            // console.log("Input phone (normalized):", normalizedPhone);
            // console.log("Input phone (with +91):", phoneNumber);

            // ========== NORMAL USER FLOW ==========
            // Check regular users table - try multiple phone formats
            let existingUser: { id: string; name: string; phone: string; email: string | null; auth_user_id: string | null } | null = null;

            // Strategy: Get all users and match by normalized phone (last 10 digits)
            // This handles all phone format variations
            const { data: allUsers, error: allUsersError } = await supabase
                .from("users")
                .select("id, name, phone, email, auth_user_id, auth_user_id");

            if (allUsersError) {
                console.error("❌ Error fetching users:", allUsersError);
                throw allUsersError;
            }

            if (allUsers && allUsers.length > 0) {
                // console.log(`📋 Checking ${allUsers.length} users in database...`);

                // Find user by matching normalized phone (last 10 digits)
                // This works regardless of how phone is stored (+91 prefix, without prefix, etc.)
                const foundUser = allUsers.find(u => {
                    if (!u.phone) {
                        // console.log(`  ⚠️ User ${u.id} has no phone number`);
                        return false;
                    }

                    // Normalize stored phone (remove all non-digits)
                    const storedDigits = u.phone.replace(/\D/g, "").trim();
                    // Get last 10 digits (handles cases with country codes)
                    const storedLast10 = storedDigits.slice(-10);
                    const inputLast10 = normalizedPhone.slice(-10);

                    const matches = storedLast10 === inputLast10;

                    // if (matches) {
                    //     console.log(`  ✅ MATCH FOUND!`);
                    //     console.log(`     Stored phone: ${u.phone} (normalized: ${storedDigits}, last 10: ${storedLast10})`);
                    //     console.log(`     Input phone: ${normalizedPhone} (last 10: ${inputLast10})`);
                    //     console.log(`     User: ${u.name} (ID: ${u.id})`);
                    // } else {
                    //     console.log(`  ❌ No match: ${u.phone} (last 10: ${storedLast10}) vs input (last 10: ${inputLast10})`);
                    // }

                    return matches;
                });

                existingUser = foundUser || null;
            } else {
                // console.log("📋 No users found in database");
            }

            // console.log("🎯 Final existingUser result:", existingUser ? `${existingUser.name} (${existingUser.phone})` : "NOT FOUND");
            // console.log("[LoginDebug] Existing user check result:", existingUser ? "Found" : "Not Found", existingUser);

            // Case 1: User found in users table (admin-created or self-registered)
            if (existingUser) {
                // Check if this user is an admin (check admins table, not just auth_user_id)
                // Admin-created users will have auth_user_id = null initially, but after first login they'll have auth_user_id
                // We need to check the admins table to see if they're actually an admin
                const userIdToCheck = existingUser.auth_user_id || existingUser.id;
                const { data: adminCheck } = await supabase
                    .from("admins")
                    .select("id")
                    .eq("auth_user_id", userIdToCheck)
                    .maybeSingle();

                if (adminCheck) {
                    setError("This is an admin account. Please use the admin panel to login.");
                    setLoading(false);
                    return;
                }

                // User exists in user table - show OTP screen (OTP required for all users)
                // console.log("✅ User found in database, showing OTP screen...");

                // Store user info in state for after OTP verification (not localStorage)
                // We'll use this to link auth_user_id if it's admin-created user
                setPendingUserData({
                    id: existingUser.id,
                    name: existingUser.name,
                    phone: existingUser.phone,
                    email: existingUser.email,
                    auth_user_id: existingUser.auth_user_id
                });

                // Send OTP using configured channel (SMS for testing, WhatsApp for production)
                const otpChannel = getOtpChannel();
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    phone: phoneNumber,
                    options: {
                        channel: otpChannel, // 'sms' for testing, 'whatsapp' for production
                    },
                });

                if (otpError) {
                    // OTP sending failed - show helpful error message
                    console.error("❌ OTP sending failed:", otpError.message);
                    // console.error("[LoginDebug] ❌ OTP sending failed:", otpError.message);

                    // Provide helpful error messages based on the error
                    if (otpError.message.includes("whatsapp") || otpError.message.includes("WhatsApp")) {
                        setError(
                            "WhatsApp OTP not configured. Please:\n" +
                            "1. Set up Twilio Verify WhatsApp in Supabase Dashboard\n" +
                            "2. Configure WhatsApp Sender in Twilio\n" +
                            "3. Or use a TEST PHONE NUMBER from Supabase Dashboard > Auth > Providers > Phone\n\n" +
                            "If you use a Test Number, the OTP is always the one you set (e.g., 000000)."
                        );
                    } else if (otpError.message.includes("Twilio") || otpError.message.includes("provider")) {
                        setError(
                            "Twilio not configured. For development:\n" +
                            "1. Go to Supabase Dashboard > Authentication > Providers > Phone\n" +
                            "2. Add your number to 'Phone Numbers for Testing'\n" +
                            "3. Use that number and the fixed OTP (e.g., 000000).\n\n" +
                            "Real SMS requires a paid Twilio account."
                        );
                    } else {
                        setError(`Failed to send OTP: ${otpError.message}. Check Twilio configuration or use Test Numbers in Supabase Dashboard.`);
                    }
                    // Still show OTP screen even if sending failed - user might have received OTP
                    setOtpSent(true);
                    setIsNewUser(false);
                    setLoading(false);
                    return;
                }

                setOtpSent(true);
                console.log("[LoginDebug] OTP sent successfully via channel:", otpChannel);
                setIsNewUser(false); // Existing user, not new
                setLoading(false);
                return;
            }

            // Case 2: User not found in users table - Will ask info after OTP
            // Mark as new user FIRST before sending OTP
            setIsNewUser(true);

            // Send OTP using configured channel (SMS for testing, WhatsApp for production)
            const otpChannel = getOtpChannel();
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: phoneNumber,
                options: {
                    channel: otpChannel, // 'sms' for testing, 'whatsapp' for production
                    data: {
                        // We'll collect name/email after OTP verification
                    },
                },
            });

            if (otpError) {
                // OTP sending failed - show helpful error message
                console.error("❌ OTP sending failed:", otpError.message);
                console.error("[LoginDebug] ❌ OTP sending failed (New User):", otpError.message);

                // Provide helpful error messages based on the error
                if (otpError.message.includes("whatsapp") || otpError.message.includes("WhatsApp")) {
                    setError(
                        "WhatsApp OTP not configured. Please:\n" +
                        "1. Set up Twilio Verify WhatsApp in Supabase Dashboard\n" +
                        "2. Configure WhatsApp Sender in Twilio\n" +
                        "3. Or use a TEST PHONE NUMBER from Supabase Dashboard > Auth > Providers > Phone\n\n" +
                        "If you use a Test Number, the OTP is always the one you set (e.g., 000000)."
                    );
                } else if (otpError.message.includes("Twilio") || otpError.message.includes("provider")) {
                    setError(
                        "Twilio not configured. For development:\n" +
                        "1. Go to Supabase Dashboard > Authentication > Providers > Phone\n" +
                        "2. Add your number to 'Phone Numbers for Testing'\n" +
                        "3. Use that number and the fixed OTP (e.g., 000000).\n\n" +
                        "Real SMS requires a paid Twilio account."
                    );
                } else {
                    setError(`Failed to send OTP: ${otpError.message}. Check Twilio configuration or use Test Numbers in Supabase Dashboard.`);
                }
                // Still show OTP screen even if sending failed - user might have received OTP
                setOtpSent(true);
                setLoading(false);
                return;
            }

            setOtpSent(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to login. Please try again.");
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        // Require 6-digit OTP
        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setVerifyingOtp(true);
        setError("");
        console.log("[LoginDebug] Verifying OTP:", otp);

        try {
            // Check if there's an active admin session before verifying OTP
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession?.user) {
                // Check if user is admin
                const { data: adminData } = await supabase
                    .from("admins")
                    .select("id, email")
                    .eq("auth_user_id", existingSession.user.id)
                    .maybeSingle();

                if (adminData) {
                    setError("An admin account is currently logged in. Please logout from the admin panel first, or use a different browser/incognito window.");
                    setVerifyingOtp(false);
                    return;
                }

                // Check if regular user exists
                const { data: activeUserData } = await supabase
                    .from("users")
                    .select("id, name, auth_user_id")
                    .eq("auth_user_id", existingSession.user.id)
                    .maybeSingle();

                if (activeUserData) {
                    // Regular user already logged in - redirect
                    getReturnUrlAndRedirect();
                    setVerifyingOtp(false);
                    return;
                }
            }

            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            // ⚠️ TESTING MODE: Use "000000" as test OTP (create Supabase Auth session for testing)
            let authUser: any = null;

            // Normal OTP verification with Supabase
            // Use the same channel type as sending (sms for SMS, sms for WhatsApp too)
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                phone: phoneNumber,
                token: otp,
                type: "sms", // Use 'sms' type for both SMS and WhatsApp OTPs
            });

            if (verifyError) {
                throw verifyError;
            }

            if (!verifyData.user) {
                throw new Error("Authentication failed");
            }

            authUser = verifyData.user;

            if (pendingUserData) {
                // Existing user found in users table - Authenticate
                console.log("✅ User found in pendingUserData, authenticating...", pendingUserData);

                // If we have auth session, link auth_user_id to user
                if (authUser) {
                    // Update users table to link auth_user_id
                    if (!pendingUserData.auth_user_id || pendingUserData.auth_user_id !== authUser.id) {
                        try {
                            const { error: updateError } = await supabase
                                .from("users")
                                .update({ auth_user_id: authUser.id })
                                .eq("id", pendingUserData.id);

                            if (updateError) {
                                console.warn("⚠️ Failed to update auth_user_id (non-critical):", updateError);
                            } else {
                                console.log("✅ Linked auth_user_id to user");
                            }
                        } catch (updateErr) {
                            console.warn("⚠️ Error updating auth_user_id (non-critical):", updateErr);
                        }
                    }
                }

                // User is authenticated via Supabase Auth session
                // No need to store in localStorage - session is managed by Supabase
                console.log("✅ User authenticated via Supabase Auth session");

                // Clear pending data from state
                setPendingUserData(null);

                // Redirect to user page or return URL
                setVerifyingOtp(false);
                getReturnUrlAndRedirect();
                return;
            }

            // Check if user already exists in users table (via Auth ID)
            if (authUser) {
                // Check by auth ID
                const { data: existingUser, error: userError } = await supabase
                    .from("users")
                    .select("id, name, phone, email, auth_user_id")
                    .eq("auth_user_id", authUser.id)
                    .maybeSingle();

                if (userError && userError.code !== "PGRST116") {
                    throw userError;
                }

                if (existingUser) {
                    console.log("✅ User authenticated via Supabase Auth session (Found by Auth ID)");
                    setVerifyingOtp(false);
                    getReturnUrlAndRedirect();
                    return;
                }

                // CRITICAL FIX: Check if user exists by PHONE now that we are authenticated
                // RLS might have hidden them before, but we might be able to see/link them now.
                console.log("ℹ️ Checking for existing user profile by phone...", phoneNumber);

                // DEBUG: Check what the user object looks like and what Supabase thinks our phone is
                console.log("ℹ️ Current Auth User ID:", authUser.id);
                console.log("ℹ️ Current Auth Phone:", authUser.phone);

                const { data: profileByPhone, error: profileError } = await supabase
                    .from("users")
                    .select("*")
                    .eq("phone", phoneNumber)
                    .maybeSingle();

                if (profileError) {
                    console.error("❌ Error checking profile by phone:", profileError);
                } else {
                    console.log("ℹ️ Profile query result:", profileByPhone ? "FOUND" : "NOT FOUND", profileByPhone);
                }

                if (profileByPhone) {
                    console.log("✅ Found existing profile by phone (Post-Auth):", profileByPhone);
                    // Link immediately
                    if (profileByPhone.auth_user_id !== authUser.id) {
                        console.log(`ℹ️ Linking new Auth ID ${authUser.id} to existing user ${profileByPhone.id} (was ${profileByPhone.auth_user_id})`);
                        const { error: linkError } = await supabase
                            .from("users")
                            .update({ auth_user_id: authUser.id })
                            .eq("id", profileByPhone.id);

                        if (linkError) {
                            console.error("❌ Link update failed:", linkError);
                        } else {
                            console.log("✅ Linked account automatically");
                        }
                    }

                    setVerifyingOtp(false);
                    getReturnUrlAndRedirect();
                    return;
                }
            }

            // New user - Show form to collect name/email
            // If we are here, we truly didn't find the user
            if (isNewUser) {
                // New user - Ask for information (after OTP verification)
                setOtpSent(false); // Hide OTP screen, show info form
                setOtp(""); // Clear OTP
                setVerifyingOtp(false);
            } else {
                // This shouldn't happen, but handle it gracefully
                setError("Please complete your registration by entering your details.");
                setIsNewUser(true);
                setOtpSent(false);
                setOtp("");
                setVerifyingOtp(false);
            }
        } catch (err: any) {
            setError(err.message || "Failed to verify OTP. Please try again.");
            setVerifyingOtp(false);
        }
    };

    const handleCreateNewUser = async () => {
        if (!firstName.trim()) {
            setError("Please enter your name");
            return;
        }

        if (!lastName.trim()) {
            setError("Please enter your surname");
            return;
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        setLoading(true);
        setError("");

        try {
            // Check if there's an active admin session before creating user
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession?.user) {
                const { data: activeUserData } = await supabase
                    .from("users")
                    .select("auth_user_id, id, name")
                    .or(`id.eq.${existingSession.user.id},auth_user_id.eq.${existingSession.user.id}`)
                    .maybeSingle();

                if (activeUserData?.auth_user_id) {
                    setError("An admin account is currently logged in. Please logout from the admin panel first, or use a different browser/incognito window.");
                    setLoading(false);
                    return;
                } else if (activeUserData && !activeUserData.auth_user_id) {
                    // Regular user already logged in - redirect
                    getReturnUrlAndRedirect();
                    setLoading(false);
                    return;
                }
            }

            if (selectedCities.length === 0) {
                setError("Please select at least one city");
                setLoading(false);
                return;
            }

            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            // ========== NORMAL FLOW (OTP REQUIRED) ==========
            // Get current auth session (user already verified OTP)
            // Use getUser() as it is more robust than getSession() for validation
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                // Try refresh session
                const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
                if (!refreshedSession?.user) {
                    throw new Error("Authentication session expired. Please login again.");
                }
            }

            const authUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;
            if (!authUserId) throw new Error("User ID missing");

            // Create user in users table using auth user ID
            // RLS policy "user create self profile" allows this when auth_user_id = auth.uid()
            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert([{
                    id: authUserId,
                    name: fullName,
                    phone: phoneNumber,
                    email: newUserEmail.trim() || null,
                    auth_user_id: authUserId, // Link to Supabase Auth (required for RLS policy)
                }])
                .select()
                .single();

            if (createError) {
                // Check for unique key violation (user already exists)
                if (createError.code === "23505") { // duplicate key value violates unique constraint
                    console.warn("⚠️ User already exists (duplicate phone), linking account...", createError);

                    const { data: linkedUser, error: linkError } = await supabase
                        .from("users")
                        .update({ auth_user_id: authUserId })
                        .eq("phone", phoneNumber)
                        .select()
                        .single();

                    if (linkError) {
                        console.error("❌ Failed to link existing user:", linkError);
                        throw new Error("This phone number is already registered but could not be linked. Please contact support.");
                    }

                    // Update cities for linked user
                    await supabase.from("user_cities").delete().eq("user_id", linkedUser.id);
                    if (selectedCities.length > 0) {
                        await supabase.from("user_cities").insert(
                            selectedCities.map(cityId => ({ user_id: linkedUser.id, city_id: cityId }))
                        );
                    }

                    console.log("✅ Successfully linked existing user:", linkedUser);
                    router.push("/user");
                    return;
                }

                throw createError;
            }

            // Insert user cities
            if (selectedCities.length > 0) {
                await supabase.from("user_cities").insert(
                    selectedCities.map(cityId => ({ user_id: authUserId, city_id: cityId }))
                );
            }

            // User created - auth session already exists
            // No localStorage needed - session is managed by Supabase

            // Redirect to user page
            router.push("/user");
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center w-full h-screen bg-[#959393] p-4 font-sans">
            <div className="max-w-[750px] w-full md:w-[90vw] flex bg-white rounded-[7px] shadow-[0.5rem_0.5rem_0.8rem_rgba(87,87,87,0.5)] overflow-hidden min-h-[50vh] flex-col md:flex-row">

                {/* Left Image Section */}
                <div className="hidden md:flex w-[58%] relative items-center justify-center bg-white">
                    <div className="flex items-center justify-center w-full h-full p-8 relative">
                        {/* Rotating Outer Ring */}
                        <div className="absolute animate-spin" style={{ animationDuration: '20s' }}>
                            <Image
                                src="/ring.svg"
                                alt="Ring"
                                width={300}
                                height={300}
                                className="object-contain brightness-0"
                            />
                        </div>
                        {/* Inner Logo */}
                        <div className="relative z-10">
                            <Image
                                src="/rIta.svg"
                                alt="Logo"
                                width={120}
                                height={120}
                                className="object-contain brightness-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className="w-full md:w-[50%] p-8 md:p-12 text-center flex flex-col justify-center">
                    <h2 className="text-[1.2rem] font-black mt-4 md:mt-0 text-[#333] uppercase">
                        {otpSent ? "VERIFY OTP" : isNewUser ? "CREATE ACCOUNT" : "LOGIN"}
                    </h2>
                    <p className="mt-3 text-[#4d5563] text-[0.8rem]">
                        {otpSent
                            ? "Enter the OTP sent to your phone"
                            : isNewUser
                                ? "Enter your details to create an account"
                                : "Enter your phone number to login"}
                    </p>

                    {otpSent ? (
                        <>
                            <div className="mt-6 space-y-5">
                                <div>
                                    <label className="block text-xs text-[#4d5563] text-left mb-2 font-medium">
                                        Phone Number
                                    </label>
                                    <div className="border border-[#4d5563] p-3 text-[0.8rem] flex items-center bg-gray-50 rounded">
                                        <span className="font-medium">+91</span>
                                        <span className="ml-2 text-gray-700 font-medium">{phone}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-[#4d5563] text-left mb-2 font-medium">
                                        OTP Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            // Allow up to 6 digits
                                            if (value.length <= 6) {
                                                setOtp(value);
                                                setError("");
                                            }
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && otp.length === 6) {
                                                handleVerifyOtp();
                                            }
                                        }}
                                        className="w-full border border-[#4d5563] p-4 text-[0.9rem] outline-none text-center text-xl tracking-[0.3em] font-semibold rounded focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-20"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                    <p className="text-xs text-[#4d5563] mt-2 text-left">
                                        Enter the 6-digit code sent to your phone
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-red-600 text-xs text-left">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setIsNewUser(false);
                                        setOtp("");
                                        setError("");
                                        setPendingUserData(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={verifyingOtp || !otp || otp.length !== 6}
                                    className="flex-1 px-4 py-3 text-white bg-black border-none cursor-pointer font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded"
                                >
                                    {verifyingOtp ? "VERIFYING..." : "VERIFY OTP"}
                                </button>
                            </div>
                        </>
                    ) : !isNewUser ? (
                        <>
                            <div className="border border-[#4d5563] mt-4 p-3 text-[0.8rem] flex items-center">
                                <span>+91</span>
                                <input
                                    type="tel"
                                    pattern="[0-9]{10}"
                                    maxLength={10}
                                    inputMode="numeric"
                                    value={phone}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, "");
                                        // Handle paste with 91 prefix
                                        if (val.length > 10 && val.startsWith("91")) {
                                            val = val.substring(2);
                                        }
                                        if (val.length > 10) val = val.slice(0, 10);
                                        setPhone(val);
                                        setError(""); // Clear error when user starts typing
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && phone.length === 10) {
                                            handleLogin();
                                        }
                                    }}
                                    className="w-full outline-none border-none ml-2"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            {error && (
                                <p className="mt-2 text-red-500 text-xs text-left">{error}</p>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={loading || !phone || phone.length !== 10}
                                className="mt-4 w-full p-4 text-white bg-black border-none cursor-pointer font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "LOGGING IN..." : "LOGIN"}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-xs text-[#4d5563] text-left mb-1">
                                        Phone Number
                                    </label>
                                    <div className="border border-[#4d5563] p-3 text-[0.8rem] flex items-center bg-gray-50">
                                        <span>+91</span>
                                        <span className="ml-2 text-gray-600">{phone}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs text-[#4d5563] text-left mb-1">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={firstName}
                                                onChange={(e) => setFirstName(capitalizeFirstLetter(e.target.value))}
                                                className="w-full border border-[#4d5563] p-3 text-[0.8rem] outline-none rounded"
                                                placeholder="First Name"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-[#4d5563] text-left mb-1">
                                                Surname *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={lastName}
                                                onChange={(e) => setLastName(capitalizeFirstLetter(e.target.value))}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && firstName.trim() && lastName.trim()) {
                                                        handleCreateNewUser();
                                                    }
                                                }}
                                                className="w-full border border-[#4d5563] p-3 text-[0.8rem] outline-none rounded"
                                                placeholder="Surname"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-[#4d5563] text-left mb-1">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        className="w-full border border-[#4d5563] p-3 text-[0.8rem] outline-none rounded"
                                        placeholder="user@example.com (optional)"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[10px] uppercase font-bold text-[#4d5563]">
                                            From Where (Cities) *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddCity(!showAddCity)}
                                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase"
                                        >
                                            {showAddCity ? "Cancel" : "+ Add New"}
                                        </button>
                                    </div>

                                    {showAddCity && (
                                        <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCityName}
                                                    onChange={(e) => setNewCityName(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddNewCity();
                                                        }
                                                    }}
                                                    placeholder="City name"
                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-black text-[0.8rem]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewCity}
                                                    className="px-3 py-1.5 bg-black text-white font-bold rounded hover:opacity-90 transition-all text-[0.8rem]"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border border-[#4d5563] rounded max-h-32 overflow-y-auto p-2 bg-white">
                                        {cities.length === 0 ? (
                                            <p className="text-[10px] text-gray-500 uppercase">Loading cities...</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                {cities.map(city => {
                                                    const isChecked = selectedCities.includes(city.id);
                                                    return (
                                                        <label
                                                            key={city.id}
                                                            className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded transition-colors group"
                                                        >
                                                            <div className={`w-3.5 h-3.5 border border-gray-400 rounded-sm flex items-center justify-center transition-colors ${isChecked ? 'bg-black border-black' : 'bg-white group-hover:border-gray-600'}`}>
                                                                {isChecked && (
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedCities(prev => [...prev, city.id]);
                                                                    } else {
                                                                        setSelectedCities(prev => prev.filter(id => id !== city.id));
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[0.8rem] text-gray-700 truncate">{city.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="mt-2 text-red-500 text-xs text-left">{error}</p>
                            )}

                            <div className="flex gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Go back to phone input screen
                                        setIsNewUser(false);
                                        setOtpSent(false);
                                        setFirstName("");
                                        setLastName("");
                                        setNewUserEmail("");
                                        setOtp("");
                                        setPhone("");
                                        setError("");
                                        setPendingUserData(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateNewUser}
                                    disabled={loading || !firstName.trim() || !lastName.trim() || selectedCities.length === 0}
                                    className="flex-1 px-4 py-2 text-white bg-black border-none cursor-pointer font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "CREATING..." : "CREATE ACCOUNT"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
