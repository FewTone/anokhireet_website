"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
// import { isOtpBypassEnabled } from "@/lib/devConfig";

export default function UserPage() {
    const [userName, setUserName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Effect for handling loading timeout
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (loading) {
            timeoutId = setTimeout(() => {
                console.warn("⚠️ UserPage Loading timeout - redirecting to profile.");
                setLoading(false);
                router.push("/profile");
            }, 10000); // 10 second timeout
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [loading, router]);

    // Effect for loading data and setting up auth listeners
    useEffect(() => {
        loadUserData();

        // ========== NORMAL USER FLOW ==========
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // In bypass mode, ignore auth state changes (since we rely on localStorage)
            // if (isOtpBypassEnabled()) return;

            if (session?.user) {
                loadUserData();
            } else {
                // Don't redirect immediately on auth change if we are still loading initial data
                // But if we clearly lost session, we should handle it.
                // For now, relying on loadUserData to make the final decision is safer.
                // But to be consistent with original logic:
                if (!loading) {
                    // If we were loaded and session vanished, then redirect.
                    // Check bypass first purely to be safe, though callback above handles it.
                    // if (!isOtpBypassEnabled()) {
                    router.push("/profile");
                    // }
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, loading]); // Added 'loading' to dependencies to ensure `loading` in callback is fresh

    const loadUserData = async () => {
        try {
            // ========== NORMAL USER FLOW ==========
            // Check Supabase Auth session only (no localStorage)
            // console.log("🔍 loadUserData: Checking Supabase session");
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            // console.log("session check result", { session: !!session, error: sessionError });

            if (!session?.user || sessionError) {
                // No active session - redirect to login
                setLoading(false);
                router.push("/profile");
                return;
            }

            // Check if user is admin (in admins table)
            // Then find user in users table by auth_user_id
            const { data: adminData } = await supabase
                .from("admins")
                .select("id, email")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            if (adminData) {
                // User is admin - redirect to admin panel
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    // Ignore signOut errors
                }
                setLoading(false);
                router.push("/admin");
                return;
            }

            // Check if user exists in users table
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, name, phone, auth_user_id")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            if (userError || !userData) {
                // User not found - sign out and redirect
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    // Ignore signOut errors
                }
                setLoading(false);
                router.push("/admin");
                return;
            }

            // Regular user - set data from database
            setUserName(userData.name);
            setUserPhone(userData.phone || "");
            setLoading(false);
        } catch (error) {
            console.error("Error loading user data:", error);
            // On error, try to sign out and redirect to login
            try {
                await supabase.auth.signOut();
            } catch (e) {
                // Ignore signOut errors
            }
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            localStorage.removeItem("userPhone");
            localStorage.removeItem("userEmail");
            setLoading(false);
            // Use setTimeout to ensure state is updated before redirect
            setTimeout(() => {
                router.push("/profile");
            }, 100);
        }
    };

    const handleLogout = async () => {
        try {
            // ========== NORMAL USER FLOW ==========
            // Regular user - sign out from Supabase Auth
            await supabase.auth.signOut();

            // Clear all localStorage
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            localStorage.removeItem("userPhone");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("pendingUserData");
            router.push("/profile");
        } catch (error) {
            console.error("Error signing out:", error);
            // Still clear localStorage and redirect even if signOut fails
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            localStorage.removeItem("userPhone");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("pendingUserData");
            router.push("/profile");
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white pt-20 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-8">User Profile</h1>

                    {loading ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-500 block mb-2">
                                    Name
                                </label>
                                <p className="text-lg text-gray-900">{userName || "Not available"}</p>
                            </div>

                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-500 block mb-2">
                                    Phone Number
                                </label>
                                <p className="text-lg text-gray-900">{userPhone || "Not available"}</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="px-6 py-2 bg-black text-white font-medium hover:opacity-90 transition-opacity"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}

