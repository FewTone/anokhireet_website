"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
// import { isOtpBypassEnabled } from "@/lib/devConfig";

interface UserProduct {
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string;
    product_id?: string;
    created_at: string;
    views?: number;
    wishlist_count?: number;
    inquiries_count?: number;
    db_id?: number;
}

export default function MyProductsPage() {
    const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [totalInquiries, setTotalInquiries] = useState<number>(0);
    const [totalViews, setTotalViews] = useState<number>(0);
    const [totalLikes, setTotalLikes] = useState<number>(0);

    useEffect(() => {
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn("Loading timeout - setting loading to false");
                setLoading(false);
            }
        }, 10000); // 10 second timeout

        // Get user ID from Supabase Auth session
        loadUserAndProducts().catch((error) => {
            console.error("Error in loadUserAndProducts:", error);
            setLoading(false);
        });

        // ========== NORMAL USER FLOW ==========
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUserAndProducts().catch((error) => {
                    console.error("Error in loadUserAndProducts (auth change):", error);
                    setLoading(false);
                });
            } else {
                setUserId(null);
                setUserName("");
                setMyProducts([]);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const loadUserAndProducts = async () => {
        try {
            // ========== NORMAL USER FLOW ==========
            // Check Supabase Auth session only (no localStorage)
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                // No authentication found
                console.log("❌ No Supabase Auth session found");
                setLoading(false);
                return;
            }

            // User is logged in via Supabase Auth
            const authUserId = session.user.id;
            console.log("✅ Supabase Auth session found, authUserId:", authUserId);

            // Find the user in users table by matching auth_user_id or id
            // This handles both admin-created users (linked via auth_user_id) and self-registered users
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, name, auth_user_id")
                .or(`id.eq.${authUserId},auth_user_id.eq.${authUserId}`)
                .maybeSingle();

            if (userError || !userData) {
                console.error("❌ User not found in users table:", userError);
                setLoading(false);
                return;
            }

            console.log("✅ User found in database:", userData);

            // Use the users.id (not auth_user_id) to query products
            // Products are linked by user_id which references users.id
            const actualUserId = userData.id;
            setUserId(actualUserId);
            setUserName(userData.name || "");

            // Load products using the actual users.id
            loadProducts(actualUserId);
            loadInquiryStats(actualUserId);
        } catch (error) {
            console.error("Error loading user:", error);
            setLoading(false);
        }
    };

    const loadProducts = async (uid: string) => {
        try {
            setLoading(true);
            console.log("🔍 Loading products for user_id:", uid);
            console.log("🔍 user_id type:", typeof uid);

            // First, let's verify the user exists and get their actual ID
            const { data: userCheck, error: userCheckError } = await supabase
                .from("users")
                .select("id, name, phone")
                .eq("id", uid)
                .maybeSingle();

            if (userCheckError) {
                console.error("❌ Error checking user:", userCheckError);
            }

            if (userCheck) {
                console.log("✅ User verified:", userCheck);
                console.log("🔍 User ID from database:", userCheck.id, "Type:", typeof userCheck.id);
            } else {
                console.warn("⚠️ User not found with ID:", uid);
            }

            // Try querying products with the exact user_id
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("owner_user_id", uid)
                .order("created_at", { ascending: false });

            let productsToSet = data || [];

            if (error) {
                console.error("❌ Error loading products:", error);
                console.error("❌ Error details:", JSON.stringify(error, null, 2));

                // Try alternative query - maybe user_id is stored as text
                console.log("🔄 Trying alternative query...");
                const { data: altData, error: altError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("owner_user_id", String(uid))
                    .order("created_at", { ascending: false });

                if (!altError && altData) {
                    console.log("✅ Products loaded with alternative query:", altData.length, "products");
                    productsToSet = altData;
                } else {
                    throw error;
                }
            } else {
                console.log("✅ Products query successful");
                console.log("✅ Products loaded:", data?.length || 0, "products");
            }

            if (productsToSet.length > 0) {
                // Fetch analytics for these products
                const productIds = productsToSet.map(p => p.product_id || p.id);
                const dbIds = productsToSet.map(p => p.id);

                // Fetch views (Interests)
                const { data: viewsData } = await supabase
                    .from("product_views")
                    .select("product_id")
                    .in("product_id", productIds);

                // Also check if some views are recorded by db_id (numeric)
                const { data: viewsDataById } = await supabase
                    .from("product_views")
                    .select("product_id")
                    .in("product_id", dbIds.map(String));


                // Fetch wishlist counts (Likes)
                const { data: wishlistData } = await supabase
                    .from("wishlist")
                    .select("product_id")
                    .in("product_id", dbIds);

                // Fetch inquiries (Msgs)
                const { data: inquiriesData } = await supabase
                    .from("inquiries")
                    .select("product_id")
                    .in("product_id", dbIds);


                // Map counts to products
                const updatedProducts = productsToSet.map(p => {
                    // Count views
                    const pIdStr = String(p.product_id || p.id);
                    const dbIdStr = String(p.id);

                    const viewsCount1 = viewsData?.filter(v => v.product_id === pIdStr).length || 0;
                    const viewsCount2 = viewsDataById?.filter(v => v.product_id === dbIdStr).length || 0;
                    const views = Math.max(viewsCount1, viewsCount2);

                    // Count wishlist (Likes)
                    const wishlistCount = wishlistData?.filter(w => w.product_id === p.id).length || 0;

                    // Count inquiries
                    const inquiriesCount = inquiriesData?.filter(i => i.product_id === p.id).length || 0;

                    return {
                        ...p,
                        views: views,
                        wishlist_count: wishlistCount,
                        inquiries_count: inquiriesCount,
                        db_id: p.id
                    };
                });

                setMyProducts(updatedProducts);

                // Calculate totals
                const totalV = updatedProducts.reduce((sum, p) => sum + (p.views || 0), 0);
                const totalL = updatedProducts.reduce((sum, p) => sum + (p.wishlist_count || 0), 0);
                setTotalViews(totalV);
                setTotalLikes(totalL);
            } else {
                console.warn("⚠️ No products found for user_id:", uid);
                // Let's also check if there are any products at all
                const { data: allProducts } = await supabase
                    .from("products")
                    .select("owner_user_id")
                    .limit(5);
                console.log("🔍 Sample owner_user_ids in products table:", allProducts);
                setMyProducts([]);
            }
        } catch (error) {
            console.error("❌ Error loading products:", error);
            setMyProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadInquiryStats = async (uid: string) => {
        try {
            const { count, error } = await supabase
                .from("inquiries")
                .select("*", { count: 'exact', head: true })
                .eq("owner_user_id", uid);

            if (error) throw error;

            setTotalInquiries(count || 0);
        } catch (error) {
            console.error("Error loading inquiry stats:", error);
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white pt-20 pb-12">
                <div className="max-w-[1400px] mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {userName ? `${userName}'s Products` : "My Products"}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            View your products. Only admins can add, edit, or delete products.
                        </p>
                    </div>

                    {/* Analytics Section */}
                    {userId && !loading && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                                <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Products</h3>
                                <p className="text-2xl font-bold text-gray-900">{myProducts.length}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                                <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Interest</h3>
                                <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                                <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Views</h3>
                                <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                                <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Likes</h3>
                                <p className="text-2xl font-bold text-gray-900">{totalLikes}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                                <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Inquiries</h3>
                                <p className="text-2xl font-bold text-gray-900">{totalInquiries}</p>
                            </div>
                        </div>
                    )}



                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : !userId ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">Please log in to view your products.</p>
                            <p className="text-gray-400 text-sm">
                                Contact an admin to create your account and add products for you.
                            </p>
                        </div>
                    ) : myProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">You don't have any products yet.</p>
                            <p className="text-gray-400 text-sm mb-4">
                                Contact an admin to add products to your account.
                            </p>

                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {myProducts.map((product) => (
                                <div key={product.id} className="relative group">
                                    <ProductCard
                                        product={{
                                            id: parseInt(product.id) || 0,
                                            productId: product.product_id,
                                            name: product.name,
                                            price: product.price,
                                            image: product.image,
                                        }}
                                    />
                                    {/* Analytics Overlay/Footer */}
                                    <div className="mt-2 grid grid-cols-4 gap-1 bg-gray-50 rounded-md border border-gray-100 p-2 text-xs text-center text-gray-600">
                                        <div className="flex flex-col items-center justify-center p-1" title="Interest">
                                            <div className="flex items-center gap-1 mb-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                                            </div>
                                            <span className="font-semibold">{product.views || 0}</span>
                                            <span className="text-[9px] text-gray-400">Intrst</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200" title="Views">
                                            <div className="flex items-center gap-1 mb-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            </div>
                                            <span className="font-semibold">{product.views || 0}</span>
                                            <span className="text-[9px] text-gray-400">Views</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200" title="Likes">
                                            <div className="flex items-center gap-1 mb-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                            </div>
                                            <span className="font-semibold">{product.wishlist_count || 0}</span>
                                            <span className="text-[9px] text-gray-400">Likes</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200" title="Inquiries">
                                            <div className="flex items-center gap-1 mb-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                            </div>
                                            {/* Note: Inquiries count for individual products requires an additional query or join. 
                                                For now we are not fetching it per product above, so it will be 0 or undefined.
                                                I need to add the fetch logic for per-product inquiries if it's not already there.
                                                Looking at the code, we fetch Inquiries TOTAL, but not per product. 
                                                I will leave it as 0 logic for now or try to use 'inquiries_count' if I add it.
                                                Wait, the user REQUESTED "inquiry" for all products.
                                                The current `updatedProducts` map does NOT include `inquiries_count`.
                                                I should update the fetch logic too!
                                            */}
                                            <span className="font-semibold">{product.inquiries_count || 0}</span>
                                            <span className="text-[9px] text-gray-400">Msgs</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main >
            <Footer />
        </>
    );
}

