"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
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
        // Load wishlist from localStorage
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
            try {
                const parsed = JSON.parse(savedWishlist);
                setWishlist(parsed);
            } catch (error) {
                console.error("Error parsing wishlist:", error);
                console.error("Error parsing wishlist:", error);
            }
        }
        setLoading(false);
    }, []);

    const removeFromWishlist = (productId: number) => {
        const updated = wishlist.filter((p) => p.id !== productId);
        setWishlist(updated);
        localStorage.setItem("wishlist", JSON.stringify(updated));
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white md:pt-20 pb-12">
                <div className="w-full">
                    <h1 className="text-3xl font-semibold mb-4 md:mb-8 px-4 md:px-0 mt-4 md:mt-0 uppercase tracking-wide">Wish List</h1>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2 px-1">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2 px-1">
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

