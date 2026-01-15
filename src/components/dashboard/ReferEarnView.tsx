"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReferEarnView() {
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [listingCredits, setListingCredits] = useState<number>(0);
    const [totalReferrals, setTotalReferrals] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("users")
                .select("referral_code, listing_credits, total_referrals")
                .eq("auth_user_id", user.id)
                .single();

            if (data) {
                setReferralCode(data.referral_code);
                setListingCredits(data.listing_credits || 0);
                setTotalReferrals(data.total_referrals || 0);

                // Auto-generate if missing
                if (!data.referral_code) {
                    generateReferralCode(user.id);
                }
            }
        } catch (error) {
            console.error("Error fetching referral data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateReferralCode = async (userId: string) => {
        setGenerating(true);
        try {
            // Simple random code: REF-XXXXXX
            const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
            const newCode = `REF-${randomSuffix}`;

            const { error } = await supabase
                .from("users")
                .update({ referral_code: newCode })
                .eq("auth_user_id", userId);

            if (!error) {
                setReferralCode(newCode);
            }
        } catch (error) {
            console.error("Error generating code:", error);
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (referralCode) {
            navigator.clipboard.writeText(referralCode);
            alert("Referral code copied!");
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading referral data...</div>;
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6">Refer & Earn</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-lg text-center">
                    <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-2">Listing Credits</h3>
                    <p className="text-4xl font-black text-orange-600">{listingCredits}</p>
                    <p className="text-xs text-orange-700 mt-2">Credits available to list products</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg text-center">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Referrals</h3>
                    <p className="text-4xl font-black text-gray-800">{totalReferrals}</p>
                    <p className="text-xs text-gray-500 mt-2">Friends who joined</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6 rounded-full">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">Invite Friends & Earn Credits</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8 text-sm">
                    Share your unique referral code. When a friend signs up using your code, both of you get <strong>1 Listing Credit</strong>!
                </p>

                {referralCode ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0 max-w-lg mx-auto border border-black rounded-md overflow-hidden">
                        <div className="w-full bg-gray-50 px-4 py-3 text-gray-900 font-mono text-lg font-bold tracking-wider truncate border-r border-black sm:border-b-0 border-b">
                            {referralCode}
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="w-full sm:w-auto px-8 py-3 bg-black text-white text-sm font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors whitespace-nowrap"
                        >
                            Copy Code
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fetchReferralData()}
                        disabled={generating}
                        className="px-6 py-2 bg-black text-white rounded disabled:opacity-50"
                    >
                        {generating ? "Generating..." : "Generate Referral Code"}
                    </button>
                )}
            </div>
        </div>
    );
}
