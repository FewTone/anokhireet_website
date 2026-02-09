"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName } from "@/lib/utils";
import MyProductsView from "@/components/dashboard/MyProductsView";
import WishlistView from "@/components/dashboard/WishlistView";
import ProfileView from "@/components/dashboard/ProfileView";
import SettingsView from "@/components/dashboard/SettingsView";
import Sidebar from "@/components/dashboard/Sidebar";

type View = "my-products" | "wishlist" | "profile" | "settings" | "menu";

// Rename the actual client logic component
function UserClient() {
    const [userName, setUserName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [userLocation, setUserLocation] = useState("");
    const [userGender, setUserGender] = useState("");
    const [userBirthdate, setUserBirthdate] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [userState, setUserState] = useState("");
    const [userCustomId, setUserCustomId] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<View>("profile");
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
                .select(`
                    id, name, phone, auth_user_id, location, gender, birthdate, avatar_url, custom_id, state,
                    user_cities (
                        cities (
                            name
                        )
                    )
                `)
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

            // Prioritize stored location, fallback to selected city from signup
            // @ts-ignore
            const cityObj: any = userData.user_cities?.[0]?.cities;
            const cityFromSignup = Array.isArray(cityObj) ? cityObj[0]?.name : cityObj?.name;
            setUserLocation(userData.location || cityFromSignup || "");
            setUserGender(userData.gender || "");
            setUserBirthdate(userData.birthdate || "");
            setUserAvatar(userData.avatar_url || "");
            setUserState(userData.state || "");
            setUserCustomId(userData.custom_id || "");
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
        { label: "PROFILE", id: "profile" as View },
        { label: "MY PRODUCTS", id: "my-products" as View },
        { label: "WISHLIST", id: "wishlist" as View },
        { label: "SETTINGS", id: "settings" as View },
    ];

    const renderContent = () => {
        // Content wrapper to ensure consistent mobile padding/layout
        const ContentWrapper = ({ children, title, backLink }: { children: React.ReactNode, title: string, backLink?: string }) => (
            <div className="flex flex-col h-full bg-white">
                <MobileHeader
                    title={title}
                    onBack={() => {
                        setActiveView("menu");
                        router.push("/user?view=menu", { scroll: false });
                    }}
                />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        );

        // On mobile, if view is 'menu', we render Sidebar logic inside the main content area
        switch (activeView) {
            case "my-products":
                return (
                    <div className="flex flex-col h-full bg-white">
                        <div className="flex-1">
                            <MyProductsView />
                        </div>
                    </div>
                );
            case "wishlist":
                return (
                    <div className="flex flex-col h-full bg-white">
                        <div className="flex-1">
                            <WishlistView />
                        </div>
                    </div>
                );
            case "profile":
                return (
                    <ContentWrapper title="Profile">
                        <ProfileView
                            userName={userName}
                            userPhone={userPhone}
                            userEmail={userEmail}
                            userLocation={userLocation}
                            userGender={userGender}
                            userBirthdate={userBirthdate}
                            userAvatar={userAvatar}
                            userId={userId}
                            userState={userState}
                            userCustomId={userCustomId}
                            userCustomId={userCustomId}
                        />
                    </ContentWrapper>
                );
            case "settings":
                return (
                    <ContentWrapper title="Settings">
                        <SettingsView />
                    </ContentWrapper>
                );
            case "menu":
                return (
                    <div className="md:hidden">
                        <Sidebar
                            userName={userName}
                            userAvatar={userAvatar}
                            navItems={navItems}
                            activeView={activeView}
                            onNavigate={(id) => {
                                if (id === "wishlist") {
                                    router.push("/wishlist");
                                } else if (id === "my-products") {
                                    router.push("/my-products");
                                } else {
                                    setActiveView(id as View);
                                    router.push(`/user?view=${id}`, { scroll: false });
                                }
                            }}
                        />
                    </div>
                );
            default:
                return <MyProductsView />;
        }
    };

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>}>
            <Navbar />
            <main className="min-h-[calc(100vh-70px)] bg-white">
                <div className="w-full md:max-w-[95%] mx-auto">
                    <div className="flex flex-col md:flex-row min-h-[calc(100vh-70px)] w-full">

                        {/* Left Sidebar - Desktop Only */}
                        <div className="w-full md:w-[320px] p-6 hidden md:block flex-shrink-0">
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
                        <div className="flex-1 p-0 pt-6 md:pt-16 min-w-0 transition-all duration-300">
                            <div className="w-full fade-in">
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <BottomNav />
        </Suspense>
    );
}

// Export the wrapper as default
import { Suspense } from "react";

export default function UserPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>}>
            <UserClient />
        </Suspense>
    );
}
