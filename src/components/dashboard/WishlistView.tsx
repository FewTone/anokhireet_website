"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

interface WishlistProduct {
    id: number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
}

export default function WishlistView() {
    const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);

    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const loadWishlist = async () => {
            setLoading(true);
            try {
                // Check auth
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setIsLoggedIn(true);
                    // Get user profile ID
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_user_id', session.user.id)
                        .maybeSingle();

                    if (userData) {
                        // Fetch wishlist with joined products
                        const { data, error } = await supabase
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
                                .filter((item: any) => item.product) // Filter out any broken relationships
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
        <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4 text-center hidden md:block uppercase tracking-wide">Wish List</h2>

            <div className="w-full">
                {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
                        {wishlist.map((product) => (
                            <ProductCard key={product.id} product={product} disableHover={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
