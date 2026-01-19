"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { supabase } from "@/lib/supabase";
interface WishlistProduct {
    id: number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
}

export default function WishListPage() {
    const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWishlist = async () => {
            setLoading(true);
            try {
                // Check auth
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Get user profile ID
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_user_id', session.user.id)
                        .maybeSingle();

                    if (userData) {
                        // Fetch wishlist with joined products
                        const { data } = await supabase
                            .from('wishlist')
                            .select(`
                                id,
                                product:products (
                                    id,
                                    product_id,
                                    title,
                                    name,
                                    price,
                                    image,
                                    images,
                                    category,
                                    original_price
                                )
                            `)
                            .eq('user_id', userData.id);

                        if (data) {
                            const formatted = data
                                .filter((item: any) => item.product)
                                .map((item: any) => ({
                                    id: item.product.id,
                                    productId: item.product.product_id || item.product.id,
                                    name: item.product.title || item.product.name,
                                    price: item.product.price,
                                    image: (item.product.images && item.product.images[0]) || item.product.image || "",
                                    category: item.product.category,
                                    original_price: item.product.original_price
                                }));
                            setWishlist(formatted);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // Fallback to localStorage if not logged in
                const savedWishlist = localStorage.getItem("wishlist");
                if (savedWishlist) {
                    const parsed = JSON.parse(savedWishlist);
                    setWishlist(parsed);
                }
            } catch (error) {
                console.error("Error loading wishlist:", error);
            } finally {
                setLoading(false);
            }
        };

        loadWishlist();
    }, []);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white md:pt-20 pb-12">
                <div className="w-full">
                    <h1 className="text-lg font-semibold mb-4 md:mb-8 px-1 mt-4 md:mt-0 uppercase tracking-wide">Wish List</h1>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 px-0">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : wishlist.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <svg
                                width="64"
                                height="64"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-gray-300 mx-auto mb-4"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <p className="text-gray-500 text-lg mb-2">Your wishlist is empty</p>
                            <p className="text-gray-400 text-sm">Start adding products to your wishlist!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 px-0">
                            {wishlist.map((product) => (
                                <ProductCard key={product.id} product={product} disableHover={true} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <BottomNav />
        </>
    );
}
