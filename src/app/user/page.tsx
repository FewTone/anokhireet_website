"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName } from "@/lib/utils";
import MyProductsView from "@/components/dashboard/MyProductsView";
import WishlistView from "@/components/dashboard/WishlistView";
import ProfileView from "@/components/dashboard/ProfileView";
import SettingsView from "@/components/dashboard/SettingsView";
import Sidebar from "@/components/dashboard/Sidebar";

type View = "my-products" | "wishlist" | "profile" | "settings" | "menu";

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
        // On mobile, if view is 'menu', we render Sidebar logic inside the main content area
        // handled in the return statement logic
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
            case "menu":
                return (
                    <div className="md:hidden">
                        <Sidebar
                            userName={userName}
                            userAvatar={userAvatar}
                            navItems={navItems}
                            activeView={activeView}
                            onNavigate={(id) => {
                                setActiveView(id as View);
                                router.push(`/user?view=${id}`, { scroll: false });
                            }}
                        />
                    </div>
                );
            default:
                return <MyProductsView />;
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-[calc(100vh-70px)] bg-white">
                <div className="flex flex-col md:flex-row min-h-[calc(100vh-70px)] max-w-[1400px] mx-auto">

                    {/* Left Sidebar - Desktop Only */}
                    <div className="w-full md:w-[320px] p-6 hidden md:block">
                        <Sidebar
                            userName={userName}
                            userAvatar={userAvatar}
                            navItems={navItems}
                            activeView={activeView}
                            onNavigate={(id) => {
                                setActiveView(id as View);
                                router.push(`/user?view=${id}`, { scroll: false });
                            }}
                        />
                    </div>

                    {/* Main Content */}
                    <div className={`flex-1 md:p-4 border-gray-100 ${activeView === 'menu' ? 'p-0 border-none' : 'p-2 border-l'}`}>
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
            <BottomNav />
        </>
    );
}
