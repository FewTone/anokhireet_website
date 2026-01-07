"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    created_at?: string;
}

export default function Home() {
    const [activeTab, setActiveTab] = useState("ALL");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [featuredCategories, setFeaturedCategories] = useState<Array<{ img: string; link_url?: string }>>([]);
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:51',message:'Calling loadCategories from useEffect',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        loadCategories().catch((error) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:54',message:'loadCategories promise rejected',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
            // #endregion
            console.error("Error loading categories:", error);
            setLoading(false);
        }); // Load categories from database

        // Set up Supabase Realtime subscriptions for instant updates
        const categoriesChannel = supabase
            .channel('categories-changes-home')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'categories'
                },
                (payload) => {
                    console.log('🔄 Categories table changed:', payload.eventType, payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                        loadCategories();
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Categories subscription status:', status);
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
            supabase.removeChannel(categoriesChannel);
            clearInterval(pollInterval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, []);

    const loadCategories = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:139',message:'loadCategories called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:142',message:'Querying categories with is_featured=true',data:{query:'select * from categories where is_featured=true order by display_order'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .eq("is_featured", true) // Only load featured/pinned categories
                .order("display_order", { ascending: true });

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:149',message:'Categories query result',data:{hasError:!!error,errorMessage:error?.message,errorCode:error?.code,dataLength:data?.length,data:data?.map(c=>({id:c.id,name:c.name,is_featured:c.is_featured,image_url:c.image_url,display_order:c.display_order}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion

            if (error) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:152',message:'Categories query error',data:{error:error.message,code:error.code,details:error.details,hint:error.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                console.error("❌ Error loading categories:", error);
                console.error("Error details:", { message: error.message, code: error.code, details: error.details, hint: error.hint });
                return;
            }

            if (data && data.length > 0) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:157',message:'Mapping categories to featuredCategories',data:{mappedCount:data.length,mapped:data.map(cat=>({img:cat.image_url,link_url:cat.link_url||'/shirt-collection'}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.log('✅ Featured categories found:', data.length, data);
                const mapped = data.map(cat => ({
                    img: cat.image_url || null,
                    link_url: cat.link_url || "/shirt-collection"
                }));
                console.log('✅ Mapped featured categories:', mapped);
                console.log('✅ Setting featured categories state with', mapped.length, 'categories');
                setFeaturedCategories(mapped);
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:161',message:'No featured categories found',data:{dataLength:data?.length,dataIsNull:!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                console.warn('⚠️ No featured categories found. Data:', data);
                setFeaturedCategories([]);
            }
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:164',message:'loadCategories catch error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            console.error("Error loading categories:", error);
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
            <main className="min-h-screen">
                <Hero />

                {/* Section 2: Featured Categories */}
                {/* #region agent log */}
                {(() => {
                    console.log('🔍 Featured Categories State:', { length: featuredCategories.length, categories: featuredCategories });
                    fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:261',message:'Rendering featured categories section',data:{featuredCategoriesLength:featuredCategories.length,featuredCategories:featuredCategories},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                    return null;
                })()}
                {/* #endregion */}
                {featuredCategories.length > 0 && (
                <div className="mt-12 mb-12 text-center px-4">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">FEATURED CATEGORIES</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:flex xl:flex-wrap justify-center gap-4 max-w-7xl mx-auto">
                            {featuredCategories.map((cat, idx) => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:268',message:'Rendering featured category item',data:{index:idx,img:cat.img,link_url:cat.link_url,hasImg:!!cat.img},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                                // #endregion
                                return (
                                <Link href={cat.link_url || "/shirt-collection"} key={idx} className="block hover:scale-105 transition-transform duration-200">
                                <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
                                    {cat.img && cat.img.trim() !== "" ? (
                                        <Image
                                            src={cat.img}
                                            alt={`Category ${idx}`}
                                            fill
                                            className="rounded-lg object-cover"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            unoptimized
                                            onError={(e) => {
                                                // #region agent log
                                                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:277',message:'Image load error',data:{index:idx,img:cat.img},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
                                                // #endregion
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400">
                                            <div className="text-center">
                                                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="mt-12 text-center px-4">
                    <h2 className="text-2xl font-bold mb-4">SHOP YOUR SIZE</h2>
                    <div className="max-w-[1200px] mx-auto">
                        <Image
                            src="https://cdn.shopify.com/s/files/1/0420/7073/7058/files/refresh_18_nov_PLP02.jpg?v=1763468105"
                            alt="Shop Size Banner"
                            sizes="100vw"
                            width={1200}
                            height={400}
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                {/* Section 4: New and Popular */}
                <div className="mt-12 pb-12">
                    <h3 className="text-2xl font-bold text-center mb-4">
                        NEW AND POPULAR
                    </h3>

                    {/* Filter Tabs */}
                    <div className="flex justify-start md:justify-center flex-nowrap overflow-x-auto gap-2 mb-8 px-4 scrollbar-hide">
                        {TABS.map((tab) => (
                            <span
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`border border-black px-4 py-1.5 text-xs md:text-sm cursor-pointer transition-all whitespace-nowrap 
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-[1400px] mx-auto px-4">
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
        </>
    );
}
