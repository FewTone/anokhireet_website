"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

interface UserProduct {
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string;
    product_id?: string;
    created_at: string;
}

export default function MyProductsView() {
    const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [totalInquiries, setTotalInquiries] = useState<number>(0);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn("Loading timeout - setting loading to false");
                setLoading(false);
            }
        }, 10000);

        loadUserAndProducts().catch((error) => {
            console.error("Error in loadUserAndProducts:", error);
            setLoading(false);
        });

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
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                console.log("❌ No Supabase Auth session found");
                setLoading(false);
                return;
            }

            const authUserId = session.user.id;
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

            const actualUserId = userData.id;
            setUserId(actualUserId);
            setUserName(userData.name || "");

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
            const { data: userCheck, error: userCheckError } = await supabase
                .from("users")
                .select("id, name, phone")
                .eq("id", uid)
                .maybeSingle();

            if (userCheck) {
                // User verified
            } else {
                console.warn("⚠️ User not found with ID:", uid);
            }

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("owner_user_id", uid)
                .order("created_at", { ascending: false });

            if (error) {
                // Try alternative query
                const { data: altData, error: altError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("owner_user_id", String(uid))
                    .order("created_at", { ascending: false });

                if (!altError && altData) {
                    setMyProducts(altData);
                    setLoading(false);
                    return;
                }
                throw error;
            }

            if (data && data.length > 0) {
                setMyProducts(data);
            } else {
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
        <div className="w-full">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">
                    {userName ? `${userName}'s Products` : "My Products"}
                </h2>
                <p className="text-gray-600 text-sm">
                    View your products. Only admins can add, edit, or delete products.
                </p>
            </div>

            {/* Analytics Section */}
            {userId && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Total Products</h3>
                        <p className="text-3xl font-bold text-gray-900">{myProducts.length}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Total Inquiries</h3>
                        <p className="text-3xl font-bold text-gray-900">{totalInquiries}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Performance Information</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Updates in real-time. Keep active to receive more inquiries.
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading products...</p>
                </div>
            ) : !userId ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">Please log in to view your products.</p>
                </div>
            ) : myProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">You don't have any products yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
    );
}
