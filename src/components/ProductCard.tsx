"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ProductProps {
    product: {
        id: number | string;
        productId?: string;
        name: string;
        price: string;
        image: string;
        category?: string;
        original_price?: number | string;
    };
    hideDetails?: boolean;
    disableHover?: boolean;
}

export default function ProductCard({ product, hideDetails = false, disableHover = false }: ProductProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if product is in wishlist
        const wishlist = localStorage.getItem("wishlist");
        if (wishlist) {
            try {
                const parsed = JSON.parse(wishlist);
                const productId = product.productId || product.id;
                const exists = parsed.some((p: any) => (p.id === productId || p.productId === productId));
                setIsFavorite(exists);
            } catch (error) {
                console.error("Error parsing wishlist:", error);
            }
        }
    }, [product.productId, product.id]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check authentication first
        // Check authentication first (getUser is safer than getSession)
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Not logged in - redirect to login page with return URL
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/profile?returnUrl=${returnUrl}`);
            return;
        }

        const productId = product.productId || product.id;
        const wishlist = localStorage.getItem("wishlist");
        let updatedWishlist = [];

        if (wishlist) {
            try {
                updatedWishlist = JSON.parse(wishlist);
            } catch (error) {
                console.error("Error parsing wishlist:", error);
                updatedWishlist = [];
            }
        }

        const existingIndex = updatedWishlist.findIndex(
            (p: any) => (p.id === productId || p.productId === productId)
        );

        if (existingIndex > -1) {
            // Remove from wishlist
            updatedWishlist.splice(existingIndex, 1);
            setIsFavorite(false);
        } else {
            // Add to wishlist
            updatedWishlist.push({
                id: productId,
                productId: product.productId || product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                original_price: product.original_price,
            });
            setIsFavorite(true);
        }

        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    };

    // Format price to ensure it has ₹ symbol
    const formatPrice = (price: string): string => {
        if (!price || price.trim() === "") return "";
        // Remove existing ₹ symbol and any commas, then add ₹ prefix
        const cleanPrice = price.replace(/[₹,]/g, '').trim();
        if (!cleanPrice) return "";
        // Add ₹ symbol if not already present
        return `₹${cleanPrice}`;
    };

    const searchParams = useSearchParams();
    const currentParams = searchParams ? searchParams.toString() : "";
    const href = `/products/${product.productId || product.id}${currentParams ? `?${currentParams}` : ''}`;

    return (
        <Link href={href} className="block bg-white group relative">
            <div className={`relative w-full aspect-[4/5] overflow-hidden bg-gray-100 ${hideDetails ? 'mb-0' : 'mb-3'}`}>
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className={`object-cover object-center transition-transform duration-300 ${!disableHover ? 'group-hover:scale-105' : ''}`}
                        unoptimized
                        onError={(e) => {
                            console.error("Image load error for product:", product.name, product.image);
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-sm">No Image</span>
                    </div>
                )}

                {/* Favorite Button */}
                <button
                    onClick={toggleFavorite}
                    className="absolute top-2 right-2 z-10 transition-all duration-200 hover:scale-110"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={isFavorite ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={isFavorite ? "text-red-500 drop-shadow-md" : "text-white drop-shadow-lg"}
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>

            {!hideDetails && (
                <div className="px-2 pb-2">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 pr-2">
                            <h4 className="text-sm md:text-base font-medium tracking-tight text-neutral-900 line-clamp-2">
                                {product.name}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-1">
                                #{product.productId || product.id}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm md:text-base font-normal text-neutral-900 whitespace-nowrap">
                                <span className="text-xs text-neutral-500 mr-1">Rent</span>
                                {formatPrice(product.price)}
                            </p>
                            {product.original_price && (
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    <span className="mr-1">MRP</span>
                                    ₹{typeof product.original_price === 'number'
                                        ? product.original_price.toLocaleString()
                                        : parseFloat(String(product.original_price)).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Link>
    );
}
