"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
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
}

export default function MyProductsPage() {
    const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

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
                    setMyProducts(altData);
                    setLoading(false);
                    return;
                }

                throw error;
            }

            console.log("✅ Products query successful");
            console.log("✅ Products loaded:", data?.length || 0, "products");
            console.log("✅ Products data:", data);

            if (data && data.length > 0) {
                setMyProducts(data);
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



                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Loading products...</p>
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
                                <div key={product.id} className="relative">
                                    <ProductCard
                                        product={{
                                            id: parseInt(product.id) || 0,
                                            productId: product.product_id,
                                            name: product.name,
                                            price: product.price,
                                            image: product.image,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}

