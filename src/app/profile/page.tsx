"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
// ⚠️ TODO: REMOVE BEFORE PRODUCTION - Test user helper
import { isTestUser as checkIsTestUser, getTestUserData, clearTestUserData } from "@/lib/testUserHelper";
// ⚠️ DEVELOPMENT ONLY - OTP bypass for testing
import { isOtpBypassEnabled } from "@/lib/devConfig";

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
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<PendingUserData | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper function to get return URL and redirect
    const getReturnUrlAndRedirect = () => {
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl) {
            router.push(decodeURIComponent(returnUrl));
        } else {
            router.push("/user");
        }
    };

    useEffect(() => {
        // Check if user is already logged in via Supabase Auth session
        checkSession().catch((error) => {
            console.error("Error in checkSession:", error);
            // Don't block the UI if checkSession fails
        });
    }, []);

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
            console.log("Input phone (normalized):", normalizedPhone);
            console.log("Input phone (with +91):", phoneNumber);

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
                console.log(`📋 Checking ${allUsers.length} users in database...`);

                // Find user by matching normalized phone (last 10 digits)
                // This works regardless of how phone is stored (+91 prefix, without prefix, etc.)
                const foundUser = allUsers.find(u => {
                    if (!u.phone) {
                        console.log(`  ⚠️ User ${u.id} has no phone number`);
                        return false;
                    }

                    // Normalize stored phone (remove all non-digits)
                    const storedDigits = u.phone.replace(/\D/g, "").trim();
                    // Get last 10 digits (handles cases with country codes)
                    const storedLast10 = storedDigits.slice(-10);
                    const inputLast10 = normalizedPhone.slice(-10);

                    const matches = storedLast10 === inputLast10;

                    if (matches) {
                        console.log(`  ✅ MATCH FOUND!`);
                        console.log(`     Stored phone: ${u.phone} (normalized: ${storedDigits}, last 10: ${storedLast10})`);
                        console.log(`     Input phone: ${normalizedPhone} (last 10: ${inputLast10})`);
                        console.log(`     User: ${u.name} (ID: ${u.id})`);
                    } else {
                        console.log(`  ❌ No match: ${u.phone} (last 10: ${storedLast10}) vs input (last 10: ${inputLast10})`);
                    }

                    return matches;
                });

                existingUser = foundUser || null;
            } else {
                console.log("📋 No users found in database");
            }

            console.log("🎯 Final existingUser result:", existingUser ? `${existingUser.name} (${existingUser.phone})` : "NOT FOUND");

            // Case 1: User found in users table (admin-created or self-registered)
            if (existingUser) {
                // Check if admin
                if (existingUser.auth_user_id) {
                    setError("This is an admin account. Please use the admin panel to login.");
                    setLoading(false);
                    return;
                }

                // User exists in user table - show OTP screen (OTP required for all users)
                console.log("✅ User found in database, showing OTP screen...");
                
                // Store user info in state for after OTP verification (not localStorage)
                // We'll use this to link auth_user_id if it's admin-created user
                setPendingUserData({
                    id: existingUser.id,
                    name: existingUser.name,
                    phone: existingUser.phone,
                    email: existingUser.email,
                    auth_user_id: existingUser.auth_user_id
                });

                // Send OTP (required for all users to verify ownership)
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    phone: phoneNumber,
                });

                if (otpError) {
                    // OTP sending failed (likely not connected to Supabase OTP)
                    // Still show OTP screen - user needs to enter OTP
                    console.warn("⚠️ OTP sending failed (may not be connected to Supabase OTP):", otpError.message);
                    // Don't throw error - continue to show OTP screen
                }

                setOtpSent(true);
                setIsNewUser(false); // Existing user, not new
                setLoading(false);
                return;
            }

            // Case 2: User not found in users table - Will ask info after OTP
            // Mark as new user FIRST before sending OTP
            setIsNewUser(true);

            // Send OTP (required for all users to verify ownership)
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: phoneNumber,
                options: {
                    data: {
                        // We'll collect name/email after OTP verification
                    },
                },
            });

            if (otpError) {
                // OTP sending failed (likely not connected to Supabase OTP)
                // Still show OTP screen - user needs to enter OTP
                console.warn("⚠️ OTP sending failed (may not be connected to Supabase OTP):", otpError.message);
                // Don't throw error - continue to show OTP screen
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
            
            if (otp === "000000") {
                // Test OTP bypass mode: Create Supabase Auth session for testing
                console.warn("⚠️ TESTING MODE: Using test OTP '000000' - creating Supabase Auth session");
                
                // For "000000", create a Supabase Auth user with a temporary password
                // This ensures we have a proper auth session
                const tempPassword = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                
                try {
                    // Try to create user in Supabase Auth
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        phone: phoneNumber,
                        password: tempPassword,
                    });

                    if (signUpData?.user) {
                        // User created successfully
                        authUser = signUpData.user;
                        console.log("✅ Created new auth user for test OTP:", authUser.id);
                    } else if (signUpError?.message?.includes("already registered") || signUpError?.message?.includes("User already registered")) {
                        // User already exists in Supabase Auth - we'll handle this below by finding the user
                        console.log("ℹ️ User already exists in Supabase Auth");
                        // Try to get existing session
                        const { data: sessionData } = await supabase.auth.getSession();
                        if (sessionData?.session?.user) {
                            authUser = sessionData.session.user;
                        }
                    } else {
                        console.warn("⚠️ Error creating auth user:", signUpError);
                        // Will continue and try to authenticate via users table
                    }
                } catch (err) {
                    console.warn("⚠️ Error creating auth session with test OTP:", err);
                    // Continue - will authenticate via users table if needed
                }
            } else {
                // Normal OTP verification with Supabase
                const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                phone: phoneNumber,
                token: otp,
                type: "sms",
            });

            if (verifyError) {
                throw verifyError;
            }

                if (!verifyData.user) {
                throw new Error("Authentication failed");
            }

                authUser = verifyData.user;
            }

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
                } else if (otp === "000000") {
                    // No auth session but using test OTP - create one
                    console.log("⚠️ No auth session with test OTP, creating one...");
                    const tempPassword = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                    
                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        phone: phoneNumber,
                        password: tempPassword,
                    });
                    
                    if (authData?.user) {
                        // Link auth_user_id to user
                        await supabase
                            .from("users")
                            .update({ auth_user_id: authData.user.id })
                            .eq("id", pendingUserData.id);
                        console.log("✅ Created auth session and linked to user");
                    } else if (authError?.message?.includes("already registered")) {
                        // User exists in auth - get session
                        const { data: sessionData } = await supabase.auth.getSession();
                        if (sessionData?.session?.user) {
                            await supabase
                                .from("users")
                                .update({ auth_user_id: sessionData.session.user.id })
                                .eq("id", pendingUserData.id);
                            console.log("✅ Linked existing auth session to user");
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

            // Check if user already exists in users table
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
                    // User already exists in database - authenticated via Supabase Auth
                    // No localStorage needed - session is managed by Supabase
                    console.log("✅ User authenticated via Supabase Auth session");
                    setVerifyingOtp(false);
                    getReturnUrlAndRedirect();
                    return;
                }
            }
            
            // If no auth session and no existing user found, check by phone for test OTP
            if (!authUser && otp === "000000") {
                console.log("ℹ️ No auth session with test OTP, checking users table by phone...");
                
                const { data: allUsers } = await supabase
                    .from("users")
                    .select("id, name, phone, email, auth_user_id");

                if (allUsers && allUsers.length > 0) {
                    const foundUser = allUsers.find((u: any) => {
                        if (!u.phone) return false;
                        const storedDigits = u.phone.replace(/\D/g, "").trim();
                        const storedLast10 = storedDigits.slice(-10);
                        const inputLast10 = normalizedPhone.slice(-10);
                        return storedLast10 === inputLast10;
                    }) as { id: string; name: string; phone: string; email: string | null; auth_user_id: string | null } | undefined;

                    if (foundUser) {
                        // Check if user is an admin (in admins table)
                        const userIdToCheck = foundUser.auth_user_id || foundUser.id;
                        const { data: adminCheck } = await supabase
                            .from("admins")
                            .select("id")
                            .eq("auth_user_id", userIdToCheck)
                            .maybeSingle();
                        
                        if (adminCheck) {
                            setError("This is an admin account. Please use the admin panel to login.");
                            setVerifyingOtp(false);
                            return;
                        }
                        // User exists but no auth session - create one
                        console.log("✅ User found in database, creating auth session...", foundUser);
                        
                        // Create auth user for this phone number
                        const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                        const { data: authData, error: authError } = await supabase.auth.signUp({
                            phone: phoneNumber,
                            password: tempPassword,
                        });
                        
                        if (authData?.user) {
                            // Link auth_user_id to user
                            await supabase
                                .from("users")
                                .update({ auth_user_id: authData.user.id })
                                .eq("id", foundUser.id);
                            
                            console.log("✅ Auth session created and linked to user");
                            setVerifyingOtp(false);
                            getReturnUrlAndRedirect();
                            return;
                        } else if (authError?.message?.includes("already registered")) {
                            // User already exists in auth - try to sign in
                            const { data: signInData } = await supabase.auth.signInWithPassword({
                                phone: phoneNumber,
                                password: tempPassword,
                            });
                            
                            if (signInData?.user) {
                                await supabase
                                    .from("users")
                                    .update({ auth_user_id: signInData.user.id })
                                    .eq("id", foundUser.id);
                                
                                console.log("✅ Signed in existing auth user");
                                setVerifyingOtp(false);
                getReturnUrlAndRedirect();
                return;
            }
                        }
                        
                        setError("Failed to create authentication session. Please try again.");
                        setVerifyingOtp(false);
                        return;
                    }
                }
            }

            // New user - Show form to collect name/email
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
        if (!newUserName.trim()) {
            setError("Please enter your name");
            return;
        }

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

            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            // ⚠️ DEVELOPMENT ONLY - OTP Bypass for testing
            if (isOtpBypassEnabled()) {
                console.warn("⚠️ DEV MODE: OTP bypass enabled - creating user");

                // First, check if user already exists (in case they were created by admin)
                // Use the same robust phone matching logic as handleLogin
                console.log("🔍 Checking if user already exists before creating...");
                const { data: allUsersCheck, error: allUsersCheckError } = await supabase
                    .from("users")
                    .select("id, name, phone, email, auth_user_id");

                let existingUserCheck = null;
                if (!allUsersCheckError && allUsersCheck) {
                    const foundUser = allUsersCheck.find(u => {
                        if (!u.phone) return false;
                        const storedDigits = u.phone.replace(/\D/g, "").trim();
                        const storedLast10 = storedDigits.slice(-10);
                        const inputLast10 = normalizedPhone.slice(-10);
                        return storedLast10 === inputLast10;
                    });
                    existingUserCheck = foundUser || null;
                }

                if (existingUserCheck) {
                    // User already exists - get/create auth session
                    console.log("✅ User already exists, creating auth session:", existingUserCheck);
                    
                    // Create auth session for existing user
                    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                    const { data: authData } = await supabase.auth.signUp({
                        phone: phoneNumber,
                        password: tempPassword,
                    });
                    
                    if (authData?.user) {
                        await supabase
                            .from("users")
                            .update({ auth_user_id: authData.user.id })
                            .eq("id", existingUserCheck.id);
                    }
                    
                    getReturnUrlAndRedirect();
                    setLoading(false);
                    return;
                }

                // Create user through Supabase Auth first (this creates auth.users entry)
                // This is needed to satisfy RLS policies that require authentication
                console.log("📝 Creating new user in Supabase Auth...");
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    phone: phoneNumber,
                    password: "dev-password-bypass-" + Date.now(), // Unique password for each user
                });

                let authUserId = null;
                if (authData?.user) {
                    authUserId = authData.user.id;
                    console.log("✅ Created auth user:", authUserId);
                } else if (authError) {
                    // If user already exists in auth, try to sign in
                    if (authError.message?.includes("already registered") || authError.message?.includes("User already registered")) {
                        console.log("ℹ️ User already exists in auth, trying to sign in...");
                        const { data: signInData } = await supabase.auth.signInWithPassword({
                            phone: phoneNumber,
                            password: "dev-password-bypass-" + Date.now(),
                        });
                        if (signInData?.user) {
                            authUserId = signInData.user.id;
                            console.log("✅ Signed in existing auth user:", authUserId);
                        }
                    } else {
                        console.warn("⚠️ Auth signup error (non-critical):", authError);
                        // Continue anyway - we'll generate a UUID
                    }
                }

                // Use auth user ID if available, otherwise generate UUID
                const userId = authUserId || crypto.randomUUID();
                console.log("📝 Using user ID:", userId, authUserId ? "(from auth)" : "(generated)");

                // Create user in users table
                // RLS policy should now allow this if auth.uid() matches id or auth_user_id
                console.log("📝 Inserting user into users table...");
                const { data: newUser, error: createError } = await supabase
                    .from("users")
                    .insert([{
                        id: userId,
                        name: newUserName.trim(),
                        phone: phoneNumber,
                        email: newUserEmail.trim() || null,
                        auth_user_id: authUserId, // Link to Supabase Auth if available
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error("❌ Error creating user:", createError);
                    // If RLS error, provide helpful message
                    if (createError.message?.includes("row-level security") || createError.code === "42501") {
                        throw new Error(
                            "Database security policy error. " +
                            "The RLS policy has been updated, but you may need to refresh your session. " +
                            "Please try again. If the error persists, check Supabase RLS policies.\n\n" +
                            "Original error: " + createError.message
                        );
                    }
                    throw createError;
                }

                console.log("✅ User created successfully:", newUser);

                // User created - auth session already exists from OTP verification
                // No localStorage needed - session is managed by Supabase

                // Redirect to user page
                getReturnUrlAndRedirect();
                setLoading(false);
                return;
            }

            // ========== NORMAL FLOW (OTP REQUIRED) ==========
            // Get current auth session (user already verified OTP)
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                throw new Error("Authentication session expired. Please login again.");
            }

            const authUserId = session.user.id;

            // Create user in users table using auth user ID
            // RLS policy "user create self profile" allows this when auth_user_id = auth.uid()
            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert([{
                    id: authUserId,
                    name: newUserName.trim(),
                    phone: phoneNumber,
                    email: newUserEmail.trim() || null,
                    auth_user_id: authUserId, // Link to Supabase Auth (required for RLS policy)
                }])
                .select()
                .single();

            if (createError) {
                throw createError;
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
                    <h2 className="text-[1.2rem] font-black mt-4 md:mt-0 text-[#333]">
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
                                        setPhone(e.target.value.replace(/\D/g, ""));
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
                                    <label className="block text-xs text-[#4d5563] text-left mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newUserName.trim()) {
                                                handleCreateNewUser();
                                            }
                                        }}
                                        className="w-full border border-[#4d5563] p-3 text-[0.8rem] outline-none"
                                        placeholder="Enter your name"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-[#4d5563] text-left mb-1">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        className="w-full border border-[#4d5563] p-3 text-[0.8rem] outline-none"
                                        placeholder="Enter your email"
                                    />
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
                                        setNewUserName("");
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
                                    disabled={loading || !newUserName.trim()}
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
