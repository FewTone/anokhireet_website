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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    // Login Method State
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [useOtpForEmail, setUseOtpForEmail] = useState(false); // Toggle for Forgot Password / OTP Login
    const [pendingUserData, setPendingUserData] = useState<PendingUserData | null>(null);


    const [cities, setCities] = useState<any[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [showAddCity, setShowAddCity] = useState(false);
    const [newCityName, setNewCityName] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

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
            setLoading(false);
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
        try {
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
                    setLoading(false);
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
                    return; // Don't stop loading, let redirect happen
                } else {
                    // User authenticated (e.g. via Google or Email OTP) but no public profile yet
                    // Show "Create Account" screen and pre-fill data
                    setIsNewUser(true);
                    if (session.user.email) {
                        setNewUserEmail(session.user.email);
                        // If provider is email, set loginMethod to email so password field shows
                        if (session.user.app_metadata.provider === 'email') {
                            setLoginMethod('email');
                        } else {
                            // If Google/OAuth, check if we can Auto-Link to an existing unclaimed email
                            const { data: unclaimedUser } = await supabase
                                .from("users")
                                .select("id, auth_user_id")
                                .eq("email", session.user.email)
                                .is("auth_user_id", null)
                                .maybeSingle();

                            if (unclaimedUser) {
                                // Auto-Link found unclaimed user!
                                console.log("🔗 Auto-linking Google account to existing user:", unclaimedUser.id);
                                await supabase
                                    .from("users")
                                    .update({
                                        auth_user_id: session.user.id,
                                        // Update name/phone if missing? Maybe best to leave as is for now
                                    })
                                    .eq("id", unclaimedUser.id);

                                // Refresh page/redirect to complete login
                                getReturnUrlAndRedirect();
                                return;
                            }
                        }
                    }
                    if (session.user.user_metadata?.full_name) {
                        const names = session.user.user_metadata.full_name.split(' ');
                        if (names.length > 0) setFirstName(names[0]);
                        if (names.length > 1) setLastName(names.slice(1).join(' '));
                    }
                    setLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.error("Session check error:", e);
        }

        // If we get here, no valid session found, show login form
        setLoading(false);
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

            // ========== EMAIL FLOW ==========
            if (loginMethod === 'email') {
                if (!email) {
                    setError("Please enter your email");
                    setLoading(false);
                    return;
                }

                // Check if user exists in public DB
                const { data: publicUser } = await supabase
                    .from("users")
                    .select("id, auth_user_id")
                    .eq("email", email)
                    .maybeSingle();

                // Check if the user is "Claimed" (has an auth_user_id linked)
                const isClaimedUser = publicUser && publicUser.auth_user_id;

                if (isClaimedUser) {
                    setIsNewUser(false);
                } else {
                    // Treat as new user if not found OR if found but unclaimed (auth_user_id is null)
                    setIsNewUser(true);
                    setNewUserEmail(email);
                }

                // 1. Password Login (Only for Existing CLAIMED Users requesting Password)
                if (isClaimedUser && !useOtpForEmail) {
                    if (!password) {
                        setError("Please enter your password");
                        setLoading(false);
                        return;
                    }
                    const { error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error) {
                        setError("Invalid credentials. Please try again.");
                        setLoading(false);
                        return;
                    }
                    // Success -> Session listener handles redirect
                    return;
                }

                // 2. OTP Login (New Users OR Unclaimed Users OR Forgot Password Flow)
                // If user is new/unclaimed OR useOtpForEmail is explicitly true
                const { error } = await supabase.auth.signInWithOtp({
                    email: email,
                    options: {
                        shouldCreateUser: true, // Allow creating auth user for new signups
                    }
                });

                if (error) {
                    setError(`Failed to send code: ${error.message}`);
                    setLoading(false);
                    return;
                }

                setOtpSent(true);
                setLoading(false);
                return;
            }

            // ========== PHONE FLOW ==========
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
            // Normal OTP verification with Supabase
            // Use correct channel type based on login method
            let verifyData, verifyError;

            if (loginMethod === 'email') {
                const res = await supabase.auth.verifyOtp({
                    email: email,
                    token: otp,
                    type: "email",
                });
                verifyData = res.data;
                verifyError = res.error;
            } else {
                const res = await supabase.auth.verifyOtp({
                    phone: phoneNumber,
                    token: otp,
                    type: "sms",
                });
                verifyData = res.data;
                verifyError = res.error;
            }

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

        if (loginMethod === 'email' && !password && isNewUser) {
            setError("Please set a password for your account");
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

            let authUserId: string | null = null;

            if (loginMethod === 'email' && isNewUser) {
                // For new email users, we must update their password
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) throw new Error("Authentication failed");

                // Update password for the user
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: password
                });

                if (passwordError) throw passwordError;

                authUserId = user.id;
            } else {
                // ========== PHONE OTP SIGNUP (OTP ALREADY VERIFIED) ==========
                // Get current auth session (user already verified OTP)
                // Use getUser() as it is more robust than getSession() for validation
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    // Try refresh session
                    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
                    if (!refreshedSession?.user) {
                        throw new Error("Authentication session expired. Please login again.");
                    }
                    authUserId = refreshedSession?.user.id || null;
                } else {
                    authUserId = user.id;
                }
            }



            if (!authUserId) throw new Error("User ID missing");

            // Create user in users table using auth user ID
            // RLS policy "user create self profile" allows this when auth_user_id = auth.uid()
            // First check if an unclaimed user exists with this email (if email login)
            let existingUnclaimedUser = null;
            if (loginMethod === 'email') {
                const { data } = await supabase
                    .from("users")
                    .select("id")
                    .eq("email", email)
                    .is("auth_user_id", null)
                    .maybeSingle();
                existingUnclaimedUser = data;
            }

            let newUser = null;
            let createError = null;

            if (existingUnclaimedUser) {
                // UPDATE the existing unclaimed user
                console.log("🔄 Claiming existing email user:", existingUnclaimedUser.id);
                const { data, error } = await supabase
                    .from("users")
                    .update({
                        auth_user_id: authUserId, // Important: Link auth ID
                        name: fullName,
                        // Don't overwrite email
                    })
                    .eq("id", existingUnclaimedUser.id)
                    .select()
                    .single();

                newUser = data;
                createError = error;
            } else {
                // INSERT new user
                const { data, error } = await supabase
                    .from("users")
                    .insert([{
                        id: authUserId,
                        name: fullName,
                        phone: loginMethod === 'phone' ? phoneNumber : null,
                        email: loginMethod === 'email' ? email : (newUserEmail.trim() || null),
                        auth_user_id: authUserId, // Link to Supabase Auth (required for RLS policy)
                    }])
                    .select()
                    .single();
                newUser = data;
                createError = error;
            }

            if (createError) {
                // Check for unique key violation (user already exists)
                if (createError.code === "23505") { // duplicate key value violates unique constraint
                    console.warn("⚠️ User already exists (duplicate key), linking account...", createError);

                    const matchField = loginMethod === 'email' ? 'email' : 'phone';
                    const matchValue = loginMethod === 'email' ? email : phoneNumber;

                    const { data: linkedUser, error: linkError } = await supabase
                        .from("users")
                        .update({ auth_user_id: authUserId })
                        .eq(matchField, matchValue)
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

            // Handle referral if code provided
            if (referralCode.trim()) {
                try {
                    const { error: referralError } = await supabase.rpc('handle_referral', {
                        referral_code: referralCode.trim()
                    });

                    if (referralError) {
                        console.error("Referral failed:", referralError);
                        // Non-blocking error
                    } else {
                        console.log("Referral processed successfully");
                    }
                } catch (refErr) {
                    console.error("Error processing referral:", refErr);
                }
            }

            // Redirect to user page
            router.push("/user");
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full h-screen bg-[#959393] p-4 font-sans">
            <div className="max-w-[750px] w-full md:w-[90vw] flex bg-white rounded-none shadow-[0.5rem_0.5rem_0.8rem_rgba(87,87,87,0.5)] overflow-hidden min-h-[50vh] flex-col md:flex-row">

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
                                : "Choose your preferred login method"}
                    </p>

                    {/* Method Toggle */}
                    {!otpSent && !isNewUser && (
                        <div className="flex p-1 bg-gray-100 rounded-lg mb-6 max-w-[300px] mx-auto">
                            <button
                                onClick={() => { setLoginMethod('phone'); setError(''); }}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMethod === 'phone' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                PHONE
                            </button>
                            <button
                                onClick={() => { setLoginMethod('email'); setError(''); }}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMethod === 'email' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                EMAIL
                            </button>
                        </div>
                    )}

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
                                    <div className="grid grid-cols-6 gap-2 mb-2 w-full" onPaste={(e) => {
                                        e.preventDefault();
                                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                                        if (pasted.length > 0) {
                                            const newOtp = pasted.slice(0, 6);
                                            setOtp(newOtp);
                                            // Focus the appropriate input based on length
                                            const focusIndex = Math.min(newOtp.length, 5);
                                            const inputs = document.querySelectorAll('input[name^="otp-"]');
                                            (inputs[focusIndex] as HTMLInputElement)?.focus();
                                        }
                                    }}>
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <input
                                                key={index}
                                                name={`otp-${index}`}
                                                type="text"
                                                maxLength={1}
                                                autoComplete="off"
                                                value={otp[index] || ""}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "");
                                                    if (value) {
                                                        const newOtpArray = otp.split("");
                                                        // Pad with spaces if needed
                                                        while (newOtpArray.length < index) newOtpArray.push("");
                                                        newOtpArray[index] = value;
                                                        const newOtp = newOtpArray.join("");
                                                        setOtp(newOtp);
                                                        setError("");

                                                        // Auto focus next input
                                                        if (index < 5) {
                                                            const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement;
                                                            nextInput?.focus();
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Handle Backspace
                                                    if (e.key === "Backspace") {
                                                        if (!otp[index] && index > 0) {
                                                            const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`) as HTMLInputElement;
                                                            prevInput?.focus();
                                                        } else {
                                                            const currentArr = otp.split("");
                                                            currentArr[index] = ""; // Replace char at index with empty
                                                            setOtp(currentArr.join(""));
                                                        }
                                                    }
                                                    // Handle Enter
                                                    if (e.key === "Enter" && otp.length === 6) {
                                                        handleVerifyOtp();
                                                    }
                                                }}
                                                className="w-full h-14 border border-gray-300 text-center text-xl font-bold rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                                autoFocus={index === 0}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-[#4d5563] mt-2 text-center">
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
                            {loginMethod === 'phone' ? (
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
                            ) : (
                                <div className="space-y-3 mt-4">
                                    <div className="border border-[#4d5563] p-3 text-[0.8rem] flex items-center">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (useOtpForEmail) {
                                                        handleLogin();
                                                    } else {
                                                        document.getElementById('login-password')?.focus();
                                                    }
                                                }
                                            }}
                                            className="w-full outline-none border-none"
                                            placeholder="Enter your email"
                                        />
                                    </div>

                                    {!useOtpForEmail && (
                                        <div className="border border-[#4d5563] p-3 text-[0.8rem] flex items-center">
                                            <input
                                                id="login-password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleLogin();
                                                    }
                                                }}
                                                className="w-full outline-none border-none"
                                                placeholder="Enter password"
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-1">
                                        <div className="text-[10px] text-gray-500">
                                            {useOtpForEmail ? "We'll send a one-time code to this email." : ""}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setUseOtpForEmail(!useOtpForEmail);
                                                setError("");
                                            }}
                                            className="text-[10px] text-gray-500 hover:text-black hover:underline"
                                        >
                                            {useOtpForEmail ? "Login with Password" : "Forgot Password? / Login with Code"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="mt-2 text-red-500 text-xs text-left">{error}</p>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={loading || (loginMethod === 'phone' ? !phone || phone.length !== 10 : !email || (!useOtpForEmail && !password))}
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
                                        disabled={loginMethod === 'email'} // If signed up via email, this is fixed
                                    />
                                </div>

                                {loginMethod === 'email' && (
                                    <div>
                                        <label className="block text-xs text-[#4d5563] text-left mb-1">
                                            create Password *
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border border-[#4d5563] p-3 text-[0.8rem] outline-none rounded"
                                            placeholder="Set a password"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs text-[#4d5563] text-left mb-1">
                                        Referral Code (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                        className="w-full border border-[#4d5563] p-3 text-[0.8rem] outline-none rounded uppercase placeholder:normal-case"
                                        placeholder="Enter referral code"
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
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
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
                                        setReferralCode("");
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

                    {/* Social Login Options */}
                    {!otpSent && !isNewUser && (
                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: `${window.location.origin}/user`,
                                                queryParams: {
                                                    access_type: 'offline',
                                                    prompt: 'consent',
                                                },
                                            },
                                        });
                                        if (error) throw error;
                                    } catch (err: any) {
                                        setError(err.message);
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
