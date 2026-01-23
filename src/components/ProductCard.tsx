"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useImpressionTracking } from "@/hooks/useImpressionTracking";


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
    initialFavorite?: boolean;
    useCompactPrice?: boolean;
}

export default function ProductCard({ product, hideDetails = false, disableHover = false, initialFavorite, useCompactPrice = false }: ProductProps) {
    const [isFavorite, setIsFavorite] = useState(initialFavorite || false);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // If initial favorite is provided by parent (e.g. Home page batch load or Wishlist view),
        // we use it immediately and skip internal checks.
        if (initialFavorite !== undefined) {
            setIsFavorite(initialFavorite);
            return;
        }

        const checkWishlistStatus = async () => {
            const currentProductId = String(product.id);
            const currentProductSlug = product.productId ? String(product.productId) : null;

            try {
                // 1. Check localStorage first (immediate sync)
                const localWishlist = localStorage.getItem("wishlist");
                if (localWishlist) {
                    const parsed = JSON.parse(localWishlist);
                    const isLocallyFavorited = parsed.some((p: any) =>
                        String(p.id) === currentProductId ||
                        (currentProductSlug && String(p.productId) === currentProductSlug)
                    );
                    if (isLocallyFavorited) {
                        setIsFavorite(true);
                        // We still check DB next to be sure
                    }
                }

                // 2. Check Supabase (authoritative source)
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_user_id', session.user.id)
                        .maybeSingle();

                    if (userData) {
                        const { data } = await supabase
                            .from('wishlist')
                            .select('id')
                            .eq('user_id', userData.id)
                            .eq('product_id', currentProductId)
                            .maybeSingle();

                        if (data) {
                            setIsFavorite(true);
                        } else if (!localWishlist) {
                            setIsFavorite(false);
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking wishlist status:", error);
            }
        };

        checkWishlistStatus();
    }, [product.id, product.productId, initialFavorite]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isProcessing) return;

        // 1. Optimistic UI update - happens INSTANTLY
        const newFavoriteStatus = !isFavorite;
        setIsFavorite(newFavoriteStatus);
        setIsProcessing(true);

        try {
            // 2. Faster session check
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                // Rollback if not logged in
                setIsFavorite(isFavorite);
                setIsProcessing(false);
                const returnUrl = encodeURIComponent(window.location.pathname);
                router.push(`/profile?returnUrl=${returnUrl}`);
                return;
            }

            const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();

            if (!userData) {
                setIsFavorite(isFavorite);
                setIsProcessing(false);
                return;
            }

            const currentProductId = String(product.id);
            const currentProductSlug = product.productId ? String(product.productId) : null;

            if (newFavoriteStatus) {
                // Add to Supabase
                await supabase.from('wishlist').insert({
                    user_id: userData.id,
                    product_id: currentProductId
                });

                // Add/Sync to localStorage
                const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                const alreadyInLocal = localWishlist.some((p: any) =>
                    String(p.id) === currentProductId ||
                    (currentProductSlug && String(p.productId) === currentProductSlug)
                );

                if (!alreadyInLocal) {
                    localWishlist.push({
                        id: currentProductId,
                        productId: currentProductSlug || currentProductId,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        original_price: product.original_price,
                    });
                    localStorage.setItem("wishlist", JSON.stringify(localWishlist));
                }
            } else {
                // Remove from Supabase
                await supabase.from('wishlist')
                    .delete()
                    .eq('user_id', userData.id)
                    .eq('product_id', currentProductId);

                // Remove from localStorage
                const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                const filtered = localWishlist.filter((p: any) =>
                    String(p.id) !== currentProductId &&
                    (!currentProductSlug || String(p.productId) !== currentProductSlug)
                );
                localStorage.setItem("wishlist", JSON.stringify(filtered));
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            setIsFavorite(!newFavoriteStatus); // Rollback on actual error
        } finally {
            setIsProcessing(false);
        }
    };

    // Format price to ensure it has ₹ symbol
    const formatPrice = (price: string, compact: boolean = false): string => {
        if (!price || price.trim() === "") return "";
        const cleanPrice = price.replace(/[₹,]/g, '').trim();
        const number = parseFloat(cleanPrice);

        if (isNaN(number)) return `₹${cleanPrice}`;

        // Compact formatting for MRP (if enabled and >= 1000)
        if (compact) {
            if (number >= 1000000) {
                return `₹${(number / 1000000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}m`;
            }
            if (number >= 1000) {
                return `₹${(number / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}k`;
            }
        }

        return `₹${number.toLocaleString('en-IN')}`;
    };

    const searchParams = useSearchParams();
    const currentParams = searchParams ? searchParams.toString() : "";

    // Ensure we have a valid ID to link to
    const pid = product.productId || product.id;
    const baseHref = pid ? `/products/${pid}` : '#';
    // Append params only if we have a valid product link
    const href = (pid && baseHref !== '#')
        ? `${baseHref}${currentParams ? `?${currentParams}` : ''}`
        : '#';

    const impressionRef = useImpressionTracking(product.id);

    return (
        <div ref={impressionRef}>
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
                        <div className="mb-2">
                            <h4 className="text-base md:text-lg font-semibold tracking-tight text-neutral-900">
                                #{product.productId || product.id}
                            </h4>
                        </div>
                        <div className="flex items-baseline justify-between w-full">
                            <p className="text-sm md:text-base whitespace-nowrap">
                                <span className="text-md uppercase tracking-wider mr-1 text-neutral-500">RENT</span>
                                <span className="text-neutral-900 font-medium">{formatPrice(product.price, false)}</span>
                            </p>
                            {product.original_price && (
                                <p className="text-sm md:text-base whitespace-nowrap text-right">
                                    <span className="text-md uppercase tracking-wider mr-1 text-neutral-500">MRP</span>
                                    <span className="text-neutral-500 font-medium">{formatPrice(String(product.original_price), useCompactPrice)}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Link>
        </div>
    );
}
