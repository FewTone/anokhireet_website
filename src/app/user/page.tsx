"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName } from "@/lib/utils";

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUserData();
            } else {
                if (!loading) {
                    router.push("/profile");
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, loading]);

    const loadUserData = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (!session?.user || sessionError) {
                setLoading(false);
                router.push("/profile");
                return;
            }

            // Check admin
            const { data: adminData } = await supabase
                .from("admins")
                .select("id")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            if (adminData) {
                try { await supabase.auth.signOut(); } catch (e) { }
                setLoading(false);
                router.push("/admin");
                return;
            }

            // Check user
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, name, phone, auth_user_id")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            if (userError || !userData) {
                try { await supabase.auth.signOut(); } catch (e) { }
                setLoading(false);
                router.push("/admin");
                return;
            }

            setUserName(userData.name);
            setUserPhone(userData.phone || "");
            setLoading(false);
        } catch (error) {
            console.error("Error loading user data:", error);
            try { await supabase.auth.signOut(); } catch (e) { }
            localStorage.clear();
            setLoading(false);
            setTimeout(() => {
                router.push("/profile");
            }, 100);
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

    const getInitials = (name: string) => {
        return name
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "U";
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50 pt-32 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">

                    {/* Header Section */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-light text-black tracking-tight mb-2">My Account</h1>
                        <p className="text-gray-500">Manage your profile and view your activity.</p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
                            <div className="md:col-span-1 h-64 bg-gray-200 rounded-xl"></div>
                            <div className="md:col-span-2 h-64 bg-gray-200 rounded-xl"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                            {/* Left Sidebar - Profile Card */}
                            <div className="md:col-span-4 lg:col-span-3">
                                <div className="bg-white rounded-2xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 text-center sticky top-32">
                                    <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-3xl font-light mx-auto mb-6 shadow-lg">
                                        {getInitials(userName)}
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{formatUserDisplayName(userName) || "User"}</h2>
                                    <p className="text-sm text-gray-500 mb-8 font-mono">{userPhone}</p>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            </div>

                            {/* Right Content - Quick Actions */}
                            <div className="md:col-span-8 lg:col-span-9 space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Wishlist Box */}
                                    <Link href="/wishlist" className="group">
                                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 h-full flex flex-col items-start relative overflow-hidden">
                                            <div className="bg-red-50 p-4 rounded-full mb-6 group-hover:bg-red-100 transition-colors z-10">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-medium text-gray-900 mb-2 z-10">Wishlist</h4>
                                            <p className="text-gray-500 text-sm z-10">View specific items you have saved for later.</p>

                                            <div className="mt-6 flex items-center text-sm font-medium text-black group-hover:underline z-10">
                                                View Wishlist
                                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                            </div>

                                            {/* Decorative bg element */}
                                            <div className="absolute -bottom-4 -right-4 text-gray-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* My Products Box */}
                                    <Link href="/my-products" className="group">
                                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 h-full flex flex-col items-start relative overflow-hidden">
                                            <div className="bg-blue-50 p-4 rounded-full mb-6 group-hover:bg-blue-100 transition-colors z-10">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-medium text-gray-900 mb-2 z-10">My Products</h4>
                                            <p className="text-gray-500 text-sm z-10">Manage your product collection and additions.</p>

                                            <div className="mt-6 flex items-center text-sm font-medium text-black group-hover:underline z-10">
                                                Manage Products
                                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                            </div>

                                            {/* Decorative bg element */}
                                            <div className="absolute -bottom-4 -right-4 text-gray-50 opacity-50 transform rotate-[10deg] group-hover:scale-110 transition-transform duration-500">
                                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
