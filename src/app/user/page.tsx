"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName } from "@/lib/utils";
import MyProductsView from "@/components/dashboard/MyProductsView";
import WishlistView from "@/components/dashboard/WishlistView";
import ProfileView from "@/components/dashboard/ProfileView";
import SettingsView from "@/components/dashboard/SettingsView";
import ReferEarnView from "@/components/dashboard/ReferEarnView";

type View = "my-products" | "wishlist" | "profile" | "settings" | "refer-earn" | "orders" | "addresses" | "refunds" | "gift-cards" | "reviews" | "stores" | "help";

export default function UserPage() {
    const [userName, setUserName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [userLocation, setUserLocation] = useState("");
    const [userGender, setUserGender] = useState("");
    const [userBirthdate, setUserBirthdate] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<View>("my-products");
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
                .select("id, name, phone, auth_user_id, location, gender, birthdate")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            if (userError || !userData) {
                try { await supabase.auth.signOut(); } catch (e) { }
                setLoading(false);
                router.push("/admin");
                return;
            }

            setUserId(userData.id);
            setUserName(userData.name);
            setUserPhone(userData.phone || "");
            setUserEmail(session.user.email || "");
            setUserLocation(userData.location || "");
            setUserGender(userData.gender || "");
            setUserBirthdate(userData.birthdate || "");
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

    const getInitials = (name: string) => {
        return name
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "U";
    };

    const navItems = [
        { label: "MY PRODUCTS", id: "my-products" as View },
        { label: "WISHLIST", id: "wishlist" as View },
        { label: "PROFILE", id: "profile" as View },
        { label: "SETTINGS", id: "settings" as View },
        { label: "REFER AND EARN", id: "refer-earn" as View, isNew: true },
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
                    userId={userId}
                    onUpdate={loadUserData}
                />;
            case "settings":
                return <SettingsView />;
            case "refer-earn":
                return <ReferEarnView />;
            default:
                return <MyProductsView />;
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-[calc(100vh-70px)] bg-white"> {/* Adjusted to eliminate double spacing */}
                <div className="flex flex-col md:flex-row min-h-[calc(100vh-70px)]">

                    {/* Left Sidebar */}
                    <div className="w-full md:w-[280px] border-r border-gray-100 bg-[#fbfbfb] p-6 hidden md:block">
                        <div className="flex items-center gap-3 mb-8 px-4">
                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {getInitials(userName)}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Hello,</p>
                                <p className="text-sm font-semibold text-gray-900">{formatUserDisplayName(userName)}</p>
                            </div>
                        </div>
                        <nav className="flex flex-col space-y-1">
                            {navItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveView(item.id)}
                                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors w-full text-left ${activeView === item.id
                                        ? "bg-white text-black shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    <span>{item.label}</span>
                                    {item.isNew && (
                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">NEW</span>
                                    )}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6 md:p-12">
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
                            <div className="max-w-6xl mx-auto fade-in">
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
