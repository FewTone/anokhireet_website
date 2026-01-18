"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";

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

    useEffect(() => {
        // Load wishlist from localStorage
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
            try {
                const parsed = JSON.parse(savedWishlist);
                setWishlist(parsed);
            } catch (error) {
                console.error("Error parsing wishlist:", error);
            }
        }
    }, []);

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-8 text-center">Wish List</h2>

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
    );
}
