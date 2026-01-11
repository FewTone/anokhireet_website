"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const TABS = [
    "ALL",
    "SHIRTS",
    "TROUSER",
    "T-SHIRTS",
    "JEANS",
    "JACKETS",
    "SHORTS",
    "SWEATSHIRTS",
    "SWEATERS",
    "SHOES",
];

interface Product {
    id: string | number; // Support both string (UUID) and number IDs for uniqueness
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
    original_price?: number | string;
    created_at?: string;
}

export default function Home() {
    const [activeTab, setActiveTab] = useState("ALL");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [featuredCategories, setFeaturedCategories] = useState<Array<{ img: string; link_url?: string; name?: string }>>([]);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn("Loading timeout - setting loading to false");
                setLoading(false);
            }
        }, 15000); // 15 second timeout

        loadProducts(true); // Initial load
        loadCategories().catch((error) => {
            console.error("Error loading categories:", error);
            setLoading(false);
        }); // Load categories from database

        // Set up Supabase Realtime subscriptions for instant updates
        const productTypesChannel = supabase
            .channel('product-types-changes-home')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_types'
                },
                (payload) => {
                    console.log('🔄 Product Types table changed:', payload.eventType, payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                        loadCategories();
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Product Types subscription status:', status);
            });

        const occasionsChannel = supabase
            .channel('occasions-changes-home')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'occasions'
                },
                (payload) => {
                    console.log('🔄 Occasions table changed:', payload.eventType, payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                        loadCategories();
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Occasions subscription status:', status);
            });

        const productsChannel = supabase
            .channel('products-changes-home')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'products'
                },
                (payload) => {
                    console.log('🔄 Products table changed:', payload.eventType, payload);
                    // Clear existing debounce timer
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                    }
                    // Reload products when any change occurs (silent update, no loading state)
                    // Use setTimeout to debounce rapid changes
                    debounceTimerRef.current = setTimeout(() => {
                        console.log('🔄 Reloading products due to realtime change...');
                        loadProducts(false);
                    }, 300);
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to products changes - updates will appear instantly!');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    console.warn('⚠️ Realtime subscription issue:', status, '- Polling fallback will handle updates');
                }
            });

        // Also reload when page regains focus (in case user navigates back)
        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                loadProducts(false); // Silent refresh when page regains focus
            }
        };

        // Polling fallback - reload every 10 seconds as backup
        const pollInterval = setInterval(() => {
            loadProducts(false);
        }, 10000);

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        // Cleanup subscriptions and event listeners
        return () => {
            clearTimeout(timeoutId);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            supabase.removeChannel(productsChannel);
            supabase.removeChannel(productTypesChannel);
            supabase.removeChannel(occasionsChannel);
            clearInterval(pollInterval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, []);

    const loadCategories = async () => {
        try {
            // Load featured items from all 5 facet types
            const [productTypesResult, occasionsResult] = await Promise.all([
                supabase
                    .from("product_types")
                    .select("*")
                    .eq("is_featured", true)
                    .order("display_order", { ascending: true }),
                supabase
                    .from("occasions")
                    .select("*")
                    .eq("is_featured", true)
                    .order("display_order", { ascending: true })
            ]);

            const allFeatured: Array<{ img: string; link_url?: string; name?: string; display_order: number }> = [];

            // Add featured product types with their display_order
            if (productTypesResult.data && !productTypesResult.error) {
                productTypesResult.data.forEach(pt => {
                    allFeatured.push({
                        img: pt.image_url || "",
                        link_url: `/products?product_type=${pt.id}`,
                        name: pt.name || "",
                        display_order: pt.display_order ?? 0
                    });
                });
            }

            // Add featured occasions with their display_order
            if (occasionsResult.data && !occasionsResult.error) {
                occasionsResult.data.forEach(oc => {
                    allFeatured.push({
                        img: oc.image_url || "",
                        link_url: `/products?occasion=${oc.id}`,
                        name: oc.name || "",
                        display_order: oc.display_order ?? 0
                    });
                });
            }

            // Sort all featured items by display_order to maintain the order set in admin panel
            allFeatured.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

            // Remove display_order from final array (not needed in component)
            const finalFeatured = allFeatured.map(({ display_order, ...rest }) => rest);

            console.log('✅ Featured items from facets:', finalFeatured.length);
            console.log('📋 Featured items details (sorted by display_order):', finalFeatured);

            // Log if there are errors
            if (productTypesResult.error) {
                console.error('❌ Error loading product types:', productTypesResult.error);
            }
            if (occasionsResult.error) {
                console.error('❌ Error loading occasions:', occasionsResult.error);
            }

            setFeaturedCategories(finalFeatured);
        } catch (error) {
            console.error("Error loading featured items:", error);
            setFeaturedCategories([]);
        }
    };

    const loadProducts = async (showLoading: boolean = false) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            console.log('Loading products from database...');

            // Load products from 'products' table
            const { data: dbProducts, error: userError } = await supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false });

            if (userError) {
                console.error("Error loading products:", userError);
                throw userError;
            }

            console.log(`Loaded ${dbProducts?.length || 0} products from database`);

            const allProducts: Product[] = [];

            // Add products with created_at timestamp
            if (dbProducts && dbProducts.length > 0) {
                dbProducts.forEach((p: any, index: number) => {
                    // Use the original UUID string ID to ensure uniqueness
                    // If ID is not a valid string, generate a unique one
                    const uniqueId = p.id && typeof p.id === 'string' && p.id.length > 0
                        ? p.id
                        : `product-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;

                    // Get primary image from images array or fallback to single image
                    let primaryImage = p.image || "";
                    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                        const primaryIndex = p.primary_image_index !== undefined && p.primary_image_index >= 0 && p.primary_image_index < p.images.length
                            ? p.primary_image_index
                            : 0;
                        primaryImage = p.images[primaryIndex] || p.images[0] || "";
                    }

                    allProducts.push({
                        id: uniqueId, // Use unique string ID
                        productId: p.product_id || p.id, // Use product_id if available, otherwise use id
                        name: p.title || p.name,
                        price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                        image: primaryImage, // Use primary image for home page
                        category: p.category || p.category_id,
                        original_price: p.original_price || undefined,
                        created_at: p.created_at, // Store for sorting
                    } as any);
                });
            }

            if (allProducts.length > 0) {
                // Sort all products by created_at (newest first)
                allProducts.sort((a: any, b: any) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateB - dateA; // Newest first
                });

                // Remove created_at before setting (not needed in Product interface)
                const cleanedProducts = allProducts.map(({ created_at, ...rest }) => rest);
                setProducts(cleanedProducts);
                console.log(`Updated products list with ${cleanedProducts.length} products`);
            } else {
                // No products found - show empty state
                setProducts([]);
                console.log('No products found');
            }
        } catch (error) {
            console.error("Error loading products:", error);
            // Show empty state on error
            setProducts([]);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const filteredProducts =
        activeTab === "ALL"
            ? products
            : products.filter((p) =>
                p.name.toUpperCase().includes(activeTab.slice(0, -1)) ||
                p.name.toUpperCase().includes(activeTab) ||
                (activeTab === "TROUSER" && p.name.toUpperCase().includes("ROUSER")) // Handle Trousers vs Trouser
            );

    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-12 md:pb-0 bg-white">
                <Hero />

                {/* Section 2: Featured Categories */}
                {featuredCategories.length > 0 ? (
                    <div className="mt-8 md:mt-12 mb-8 md:mb-12">
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 md:mb-8 text-center">FEATURED CATEGORIES</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 w-full">
                            {featuredCategories.map((cat, idx) => {
                                return (
                                    <Link href={cat.link_url || "/shirt-collection"} key={idx} className="block hover:scale-[1.02] transition-transform duration-300">
                                        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
                                            {cat.img && cat.img.trim() !== "" ? (
                                                <Image
                                                    src={cat.img}
                                                    alt={cat.name || `Category ${idx}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                    unoptimized
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400">
                                                    <div className="text-center">
                                                        <svg className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-xs font-medium">No Image</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="mt-12 text-center px-4">
                        <p className="text-gray-500 text-sm">No featured categories available. Pin categories in the admin panel to display them here.</p>
                    </div>
                )}

                {/* Section 3: Shop Your Size */}
                <div className="mt-8 md:mt-12 text-center">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 md:mb-8 text-center">SHOP YOUR SIZE</h2>
                    <div className="w-full">
                        <Image
                            src="https://cdn.shopify.com/s/files/1/0420/7073/7058/files/refresh_18_nov_PLP02.jpg?v=1763468105"
                            alt="Shop Size Banner"
                            sizes="100vw"
                            width={1400}
                            height={400}
                            className="w-full h-auto"
                            priority
                        />
                    </div>
                </div>

                {/* Section 4: New and Popular */}
                <div className="mt-8 md:mt-12 pb-12 md:pb-12">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 md:mb-8 text-center">
                        NEW AND POPULAR
                    </h3>

                    {/* Filter Tabs */}
                    <div className="flex justify-start md:justify-center flex-nowrap overflow-x-auto gap-2 mb-6 md:mb-8 px-4 scrollbar-hide">
                        {TABS.map((tab) => (
                            <span
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`border border-black px-3 md:px-4 py-1.5 text-xs md:text-sm cursor-pointer transition-all whitespace-nowrap 
                  ${activeTab === tab
                                        ? "bg-black text-white"
                                        : "bg-white hover:bg-[#f0f0f0]"
                                    }`}
                            >
                                {tab}
                            </span>
                        ))}
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Loading products...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 w-full">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                            {filteredProducts.length === 0 && (
                                <p className="text-gray-500 mt-10 col-span-full text-center">No products found in this category.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <BottomNav />
        </>
    );
}
