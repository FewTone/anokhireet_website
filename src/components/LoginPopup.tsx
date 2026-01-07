"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface LoginPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

export default function LoginPopup({ isOpen, onClose, onLoginSuccess }: LoginPopupProps) {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<{
        id: string;
        name: string;
        phone: string;
        email: string | null;
        auth_user_id: string | null;
    } | null>(null);

    if (!isOpen) return null;

    const handleSendOTP = async () => {
        if (!phone || phone.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            // Check if user exists in database
            const { data: allUsers, error: allUsersError } = await supabase
                .from("users")
                .select("id, name, phone, email, auth_user_id");

            if (allUsersError) {
                throw allUsersError;
            }

            let existingUser = null;
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

            if (existingUser) {
                // User exists - check if auth_user_id exists
                if (existingUser.auth_user_id) {
                    // User already has auth_user_id - generate OTP for login
                    setPendingUserData({
                        id: existingUser.id,
                        name: existingUser.name,
                        phone: existingUser.phone,
                        email: existingUser.email,
                        auth_user_id: existingUser.auth_user_id
                    });
                    setIsNewUser(false);
                } else {
                    // User exists but no auth_user_id - still need OTP verification
                    setPendingUserData({
                        id: existingUser.id,
                        name: existingUser.name,
                        phone: existingUser.phone,
                        email: existingUser.email,
                        auth_user_id: null
                    });
                    setIsNewUser(false);
                }
            } else {
                // New user
                setIsNewUser(true);
                setPendingUserData(null);
            }

            // Send OTP (or use bypass for testing)
            const OTP_BYPASS = "000000";
            const testOtp = OTP_BYPASS;

            // For testing: auto-verify with bypass code
            if (testOtp === OTP_BYPASS) {
                console.log("⚠️ Using OTP bypass for testing");
                setOtpSent(true);
                setOtp(OTP_BYPASS);
                setLoading(false);
                // Auto-verify after a short delay
                setTimeout(() => {
                    handleVerifyOtp();
                }, 500);
                return;
            }

            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: phoneNumber,
            });

            if (otpError) {
                console.warn("OTP sending failed:", otpError.message);
            }

            setOtpSent(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to send OTP. Please try again.");
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setVerifyingOtp(true);
        setError("");

        try {
            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;
            const OTP_BYPASS = "000000";

            let session;
            if (otp === OTP_BYPASS) {
                // Bypass OTP - create session directly
                console.log("⚠️ Using OTP bypass - creating session");
                
                // Sign in with OTP bypass
                const { data: signInData, error: signInError } = await supabase.auth.signInWithOtp({
                    phone: phoneNumber,
                });

                if (signInError && !signInError.message.includes("already registered")) {
                    // Try to sign in with password (for testing)
                    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError || !sessionData.session) {
                        // Create a test session
                        throw new Error("Please enter OTP: 000000 for testing");
                    }
                    session = sessionData.session;
                } else {
                    // Use magic link or create session
                    const { data: { session: newSession } } = await supabase.auth.getSession();
                    session = newSession;
                }

                // If still no session, we need to handle this differently
                if (!session) {
                    throw new Error("Session creation failed. Please try OTP: 000000");
                }
            } else {
                // Verify OTP normally
                const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                    phone: phoneNumber,
                    token: otp,
                    type: 'sms',
                });

                if (verifyError) throw verifyError;
                session = verifyData.session;
            }

            if (!session?.user) {
                throw new Error("OTP verification failed. Please try again.");
            }

            // Handle user creation/update
            if (pendingUserData) {
                // Existing user - update auth_user_id if needed
                if (!pendingUserData.auth_user_id) {
                    const { error: updateError } = await supabase
                        .from("users")
                        .update({ auth_user_id: session.user.id })
                        .eq("id", pendingUserData.id);

                    if (updateError) throw updateError;
                }
            } else if (isNewUser) {
                // New user - create profile
                const userName = newUserName.trim() || "User";
                const { error: insertError } = await supabase
                    .from("users")
                    .insert([{
                        phone: phoneNumber,
                        name: userName,
                        email: newUserEmail.trim() || null,
                        auth_user_id: session.user.id,
                        role: 'renter'
                    }]);

                if (insertError) throw insertError;
            }

            // Success - call callback and close
            onLoginSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message || "OTP verification failed. Please try again.");
            setVerifyingOtp(false);
        }
    };

    const handleClose = () => {
        setPhone("");
        setOtp("");
        setError("");
        setOtpSent(false);
        setIsNewUser(false);
        setNewUserName("");
        setNewUserEmail("");
        setPendingUserData(null);
        setLoading(false);
        setVerifyingOtp(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2 className="text-2xl font-bold mb-6">Login to Continue</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {!otpSent ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="Enter 10-digit phone number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                maxLength={10}
                            />
                        </div>
                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isNewUser && !pendingUserData && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center text-2xl tracking-widest"
                                maxLength={6}
                            />
                            <p className="text-sm text-gray-500 mt-2">Enter OTP: <strong>000000</strong> for testing</p>
                        </div>

                        <button
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || !otp || otp.length !== 6}
                            className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {verifyingOtp ? "Verifying..." : "Verify OTP & Login"}
                        </button>

                        <button
                            onClick={() => {
                                setOtpSent(false);
                                setOtp("");
                                setError("");
                            }}
                            className="w-full text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Change Phone Number
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

