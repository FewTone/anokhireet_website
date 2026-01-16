"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName } from "@/lib/utils";
import MyProductsView from "@/components/dashboard/MyProductsView";
import WishlistView from "@/components/dashboard/WishlistView";
import ProfileView from "@/components/dashboard/ProfileView";
import SettingsView from "@/components/dashboard/SettingsView";

type View = "my-products" | "wishlist" | "profile" | "settings";

export default function UserPage() {
    const [userName, setUserName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [userLocation, setUserLocation] = useState("");
    const [userGender, setUserGender] = useState("");
    const [userBirthdate, setUserBirthdate] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<View>("my-products");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Effect for active view from URL
    useEffect(() => {
        const viewParam = searchParams.get("view");
        if (viewParam) {
            setActiveView(viewParam as View);
        }
    }, [searchParams]);

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
        // loadUserData(); // REMOVED: Rely on onAuthStateChange to avoid race conditions

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUserData();
            } else {
                setLoading(false);
                router.push("/profile");
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
                .select("id, name, phone, auth_user_id, location, gender, birthdate, avatar_url")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            if (userError || !userData) {
                try { await supabase.auth.signOut(); } catch (e) { }
                setLoading(false);
                // If user auth exists but no profile data, redirect to profile to create/complete account
                // Do NOT redirect to admin
                router.push("/profile");
                return;
            }

            setUserId(userData.id);
            setUserName(userData.name);
            setUserPhone(userData.phone || "");
            setUserEmail(session.user.email || "");
            setUserLocation(userData.location || "");
            setUserGender(userData.gender || "");
            setUserBirthdate(userData.birthdate || "");
            setUserAvatar(userData.avatar_url || "");
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

    const navItems = [
        { label: "MY PRODUCTS", id: "my-products" as View },
        { label: "WISHLIST", id: "wishlist" as View },
        { label: "PROFILE", id: "profile" as View },
        { label: "SETTINGS", id: "settings" as View },
    ];

    const renderContent = () => {
        switch (activeView) {
            case "my-products":
                return <MyProductsView />;
            case "wishlist":
                return <WishlistView />;
            case "profile":
                return <ProfileView
                    userName={userName}
                    userPhone={userPhone}
                    userEmail={userEmail}
                    userLocation={userLocation}
                    userGender={userGender}
                    userBirthdate={userBirthdate}
                    userAvatar={userAvatar}
                    userId={userId}
                    onUpdate={loadUserData}
                />;
            case "settings":
                return <SettingsView />;
            default:
                return <MyProductsView />;
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-[calc(100vh-70px)] bg-white">
                <div className="flex flex-col md:flex-row min-h-[calc(100vh-70px)] max-w-[1400px] mx-auto">

                    {/* Left Sidebar */}
                    <div className="w-full md:w-[320px] p-6 hidden md:block">
                        <div className="bg-white border border-gray-200 w-full mb-8">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium relative overflow-hidden border border-gray-100">
                                        {userAvatar ? (
                                            <Image
                                                src={userAvatar}
                                                alt={userName || "User"}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U"
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Hello,</p>
                                        <p className="text-sm font-semibold text-gray-900">{userName || "User"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Items */}
                            <nav className="flex flex-col">
                                {navItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setActiveView(item.id);
                                            router.push(`/user?view=${item.id}`, { scroll: false });
                                        }}
                                        className={`flex items-center justify-between px-5 py-4 text-[13px] font-semibold tracking-wide uppercase transition-colors w-full text-left border-b border-gray-50 last:border-0 ${activeView === item.id
                                            ? "bg-gray-100 text-black"
                                            : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{item.label}</span>

                                        </div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                ))}
                                <a
                                    href="https://wa.me/918200647176"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between px-5 py-4 text-[13px] font-semibold tracking-wide uppercase transition-colors w-full text-left border-b border-gray-50 bg-gray-100 text-black hover:bg-gray-200"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Quick chat</span>
                                    </div>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </a>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-2 md:p-4 border-l border-gray-100">
                        {loading ? (
                            <div className="animate-pulse space-y-8">
                                <div className="h-48 bg-gray-200 rounded"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="h-32 bg-gray-200 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full fade-in">
                                {renderContent()}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
