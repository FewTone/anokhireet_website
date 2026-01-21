"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

interface WishlistProduct {
    id: string | number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
    original_price?: number | string;
}

export default function WishlistView() {
    const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWishlist = async () => {
            setLoading(true);
            try {
                // 1. Get current authenticated user
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    console.error("Auth error in WishlistView:", authError);
                }

                if (user) {
                    // 2. Get internal user ID from 'users' table
                    const { data: userData, error: userQueryError } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_user_id', user.id)
                        .maybeSingle();

                    if (userQueryError) {
                        console.error("User profile query error:", userQueryError);
                    }

                    if (userData) {
                        // 3. Sync from localStorage if present
                        const savedWishlist = localStorage.getItem("wishlist");
                        if (savedWishlist) {
                            try {
                                const localItems = JSON.parse(savedWishlist);
                                if (Array.isArray(localItems) && localItems.length > 0) {
                                    // Get existing DB wishlist
                                    const { data: dbWishlist } = await supabase
                                        .from('wishlist')
                                        .select('product_id')
                                        .eq('user_id', userData.id);

                                    const dbIds = new Set(dbWishlist?.map(i => String(i.product_id)) || []);

                                    const toInsert = localItems
                                        .filter((item: any) => {
                                            const id = item.id || item.productId;
                                            return id && typeof id === 'string' && !dbIds.has(id);
                                        })
                                        .map((item: any) => ({
                                            user_id: userData.id,
                                            product_id: item.id || item.productId
                                        }));

                                    if (toInsert.length > 0) {
                                        await supabase.from('wishlist').insert(toInsert);
                                    }
                                    localStorage.removeItem("wishlist");
                                }
                            } catch (e) {
                                console.error("Error during wishlist sync parse:", e);
                            }
                        }

                        // 4. Fetch wishlist items - Separate fetch to avoid join errors
                        const { data: wishlistEntries, error: wishError } = await supabase
                            .from('wishlist')
                            .select('product_id')
                            .eq('user_id', userData.id);

                        if (wishError) {
                            console.error("Wishlist fetch error:", JSON.stringify(wishError));
                            throw wishError;
                        }

                        if (wishlistEntries && wishlistEntries.length > 0) {
                            const productIds = wishlistEntries.map(entry => entry.product_id);

                            // 5. Fetch product details
                            const { data: productsData, error: prodError } = await supabase
                                .from('products')
                                .select(`
                                    id,
                                    product_id,
                                    title,
                                    name,
                                    price,
                                    image,
                                    images,
                                    category_id,
                                    original_price,
                                    is_active
                                `)
                                .in('id', productIds);

                            if (prodError) {
                                console.error("Products fetch error:", JSON.stringify(prodError));
                                throw prodError;
                            }

                            if (productsData) {
                                const formatted = productsData
                                    .map((p: any) => ({
                                        id: p.id,
                                        productId: p.product_id || p.id,
                                        name: p.title || p.name,
                                        price: p.price,
                                        image: (p.images && p.images[0]) || p.image || "",
                                        category: p.category_id,
                                        original_price: p.original_price
                                    }));

                                setWishlist(formatted);
                                setLoading(false);
                                return;
                            }
                        } else {
                            // No entries in DB
                            setWishlist([]);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // Guest mode or no items found
                const savedWishlist = localStorage.getItem("wishlist");
                if (savedWishlist) {
                    try {
                        const parsed = JSON.parse(savedWishlist);
                        setWishlist(Array.isArray(parsed) ? parsed : []);
                    } catch (e) {
                        setWishlist([]);
                    }
                }
            } catch (error: any) {
                console.error("Critical error in WishlistView:", JSON.stringify({
                    message: error.message || "Unknown error",
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                }, null, 2));
            } finally {
                setLoading(false);
            }
        };

        loadWishlist();
    }, []);

    return (
        <div className="w-full min-h-[400px]">
            <div className="relative mb-3 md:mb-4 flex items-center justify-center min-h-[40px]">
                <h2 className="text-[16px] md:text-2xl leading-[24px] md:leading-normal font-semibold text-center uppercase tracking-normal md:tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>WISH LIST</h2>
            </div>

            <div className="w-full">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[4/5] bg-gray-100 rounded animate-pulse"></div>
                        ))}
                    </div>
                ) : wishlist.length === 0 ? (
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
                            <ProductCard key={product.id} product={product} disableHover={true} initialFavorite={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
