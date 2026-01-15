"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function SettingsView() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [emailFormVisible, setEmailFormVisible] = useState(false);
    const [linkEmail, setLinkEmail] = useState("");
    // const [linkPassword, setLinkPassword] = useState(""); // Removed for OTP flow

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
    };

    const linkGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/user?view=settings`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error linking Google:", error);
            alert("Failed to link Google account");
        }
    };

    const handleLinkEmail = async () => {
        if (!linkEmail) {
            alert("Please enter email");
            return;
        }

        try {
            const { data, error } = await supabase.auth.updateUser({
                email: linkEmail
            });

            if (error) throw error;

            alert("Confirmation email sent! Please check your inbox to verify and complete linking.");
            setEmailFormVisible(false);
            setLinkEmail("");
            loadUser();
        } catch (error: any) {
            console.error("Error linking email:", error);
            alert(`Failed to link email: ${error.message}`);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            localStorage.clear();
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
            localStorage.clear();
            router.push("/");
        }
    };

    const items = [
        { label: "PRIVACY POLICY", href: "/privacy-policy" },
        { label: "ABOUT US", href: "/about" },
        { label: "LOGOUT", action: handleLogout },
        { label: "DELETE ACCOUNT", href: "/delete-account" },
        { label: "TERMS & CONDITIONS", href: "/terms" },
    ];

    return (
        <div className="w-full">
            <h2 className="text-xl font-bold mb-8 text-center tracking-wide uppercase">Settings</h2>

            <div className="bg-white rounded-md overflow-hidden max-w-2xl mx-auto mb-8">
                <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Linked Accounts</h3>
                </div>
                {loading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Loading account details...</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {/* Phone */}
                        <div className="flex items-center justify-between px-4 py-4">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-gray-100 rounded-full">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Phone Number</p>
                                    <p className="text-xs text-gray-500">{user?.phone || "Not linked"}</p>
                                </div>
                            </div>
                            {user?.phone && <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded">Connected</span>}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col px-4 py-4">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <span className="p-2 bg-gray-100 rounded-full">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Email Address</p>
                                        <p className="text-xs text-gray-500">{user?.email || "Not linked"}</p>
                                    </div>
                                </div>
                                {user?.email ? (
                                    <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded">Connected</span>
                                ) : (
                                    <button
                                        onClick={() => setEmailFormVisible(!emailFormVisible)}
                                        className="text-xs font-bold text-black border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
                                    >
                                        {emailFormVisible ? "Cancel" : "Link"}
                                    </button>
                                )}
                            </div>

                            {/* Email Link Form */}
                            {emailFormVisible && !user?.email && (
                                <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-3">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={linkEmail}
                                            onChange={(e) => setLinkEmail(e.target.value)}
                                            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                                        />

                                        <button
                                            onClick={handleLinkEmail}
                                            className="w-full bg-black text-white text-xs font-bold py-2 rounded hover:opacity-90"
                                        >
                                            SEND VERIFICATION EMAIL
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        * You will receive a confirmation link to verify this email address.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Google */}
                        <div className="flex items-center justify-between px-4 py-4">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-gray-100 rounded-full">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23.52 12.32c0-1.04-.1-2.04-.26-3.04H12v6.26h6.46C17.65 18.04 15.02 19.68 12 19.68c-4.28 0-7.76-3.48-7.76-7.76s3.48-7.76 7.76-7.76c2.09 0 3.98.74 5.48 2.08l4.42-4.42C19.22.28 15.78-1 12-1 4.81-1-1 4.81-1 12s5.81 13 13 13c6.88 0 12.56-5.06 12.56-12.68z" fill="#757575" />
                                        <path d="M23.52 12.32c0-1.04-.1-2.04-.26-3.04H12v6.26h6.46c-.57 2.75-2.88 4.93-5.69 5.37l4.47 3.55c3.5-3.23 5.52-7.98 5.52-12.14z" fill="#4285F4" />
                                        <path d="M5.33 7.54l-4.47-3.55C2.65 1.25 7 1 12 1v5.6c-2.61 0-4.99 1.15-6.67 3.04z" fill="#EA4335" />
                                        <path d="M12 19.68c-1.92 0-3.69-.64-5.11-1.72l-4.47 3.55C5.29 24.36 8.52 26 12 26c3.09 0 5.86-1.15 7.99-3.05l-4.47-3.55c-1.05.74-2.31 1.18-3.52 1.18z" fill="#34A853" />
                                        <path d="M1.77 15.68C1.29 14.54 1 13.3 1 12s.29-2.54.77-3.69l4.47 3.55c-.21.84-.33 1.72-.33 2.65s.12 1.81.33 2.65l-4.47 3.55z" fill="#FBBC05" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Google</p>
                                    <p className="text-xs text-gray-500">{user?.app_metadata?.provider === 'google' || user?.identities?.some((i: any) => i.provider === 'google') ? (user?.email || "Connected") : "Not linked"}</p>
                                </div>
                            </div>
                            {user?.app_metadata?.provider === 'google' || user?.identities?.some((i: any) => i.provider === 'google') ? (
                                <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded">Connected</span>
                            ) : (
                                <button
                                    onClick={linkGoogle}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                >
                                    Link
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-md overflow-hidden max-w-2xl mx-auto">
                {items.map((item, index) => (
                    <div
                        key={index}
                        onClick={item.action ? item.action : () => router.push(item.href || "#")}
                        className="flex items-center justify-between px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                        <span className="text-sm font-medium text-gray-800 tracking-wide uppercase">{item.label}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-gray-600">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                ))}
            </div>
        </div>
    );
}
