"use client";

import { useState, useEffect } from "react";
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

export default function LoginModal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const showLogin = searchParams.get('login') === 'true';

    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false); // Changed default to false
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<PendingUserData | null>(null);

    const [cities, setCities] = useState<any[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [showAddCity, setShowAddCity] = useState(false);
    const [newCityName, setNewCityName] = useState("");

    useEffect(() => {
        if (showLogin) {
            checkSession();
            loadCities();
        }
    }, [showLogin]);

    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('login');
        router.push(params.toString() ? `/?${params.toString()}` : '/');
    };

    // Helper function to get return URL and redirect
    const getReturnUrlAndRedirect = () => {
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
                    return;
                }
            }
        } catch (e) {
            console.error("🔍 [Profile] Session check error:", e);
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
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to login. Please try again.");
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
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

            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert([{
                    id: authUserId,
                    name: fullName,
                    phone: phoneNumber,
                    auth_user_id: authUserId,
                }])
                .select()
                .single();

            if (createError) {
                if (createError.code === "23505") {
                    const { data: linkedUser, error: linkError } = await supabase
                        .from("users")
                        .update({ auth_user_id: authUserId })
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
                    router.push("/user");
                    return;
                }
                throw createError;
            }

            if (selectedCities.length > 0) {
                await supabase.from("user_cities").insert(
                    selectedCities.map(cityId => ({ user_id: authUserId, city_id: cityId }))
                );
            }

            router.push("/user");
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!showLogin) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Layer */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative max-w-[750px] w-full md:w-[90vw] flex bg-white shadow-[0.5rem_0.5rem_0.8rem_rgba(87,87,87,0.5)] overflow-hidden transition-all duration-500 ease-in-out ${otpSent ? "min-h-[60vh]" : "min-h-[50vh]"} flex-col md:flex-row z-10 rounded-sm`}>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Left Image Section */}
                <div className="hidden md:flex w-[58%] relative items-center justify-center bg-white">
                    <div className="flex items-center justify-center w-full h-full p-8 relative">
                        <div className="absolute animate-spin" style={{ animationDuration: '20s' }}>
                            <Image
                                src="/ring.svg"
                                alt="Ring"
                                width={300}
                                height={300}
                                className="object-contain"
                            />
                        </div>
                        {/* Inner Logo */}
                        <div className="relative z-10">
                            <Image
                                src="/rIta.svg"
                                alt="Logo"
                                width={120}
                                height={120}
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className="w-full md:w-[50%] p-8 md:p-12 text-center flex flex-col justify-center">
                    {/* Mobile Logo Section */}
                    <div className="flex md:hidden items-center justify-center w-full mb-6 relative py-4 h-[200px]">
                        <div className="absolute animate-spin" style={{ animationDuration: '20s' }}>
                            <Image
                                src="/ring.svg"
                                alt="Ring"
                                width={200}
                                height={200}
                                className="object-contain brightness-0"
                            />
                        </div>
                        <div className="relative z-10">
                            <Image
                                src="/rIta.svg"
                                alt="Logo"
                                width={80}
                                height={80}
                                className="object-contain brightness-0"
                            />
                        </div>
                    </div>

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

                    {otpSent ? (
                        <>
                            <div className="mt-8 space-y-6">
                                <div>
                                    <label className="block text-[0.75rem] text-[#4d5563] text-left mb-1.5 font-medium ml-1">
                                        Phone Number
                                    </label>
                                    <div className="border border-gray-300 p-3 text-[0.85rem] flex items-center bg-[#f9fafb] rounded-none">
                                        <span className="font-bold text-[#374151]">+91</span>
                                        <span className="ml-2 text-[#374151] font-medium tracking-wide">{phone}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[0.75rem] text-[#4d5563] text-left mb-1.5 font-medium ml-1">
                                        OTP Code <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "");
                                                setOtp(value);
                                                setError("");
                                            }}
                                            className="w-full h-14 border-2 border-black text-center text-2xl font-bold rounded-none focus:outline-none tracking-[0.75rem] pr-[-0.75rem]"
                                            autoFocus
                                            placeholder="------"
                                        />
                                    </div>
                                    <p className="text-[0.7rem] text-[#6b7280] mt-2.5 text-center">
                                        Enter the 6-digit code sent to your phone
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-none">
                                    <p className="text-red-600 text-[0.75rem] text-center">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setIsNewUser(false);
                                        setOtp("");
                                        setError("");
                                        setPendingUserData(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors uppercase text-[0.8rem] tracking-wider"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={verifyingOtp || !otp || otp.length !== 6}
                                    className="flex-1 px-4 py-3 text-white bg-black border-none cursor-pointer font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-none uppercase text-[0.8rem]"
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
                                        if (val.length > 10 && val.startsWith("91")) val = val.substring(2);
                                        if (val.length > 10) val = val.slice(0, 10);
                                        setPhone(val);
                                        setError("");
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
                                className="mt-4 w-full p-4 text-white bg-black border-none cursor-pointer font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
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
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                                        placeholder="First Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-none focus:outline-none focus:border-black"
                                        placeholder="Last Name"
                                    />
                                </div>

                                {/* City Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City (Optional)</label>

                                    {cities.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2 mb-2 max-h-40 overflow-y-auto">
                                            {cities.map((city) => (
                                                <div
                                                    key={city.id}
                                                    onClick={() => {
                                                        setSelectedCities(prev =>
                                                            prev.includes(city.id)
                                                                ? prev.filter(id => id !== city.id)
                                                                : [...prev, city.id]
                                                        );
                                                    }}
                                                    className={`p-2 border text-sm cursor-pointer transition-colors ${selectedCities.includes(city.id)
                                                        ? "bg-black text-white border-black"
                                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                                        }`}
                                                >
                                                    {city.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 mb-2">No cities available.</p>
                                    )}

                                    {!showAddCity ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddCity(true)}
                                            className="text-sm text-black underline hover:text-gray-700"
                                        >
                                            + Add New City
                                        </button>
                                    ) : (
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={newCityName}
                                                onChange={(e) => setNewCityName(e.target.value)}
                                                className="flex-1 p-2 border border-gray-300 text-sm"
                                                placeholder="Enter city name"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddNewCity}
                                                className="px-3 py-2 bg-black text-white text-sm"
                                            >
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddCity(false)}
                                                className="px-3 py-2 bg-gray-200 text-gray-800 text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-red-500 text-xs">{error}</p>
                                )}

                                <button
                                    onClick={handleCreateNewUser}
                                    disabled={loading || !firstName || !lastName}
                                    className="w-full p-3 bg-black text-white font-bold tracking-wide hover:opacity-90 disabled:opacity-50"
                                >
                                    {loading ? "CREATING..." : "CREATE ACCOUNT"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
