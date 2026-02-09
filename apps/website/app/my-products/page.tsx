"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MobileHeader from "@/components/MobileHeader";
import MyProductsView from "@/components/dashboard/MyProductsView";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

export default function MyProductsPage() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/profile");
                return;
            }
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Navbar />

            <main className="flex-1 pt-0 md:pt-24 pb-20 px-0 md:px-4 max-w-7xl mx-auto w-full">
                {/* MyProductsView handles its own padding/layout nicely usually, but let's ensure mobile padding is handled if the component expects it from parent */}
                <div className="md:hidden mt-4"></div>
                <div className="w-full">
                    <MyProductsView />
                </div>
            </main>

            <div className="hidden md:block">
                <Footer />
            </div>
            <BottomNav />
        </div>
    );
}

