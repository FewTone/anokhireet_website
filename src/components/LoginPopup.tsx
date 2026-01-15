"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getOtpChannel } from "@/lib/devConfig";

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
            console.log("[LoginDebug] Invalid phone number entered:", phone);
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        console.log("[LoginDebug] Starting login flow with phone:", phone);

        setLoading(true);
        setError("");

        try {
            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;
            console.log("[LoginDebug] Normalized phone number:", phoneNumber);

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
            console.log("[LoginDebug] Existing user check result:", existingUser ? "Found" : "Not Found", existingUser);

            if (existingUser) {
                // Check if this user is an admin (check admins table)
                const userIdToCheck = existingUser.auth_user_id || existingUser.id;
                const { data: adminCheck } = await supabase
                    .from("admins")
                    .select("id")
                    .eq("auth_user_id", userIdToCheck)
                    .maybeSingle();

                if (adminCheck) {
                    console.log("[LoginDebug] Admin account detected, blocking login");
                    setError("This is an admin account. Please use the admin panel to login.");
                    setLoading(false);
                    return;
                }

                // User exists - store user data for OTP verification
                // Whether they have auth_user_id or not, they need OTP verification
                setPendingUserData({
                    id: existingUser.id,
                    name: existingUser.name,
                    phone: existingUser.phone,
                    email: existingUser.email,
                    auth_user_id: existingUser.auth_user_id
                });
                setIsNewUser(false);
            } else {
                // New user
                setIsNewUser(true);
                setPendingUserData(null);
            }



            // Send OTP using configured channel (SMS for testing, WhatsApp for production)
            const otpChannel = getOtpChannel();
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: phoneNumber,
                options: {
                    channel: otpChannel, // 'sms' for testing, 'whatsapp' for production
                },
            });

            if (otpError) {
                console.error("[LoginDebug] ❌ OTP sending failed:", otpError.message);

                // Provide helpful error messages
                if (otpError.message.includes("whatsapp") || otpError.message.includes("WhatsApp")) {
                    setError(
                        "WhatsApp OTP not configured. Please:\n" +
                        "1. Set up Twilio Verify WhatsApp in Supabase Dashboard\n" +
                        "2. Configure WhatsApp Sender in Twilio\n" +
                        "3. Or use a TEST PHONE NUMBER (e.g., +91 1234567890) from Supabase Dashboard > Auth > Providers > Phone\n\n" +
                        "If you use a Test Number, the OTP is always the one you set (e.g., 000000)."
                    );
                } else if (otpError.message.includes("Twilio") || otpError.message.includes("provider")) {
                    setError(
                        "Twilio not configured. For development:\n" +
                        "1. Go to Supabase Dashboard > Authentication > Providers > Phone\n" +
                        "2. Add your number to 'Phone Numbers for Testing'\n" +
                        "3. Use that number and the fixed OTP (e.g., 000000) you configured.\n\n" +
                        "Real SMS requires a paid Twilio account."
                    );
                } else {
                    setError(`Failed to send OTP: ${otpError.message}\n\nHint: Use a Test Phone Number in Supabase Dashboard for development.`);
                }
                setLoading(false);
                return;
            }

            console.log("[LoginDebug] OTP sent successfully via channel:", otpChannel);

            setOtpSent(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to send OTP. Please try again.");
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            console.log("[LoginDebug] Invalid OTP entered:", otp);
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setVerifyingOtp(true);
        setError("");

        try {
            console.log("[LoginDebug] Verifying OTP:", otp);
            const normalizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = `+91${normalizedPhone}`;

            // Verify OTP normally
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                phone: phoneNumber,
                token: otp,
                type: 'sms',
            });

            if (verifyError) throw verifyError;
            const session = verifyData.session;

            if (!session?.user) {
                console.error("[LoginDebug] OTP verification failed: No session user found");
                throw new Error("OTP verification failed. Please try again.");
            }

            console.log("[LoginDebug] Session established for user:", session.user.id);

            // Handle user creation/update
            if (pendingUserData) {
                console.log("[LoginDebug] Updating existing user data");
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

                console.log("[LoginDebug] New user created");

                if (insertError) throw insertError;
            }

            // Success - call callback and close
            console.log("[LoginDebug] Login successful, calling onLoginSuccess");
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
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

