"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getOtpChannel } from "@/lib/devConfig";

interface PendingUserData {
    id: string;
    name: string;
    phone: string;
    auth_user_id: string | null;
}

interface LoginModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    onLoginSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const showLogin = isOpen ?? (searchParams.get('login') === 'true');

    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false); // Changed default to false
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<PendingUserData | null>(null);

    const [cities, setCities] = useState<any[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);

    const [citySearch, setCitySearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (otpSent && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [otpSent, timer]);

    const filteredCities = citySearch
        ? cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
        : [];

    // START: Fix for Flicker Issue
    const [isSessionChecked, setIsSessionChecked] = useState(false);

    useEffect(() => {
        if (showLogin) {
            // Reset form state on open
            setPhone("");
            setOtp("");
            setError("");
            setIsNewUser(false);
            setFirstName("");
            setLastName("");
            setSelectedCities([]);
            setOtpSent(false);
            setTimer(30);
            setCanResend(false);

            setIsSessionChecked(false); // Reset to ensure we don't show modal before checking
            checkSession();
            loadCities();
        } else {
            setIsSessionChecked(false);
        }
    }, [showLogin]);

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('login');
            router.push(params.toString() ? `/?${params.toString()}` : '/');
        }
    };

    // Helper function to get return URL and redirect
    const getReturnUrlAndRedirect = () => {
        if (onLoginSuccess) {
            onLoginSuccess();
            return;
        }

        const returnUrl = searchParams.get('returnUrl');
        const target = returnUrl ? decodeURIComponent(returnUrl) : "/user";
        console.log("🚀 Redirecting to:", target);
        router.push(target);
    };

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



    const checkSession = async () => {
        console.log("🔍 [Profile] checkSession started");
        try {
            // Check Supabase Auth session only
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log("🔍 [Profile] Supabase session:", session ? "Found" : "Not Found", error || "");

            if (session?.user && !error) {
                // Check if user is admin (in admins table)
                const { data: adminData } = await supabase
                    .from("admins")
                    .select("id")
                    .eq("auth_user_id", session.user.id)
                    .maybeSingle();

                if (adminData) {
                    console.log("🔍 [Profile] Admin detected");
                    return;
                }

                // Check if user exists in users table
                const { data: userData } = await supabase
                    .from("users")
                    .select("id, name, phone, auth_user_id")
                    .eq("auth_user_id", session.user.id)
                    .maybeSingle();

                console.log("🔍 [Profile] User data from DB:", userData ? "Found" : "Not Found");

                // Regular user with active session
                if (userData) {
                    getReturnUrlAndRedirect();
                    return;
                } else {
                    // User authenticated but no profile yet
                    setIsNewUser(true);
                    if (session.user.user_metadata?.full_name) {
                        const names = session.user.user_metadata.full_name.split(' ');
                        if (names.length > 0) setFirstName(names[0]);
                        if (names.length > 1) setLastName(names.slice(1).join(' '));
                    }
                    if (session.user.phone) {
                        setPhone(session.user.phone.replace(/\D/g, "").slice(-10));
                    }
                    setIsSessionChecked(true); // Allow modal to show completion form
                    return;
                }
            } else {
                // No session found, safe to show modal
                setIsSessionChecked(true);
            }
        } catch (e) {
            console.error("🔍 [Profile] Session check error:", e);
            setIsSessionChecked(true); // Default to showing modal on error
        }
    };

    const handleLogin = async () => {
        // Phone validation
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
                    setError("An admin account is currently logged in. Please logout from the admin panel first, or use a different browser/incognito window.");
                    setLoading(false);
                    return;
                } else if (activeUserData) {
                    getReturnUrlAndRedirect();
                    setLoading(false);
                    return;
                } else {
                    await supabase.auth.signOut();
                }
            }

            // ========== PHONE FLOW Only ==========
            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            console.log("🔍 Checking for existing user...");

            const { data: allUsers, error: allUsersError } = await supabase
                .from("users")
                .select("id, name, phone, auth_user_id");

            if (allUsersError) throw allUsersError;

            let existingUser: { id: string; name: string; phone: string; auth_user_id: string | null } | null = null;

            if (allUsers && allUsers.length > 0) {
                const foundUser = allUsers.find(u => {
                    if (!u.phone) return false;
                    const storedDigits = u.phone.replace(/\D/g, "").trim();
                    const storedLast10 = storedDigits.slice(-10);
                    const inputLast10 = normalizedPhone.slice(-10);
                    return storedLast10 === inputLast10;
                });
                existingUser = foundUser || null;
            }

            // Case 1: User found in users table
            if (existingUser) {
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

                setPendingUserData({
                    id: existingUser.id,
                    name: existingUser.name,
                    phone: existingUser.phone,
                    auth_user_id: existingUser.auth_user_id
                });

                const otpChannel = getOtpChannel();
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    phone: phoneNumber,
                    options: { channel: otpChannel },
                });

                if (otpError) {
                    console.error("❌ OTP sending failed:", otpError.message);
                    if (otpError.message.includes("whatsapp") || otpError.message.includes("WhatsApp")) {
                        setError("WhatsApp OTP not configured. Please contact support or use a Test Number.");
                    } else if (otpError.message.includes("Twilio")) {
                        setError("Twilio configuration error. Please contact support.");
                    } else {
                        setError(`Failed to send OTP: ${otpError.message}`);
                    }
                    setOtpSent(false);
                    setIsNewUser(false);
                    setLoading(false);
                    return;
                }

                setOtpSent(true);
                setTimer(30);
                setCanResend(false);
                setIsNewUser(false);
                setLoading(false);
                return;
            }

            // Case 2: User not found
            setIsNewUser(true);
            const otpChannel = getOtpChannel();
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: phoneNumber,
                options: { channel: otpChannel },
            });

            if (otpError) {
                console.error("❌ OTP sending failed:", otpError.message);
                setError(`Failed to send OTP: ${otpError.message}`);
                setOtpSent(false);
                setLoading(false);
                return;
            }

            setOtpSent(true);
            setTimer(30);
            setCanResend(false);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to login. Please try again.");
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!otp || otp.length !== 4) {
            setError("Please enter a valid 4-digit OTP");
            return;
        }

        setVerifyingOtp(true);
        setError("");
        console.log("[LoginDebug] Verifying OTP:", otp);

        try {
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession?.user) {
                const { data: adminData } = await supabase
                    .from("admins")
                    .select("id")
                    .eq("auth_user_id", existingSession.user.id)
                    .maybeSingle();

                if (adminData) {
                    setError("An admin account is currently logged in. Please logout from the admin panel first, or use a different browser/incognito window.");
                    setVerifyingOtp(false);
                    return;
                }

                const { data: activeUserData } = await supabase
                    .from("users")
                    .select("id, name, auth_user_id")
                    .eq("auth_user_id", existingSession.user.id)
                    .maybeSingle();

                if (activeUserData) {
                    getReturnUrlAndRedirect();
                    setVerifyingOtp(false);
                    return;
                }
            }

            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;
            let authUser: any = null;

            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                phone: phoneNumber,
                token: otp,
                type: "sms",
            });

            if (verifyError) throw verifyError;
            if (!verifyData.user) throw new Error("Authentication failed");
            authUser = verifyData.user;

            if (pendingUserData) {
                console.log("✅ User found in pendingUserData, authenticating...", pendingUserData);
                if (authUser) {
                    if (!pendingUserData.auth_user_id || pendingUserData.auth_user_id !== authUser.id) {
                        try {
                            const { error: updateError } = await supabase
                                .from("users")
                                .update({ auth_user_id: authUser.id })
                                .eq("id", pendingUserData.id);
                            if (updateError) console.warn("⚠️ Failed to update auth_user_id:", updateError);
                        } catch (updateErr) {
                            console.warn("⚠️ Error updating auth_user_id:", updateErr);
                        }
                    }
                }
                console.log("✅ User authenticated via Supabase Auth session");
                setPendingUserData(null);
                setVerifyingOtp(false);
                getReturnUrlAndRedirect();
                return;
            }

            // Check if user already exists in users table (via Auth ID)
            if (authUser) {
                const { data: existingUser, error: userError } = await supabase
                    .from("users")
                    .select("id, name, phone, auth_user_id")
                    .eq("auth_user_id", authUser.id)
                    .maybeSingle();

                if (userError && userError.code !== "PGRST116") throw userError;

                if (existingUser) {
                    console.log("✅ User authenticated (Found by Auth ID)");
                    setVerifyingOtp(false);
                    getReturnUrlAndRedirect();
                    return;
                }

                console.log("ℹ️ Checking for existing user profile by phone...", phone);
                const { data: profileByPhone, error: profileError } = await supabase
                    .from("users")
                    .select("*")
                    .eq("phone", phone)
                    .maybeSingle();

                if (profileByPhone) {
                    console.log("✅ Found existing profile by phone:", profileByPhone);
                    if (profileByPhone.auth_user_id !== authUser.id) {
                        const { error: linkError } = await supabase
                            .from("users")
                            .update({ auth_user_id: authUser.id })
                            .eq("id", profileByPhone.id);
                        if (linkError) console.error("❌ Link update failed:", linkError);
                    }
                    setVerifyingOtp(false);
                    getReturnUrlAndRedirect();
                    return;
                }
            }

            // New user
            if (isNewUser) {
                setOtpSent(false);
                setOtp("");
                setVerifyingOtp(false);
            } else {
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
        if (!firstName.trim()) { setError("Please enter your name"); return; }
        if (!lastName.trim()) { setError("Please enter your surname"); return; }
        if (selectedCities.length === 0) { setError("Please select at least one city"); return; }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        setLoading(true);
        setError("");

        try {
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession?.user) {
                const { data: activeUserData } = await supabase
                    .from("users")
                    .select("auth_user_id, id, name")
                    .or(`id.eq.${existingSession.user.id},auth_user_id.eq.${existingSession.user.id}`)
                    .maybeSingle();

                if (activeUserData?.auth_user_id) {
                    setError("An admin account is currently logged in.");
                    setLoading(false);
                    return;
                } else if (activeUserData && !activeUserData.auth_user_id) {
                    getReturnUrlAndRedirect();
                    setLoading(false);
                    return;
                }
            }

            const authUserId = (await supabase.auth.getUser()).data.user?.id;
            if (!authUserId) throw new Error("Authentication failed.");

            const { data: existingUserCheck } = await supabase
                .from("users")
                .select("id")
                .eq("id", authUserId)
                .maybeSingle();

            if (existingUserCheck) {
                router.push("/user");
                return;
            }

            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            // Get selected city name for location field
            const selectedCityName = selectedCities.length > 0
                ? cities.find(c => c.id === selectedCities[0])?.name
                : null;

            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert([{
                    id: authUserId,
                    name: fullName,
                    phone: phoneNumber,
                    auth_user_id: authUserId,
                    location: selectedCityName
                }])
                .select()
                .single();

            if (createError) {
                if (createError.code === "23505") {
                    const { data: linkedUser, error: linkError } = await supabase
                        .from("users")
                        .update({
                            auth_user_id: authUserId,
                            location: selectedCityName || undefined // Update location if new one selected
                        })
                        .eq("phone", phoneNumber)
                        .select()
                        .single();

                    if (linkError) throw new Error("Phone number in use, failed to link.");

                    await supabase.from("user_cities").delete().eq("user_id", linkedUser.id);
                    if (selectedCities.length > 0) {
                        await supabase.from("user_cities").insert(
                            selectedCities.map(cityId => ({ user_id: linkedUser.id, city_id: cityId }))
                        );
                    }
                    getReturnUrlAndRedirect();
                    return;
                }
                throw createError;
            }

            if (selectedCities.length > 0) {
                await supabase.from("user_cities").insert(
                    selectedCities.map(cityId => ({ user_id: authUserId, city_id: cityId }))
                );
            }

            getReturnUrlAndRedirect();
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!showLogin) return null;
    if (!isSessionChecked) return null; // Don't show anything while checking session
    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Backdrop Blur Layer */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative max-w-[750px] w-full md:w-[90vw] flex bg-white shadow-[0.5rem_0.5rem_0.8rem_rgba(87,87,87,0.5)] overflow-hidden transition-all duration-500 ease-in-out flex-col md:flex-row z-10 rounded-none min-h-[400px] md:min-h-[450px]`}>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100 rounded-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Left Image Section */}
                <div className="hidden md:flex w-[58%] relative items-center justify-center bg-white">
                    <div className="flex items-center justify-center w-full h-full p-10 relative">
                        <div className="absolute animate-spin" style={{ animationDuration: '20s' }}>
                            <Image
                                src="/ring.svg"
                                alt="Ring"
                                width={260}
                                height={260}
                                className="object-contain brightness-0"
                            />
                        </div>
                        {/* Inner Logo */}
                        <div className="relative z-10">
                            <Image
                                src="/rIta.svg"
                                alt="Logo"
                                width={110}
                                height={110}
                                className="object-contain brightness-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className="w-full md:w-[50%] py-10 px-6 md:py-16 md:px-10 text-center flex flex-col justify-center">
                    {/* Mobile Logo Section */}
                    <div className="flex md:hidden items-center justify-center w-full mb-4 relative py-4 h-[160px]">
                        <div className="absolute animate-spin" style={{ animationDuration: '20s' }}>
                            <Image
                                src="/ring.svg"
                                alt="Ring"
                                width={160}
                                height={160}
                                className="object-contain brightness-0"
                            />
                        </div>
                        <div className="relative z-10">
                            <Image
                                src="/rIta.svg"
                                alt="Logo"
                                width={65}
                                height={65}
                                className="object-contain brightness-0"
                            />
                        </div>
                    </div>

                    <h2 className="text-[1.2rem] font-black mt-2 md:mt-0 text-[#333] uppercase">
                        {otpSent ? "VERIFY OTP" : isNewUser ? "CREATE ACCOUNT" : "LOGIN"}
                    </h2>
                    <p className="mt-1.5 text-[#4d5563] text-[0.8rem]">
                        {otpSent
                            ? "Enter the OTP sent to your phone"
                            : isNewUser
                                ? "Enter your details to create an account"
                                : "Choose your preferred login method"}
                    </p>

                    {otpSent ? (
                        <>
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-[0.75rem] text-[#4d5563] text-left mb-1.5 font-medium ml-1">
                                        Phone Number
                                    </label>
                                    <div className="border border-gray-300 p-3 text-[0.85rem] flex items-center bg-[#f9fafb] rounded-none">
                                        <span className="text-[#374151]">+91</span>
                                        <span className="ml-2 text-[#374151] font-medium tracking-wide">{phone}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[0.75rem] text-[#4d5563] text-left mb-1 font-medium ml-1">
                                        OTP Code <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative border border-gray-300 bg-[#f9fafb] focus-within:border-black transition-colors h-[48px] flex items-center justify-center rounded-none">
                                        {/* Display Layer */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="flex gap-10 text-[0.9rem] text-[#374151] font-medium tracking-normal">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <span key={i} className="w-4 text-center">
                                                        {otp[i] || "-"}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Hidden Input Layer */}
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                setOtp(value);
                                                setError("");
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && otp.length === 4) {
                                                    handleVerifyOtp();
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-text text-center text-xl"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-2.5 px-1">

                                        <div className="flex items-center gap-2">
                                            {otpSent && !canResend ? (
                                                <span className="text-[0.7rem] text-[#6b7280] font-medium">
                                                    Resend in {timer}s
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleLogin()}
                                                    disabled={loading}
                                                    className="text-[0.7rem] text-black font-semibold hover:underline disabled:opacity-50"
                                                >
                                                    RESEND OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-none">
                                    <p className="text-red-600 text-[0.75rem] text-center">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setIsNewUser(false);
                                        setOtp("");
                                        setError("");
                                        setPendingUserData(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors uppercase text-[0.8rem] tracking-wider"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={verifyingOtp || !otp || otp.length !== 4}
                                    className="flex-1 px-4 py-2.5 text-white bg-black border-none cursor-pointer font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-none uppercase text-[0.8rem]"
                                >
                                    {verifyingOtp ? "VERIFYING..." : "VERIFY OTP"}
                                </button>
                            </div>
                        </>
                    ) : !isNewUser ? (
                        <>
                            <div className="border border-[#4d5563] mt-4 p-3 text-[0.8rem] flex items-center rounded-none">
                                <span>+91</span>
                                <input
                                    type="tel"
                                    pattern="[0-9]*"
                                    maxLength={10}
                                    inputMode="numeric"
                                    value={phone}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, "");
                                        // If user pastes 918888888888, remove the 91
                                        if (val.length > 10 && val.startsWith("91")) val = val.substring(2);
                                        // Slice to 10 digits
                                        if (val.length > 10) val = val.slice(0, 10);
                                        setPhone(val);
                                        setError("");
                                    }}
                                    className="w-full outline-none border-none ml-2 bg-transparent"
                                    placeholder="Enter phone number"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && phone.length >= 10) {
                                            handleLogin();
                                        }
                                    }}
                                />
                            </div>

                            {error && (
                                <p className="mt-2 text-red-500 text-xs text-left">{error}</p>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={loading || !phone || phone.length < 4}
                                className="mt-4 w-full p-3 text-white bg-black border-none cursor-pointer font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                            >
                                {loading ? "SENDING..." : "LOGIN"}
                            </button>
                        </>
                    ) : (
                        <div className="mt-4 text-left">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFirstName(val ? val.charAt(0).toUpperCase() + val.slice(1) : val);
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && firstName && lastName) {
                                                handleCreateNewUser();
                                            }
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                                        placeholder="First Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLastName(val ? val.charAt(0).toUpperCase() + val.slice(1) : val);
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && firstName && lastName) {
                                                handleCreateNewUser();
                                            }
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                                        placeholder="Surname"
                                    />
                                </div>

                                {/* City Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>

                                    {selectedCities.length > 0 && selectedCities[0] ? (
                                        <div className="w-full p-2 border border-gray-300 bg-gray-50 flex justify-between items-center rounded-none">
                                            <span className="text-sm text-gray-800 font-medium">
                                                {cities.find(c => c.id === selectedCities[0])?.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCities([]);
                                                    setCitySearch("");
                                                    setHighlightedIndex(-1);
                                                }}
                                                className="text-gray-500 hover:text-black p-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative mb-2">
                                            <input
                                                type="text"
                                                value={citySearch}
                                                onChange={(e) => {
                                                    setCitySearch(e.target.value);
                                                    setHighlightedIndex(-1);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (!citySearch) return;

                                                    if (e.key === "ArrowDown") {
                                                        e.preventDefault();
                                                        setHighlightedIndex(prev =>
                                                            prev < filteredCities.length - 1 ? prev + 1 : prev
                                                        );
                                                    } else if (e.key === "ArrowUp") {
                                                        e.preventDefault();
                                                        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                                                    } else if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
                                                            const city = filteredCities[highlightedIndex];
                                                            setSelectedCities([city.id]);
                                                            setCitySearch("");
                                                            setHighlightedIndex(-1);
                                                        }
                                                    }
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-none focus:outline-none focus:border-black text-sm"
                                                placeholder="Search city..."
                                            />

                                            {citySearch && (
                                                <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 max-h-40 overflow-y-auto shadow-lg rounded-none">
                                                    {filteredCities.map((city, index) => (
                                                        <div
                                                            key={city.id}
                                                            onClick={() => {
                                                                setSelectedCities([city.id]);
                                                                setCitySearch("");
                                                                setHighlightedIndex(-1);
                                                            }}
                                                            className={`p-2 text-sm cursor-pointer ${index === highlightedIndex ? "bg-gray-100" : "hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            {city.name}
                                                        </div>
                                                    ))}
                                                    {filteredCities.length === 0 && (
                                                        <div className="p-2 text-sm text-gray-500">No matching cities found.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}


                                </div>

                                {error && (
                                    <p className="text-red-500 text-xs">{error}</p>
                                )}

                                <button
                                    onClick={handleCreateNewUser}
                                    disabled={loading || !firstName || !lastName}
                                    className="w-full p-3 bg-black text-white font-bold tracking-wide hover:opacity-90 disabled:opacity-50 rounded-none"
                                >
                                    {loading ? "CREATING..." : "CREATE ACCOUNT"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.getElementById('modal-root') || document.body
    );
}
