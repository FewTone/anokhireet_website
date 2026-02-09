"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function SettingsView() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
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
            <h2 className="text-2xl font-semibold mb-4 text-center tracking-wide uppercase hidden md:block">Settings</h2>





            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-md overflow-hidden w-full">
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
        </div >
    );
}
