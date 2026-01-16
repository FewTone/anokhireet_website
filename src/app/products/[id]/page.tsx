"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import ProductGallery from "@/components/products/ProductGallery";
import ProductInfo from "@/components/products/ProductInfo";
import RelatedProducts from "@/components/products/RelatedProducts";
import ProductAccordions from "@/components/products/ProductAccordions";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName, getUserInitials } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Product {
    id: number | string;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
    original_price?: number | string;
    owner_user_id?: string;
    db_id?: string; // Database UUID
    productTypes?: string[];
    occasions?: string[];
    colors?: { name: string; hex?: string }[];
    materials?: string[];
    cities?: string[];

    ownerName?: string;
    ownerAvatar?: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = params?.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [productImages, setProductImages] = useState<string[]>([]);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    // const endDateInputRef = useRef<HTMLInputElement>(null); // Removed native ref
    const startDatePickerRef = useRef<any>(null);
    const endDatePickerRef = useRef<any>(null);
    const [inquiryForm, setInquiryForm] = useState({
        start_date: "",
        end_date: "",
    });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [referrerPath, setReferrerPath] = useState('');
    const [hasHistory, setHasHistory] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setReferrerPath(document.referrer);
            setHasHistory(window.history.length > 1);
        }
    }, []);

    useEffect(() => {
        if (product) {
            loadRelatedProducts();
        }
    }, [product, searchParams]);

    const loadRelatedProducts = async () => {
        if (!product) return;
        setLoadingRelated(true);

        try {
            // Extract filters from URL
            const productTypeParam = searchParams.get("product_type");
            const occasionParam = searchParams.get("occasion");
            const colorsParam = searchParams.get("colors");
            const materialsParam = searchParams.get("materials");
            const citiesParam = searchParams.get("cities");
            const priceMinParam = searchParams.get("price_min");
            const priceMaxParam = searchParams.get("price_max");
            // const ownerIdParam = searchParams.get("owner_id"); // Ideally should respect owner filter too if present

            let filteredProductIds: Set<string> | null = null;
            let hasFilters = false;

            // 1. Filter by Product Type
            if (productTypeParam) {
                hasFilters = true;
                const { data } = await supabase
                    .from("product_product_types")
                    .select("product_id")
                    .eq("type_id", productTypeParam);

                if (data) {
                    const ids = new Set(data.map(item => String(item.product_id)));
                    filteredProductIds = ids;
                } else {
                    setRelatedProducts([]);
                    setLoadingRelated(false);
                    return;
                }
            }

            // 2. Filter by Occasion
            if (occasionParam) {
                hasFilters = true;
                const { data } = await supabase
                    .from("product_occasions")
                    .select("product_id")
                    .eq("occasion_id", occasionParam);

                if (data) {
                    const ids = new Set(data.map(item => String(item.product_id)));
                    if (filteredProductIds) {
                        filteredProductIds = new Set([...filteredProductIds].filter(id => ids.has(id)));
                    } else {
                        filteredProductIds = ids;
                    }
                }
            }

            // 3. Filter by Colors
            if (colorsParam) {
                hasFilters = true;
                const colorIds = colorsParam.split(',');
                const { data } = await supabase
                    .from("product_colors")
                    .select("product_id")
                    .in("color_id", colorIds);

                if (data) {
                    const ids = new Set(data.map(item => String(item.product_id)));
                    if (filteredProductIds) {
                        filteredProductIds = new Set([...filteredProductIds].filter(id => ids.has(id)));
                    } else {
                        filteredProductIds = ids;
                    }
                }
            }

            // If no filters are applied, showing "related" based on category or type of the CURRENT product might be good, 
            // but the user specifically asked for "if user filter apply".
            // So we strictly follow that. If no filters, maybe empty or generic fallback? 
            // We'll show generic fallback (same category) if no filters, but prioritize filters if present.

            let query = supabase
                .from("products")
                .select("*")
                .neq("id", product.db_id) // Exclude current product using DB ID which is safe
                .eq("is_active", true)
                .limit(8); // Show 8 related products

            if (filteredProductIds) {
                if (filteredProductIds.size === 0) {
                    setRelatedProducts([]);
                    setLoadingRelated(false);
                    return;
                }
                query = query.in("id", Array.from(filteredProductIds));
            } else if (hasFilters) {
                // Filters were valid but returned no products (e.g. invalid IDs)
                setRelatedProducts([]);
                setLoadingRelated(false);
                return;
            } else if (product.category) {
                // Fallback: Same category
                query = query.eq("category", product.category);
            }

            if (priceMinParam) query = query.gte("price", priceMinParam);
            if (priceMaxParam) query = query.lte("price", priceMaxParam);

            const { data, error } = await query;

            if (data) {
                const formattedProducts: Product[] = data.map((p: any) => ({
                    id: p.id,
                    productId: p.product_id,
                    name: p.title || p.name,
                    price: p.price,
                    image: p.image || (p.images && p.images[0]) || "",
                    category: p.category,
                    original_price: p.original_price,
                    owner_user_id: p.owner_user_id,
                }));
                setRelatedProducts(formattedProducts);
            }
        } catch (error) {
            console.error("Error loading related products:", error);
        } finally {
            setLoadingRelated(false);
        }
    };

    useEffect(() => {
        if (productId) {
            loadProduct();
            checkLoginStatus();
        }
    }, [productId]);

    // Check if user was redirected from login (inquiry parameter)
    useEffect(() => {
        if (productId && isLoggedIn && searchParams.get('inquiry') === 'true') {
            // User just logged in and returned - open inquiry modal
            setTimeout(() => {
                setShowInquiryModal(true);
            }, 500);
        }
    }, [productId, isLoggedIn, searchParams]);

    // Check wishlist status
    useEffect(() => {
        const checkWishlist = async () => {
            if (!isLoggedIn || !currentUser || !product?.db_id) return;

            try {
                const { data } = await supabase
                    .from('wishlist')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('product_id', product.db_id)
                    .maybeSingle(); // Use maybeSingle to avoid error if 0 rows

                setIsInWishlist(!!data);
            } catch (error) {
                console.error('Error checking wishlist:', error);
            }
        };

        checkWishlist();
    }, [isLoggedIn, currentUser, product]);

    const handleShare = async () => {
        const shareData = {
            title: product?.name || 'Anokhi Reet Product',
            text: `Check out this product: ${product?.name}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const toggleWishlist = async () => {
        if (!isLoggedIn) {
            router.push(`/profile?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        if (!product?.db_id || !currentUser?.id) return;

        setWishlistLoading(true);
        const newStatus = !isInWishlist;
        // Optimistic update
        setIsInWishlist(newStatus);

        try {
            if (newStatus) {
                // Add to wishlist
                await supabase.from('wishlist').insert({
                    user_id: currentUser.id,
                    product_id: product.db_id
                });
            } else {
                // Remove from wishlist
                await supabase.from('wishlist')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('product_id', product.db_id);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            // Revert on error
            setIsInWishlist(!newStatus);
        } finally {
            setWishlistLoading(false);
        }
    };

    const checkLoginStatus = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("id, name")
                    .eq("auth_user_id", session.user.id)
                    .maybeSingle();

                if (userData) {
                    setIsLoggedIn(true);
                    setCurrentUser(userData);
                } else {
                    setIsLoggedIn(false);
                    setCurrentUser(null);
                }
            } else {
                setIsLoggedIn(false);
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            setIsLoggedIn(false);
        }
    };


    const handleBack = () => {
        if (hasHistory) {
            router.back();
        } else {
            router.push('/');
        }
    };

    // Track product view
    const trackProductView = async (prodId: string) => {
        try {
            if (!prodId) return;

            // Record the view (even if product doesn't exist anymore - tracks deleted products too)
            await supabase
                .from("product_views")
                .insert({
                    product_id: prodId,
                    product_type: 'user', // All products are user products now
                    viewed_at: new Date().toISOString(),
                });
        } catch (error) {
            console.error("Error tracking product view:", error);
            // Silently fail - don't interrupt user experience
        }
    };

    const loadProduct = async () => {
        try {
            // Load from products table
            let productImages: string[] = [];
            let productData = null;

            const { data: productsByProductId, error: productsByProductIdError } = await supabase
                .from("products")
                .select("*")
                .eq("product_id", productId)
                .limit(1);

            if (!productsByProductIdError && productsByProductId && productsByProductId.length > 0) {
                const p = productsByProductId[0];
                // Get all images from images array or fallback to single image
                if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                    productImages = p.images;
                } else if (p.image) {
                    productImages = [p.image];
                }

                // Fetch owner name and avatar if owner_user_id exists
                let fetchedOwnerName = "";
                let fetchedOwnerAvatar = "";
                if (p.owner_user_id) {
                    const { data: ownerData } = await supabase
                        .from('users')
                        .select('name, avatar_url')
                        .eq('id', p.owner_user_id)
                        .single();

                    if (ownerData) {
                        fetchedOwnerName = ownerData.name;
                        fetchedOwnerAvatar = ownerData.avatar_url;
                    }
                }

                productData = {
                    id: typeof p.id === 'string' ? p.id : 0,
                    productId: p.product_id,
                    name: p.title || p.name,
                    price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                    image: productImages.length > 0 ? productImages[0] : p.image || "",
                    category: p.category || p.category_id,
                    original_price: p.original_price,
                    owner_user_id: p.owner_user_id,
                    ownerName: fetchedOwnerName,
                    ownerAvatar: fetchedOwnerAvatar,
                    db_id: p.id,
                };
            } else {
                // Try direct id match
                const { data: productsById, error: productsByIdError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", productId)
                    .limit(1);

                if (!productsByIdError && productsById && productsById.length > 0) {
                    const p = productsById[0];
                    // Get all images from images array or fallback to single image
                    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                        productImages = p.images;
                    } else if (p.image) {
                        productImages = [p.image];
                    }

                    // Fetch owner name and avatar if owner_user_id exists
                    let fetchedOwnerName = "";
                    let fetchedOwnerAvatar = "";
                    if (p.owner_user_id) {
                        const { data: ownerData } = await supabase
                            .from('users')
                            .select('name, avatar_url')
                            .eq('id', p.owner_user_id)
                            .single();

                        if (ownerData) {
                            fetchedOwnerName = ownerData.name;
                            fetchedOwnerAvatar = ownerData.avatar_url;
                        }
                    }

                    productData = {
                        id: typeof p.id === 'string' ? p.id : 0,
                        productId: p.product_id || p.id,
                        name: p.title || p.name,
                        price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                        image: productImages.length > 0 ? productImages[0] : p.image || "",
                        category: p.category || p.category_id,
                        original_price: p.original_price,
                        owner_user_id: p.owner_user_id,
                        ownerName: fetchedOwnerName,
                        ownerAvatar: fetchedOwnerAvatar,
                        db_id: p.id,
                    };
                }
            }

            if (productData) {
                // Fetch product facets (types, occasions, colors, materials, cities)
                const [productTypesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                    supabase
                        .from("product_product_types")
                        .select("type_id")
                        .eq("product_id", productData.db_id),
                    supabase
                        .from("product_occasions")
                        .select("occasion_id")
                        .eq("product_id", productData.db_id),
                    supabase
                        .from("product_colors")
                        .select("color_id")
                        .eq("product_id", productData.db_id),
                    supabase
                        .from("product_materials")
                        .select("material_id")
                        .eq("product_id", productData.db_id),
                    supabase
                        .from("product_cities")
                        .select("city_id")
                        .eq("product_id", productData.db_id),
                ]);

                // Extract IDs and fetch names
                const productTypeIds = productTypesRes.data?.map((pt: any) => pt.type_id).filter(Boolean) || [];
                const occasionIds = occasionsRes.data?.map((oc: any) => oc.occasion_id).filter(Boolean) || [];
                const colorIds = colorsRes.data?.map((c: any) => c.color_id).filter(Boolean) || [];
                const materialIds = materialsRes.data?.map((m: any) => m.material_id).filter(Boolean) || [];
                const cityIds = citiesRes.data?.map((c: any) => c.city_id).filter(Boolean) || [];

                // Fetch names for each facet type
                const [productTypesData, occasionsData, colorsData, materialsData, citiesData] = await Promise.all([
                    productTypeIds.length > 0 ? supabase.from("product_types").select("name").in("id", productTypeIds) : Promise.resolve({ data: [], error: null }),
                    occasionIds.length > 0 ? supabase.from("occasions").select("name").in("id", occasionIds) : Promise.resolve({ data: [], error: null }),
                    colorIds.length > 0 ? supabase.from("colors").select("name, hex").in("id", colorIds) : Promise.resolve({ data: [], error: null }),
                    materialIds.length > 0 ? supabase.from("materials").select("name").in("id", materialIds) : Promise.resolve({ data: [], error: null }),
                    cityIds.length > 0 ? supabase.from("cities").select("name").in("id", cityIds) : Promise.resolve({ data: [], error: null }),
                ]);

                const productTypes = productTypesData.data?.map((pt: any) => pt.name).filter(Boolean) || [];
                const occasions = occasionsData.data?.map((oc: any) => oc.name).filter(Boolean) || [];
                const colors = colorsData.data?.map((c: any) => ({ name: c.name, hex: c.hex })).filter((c: any) => c.name) || [];
                const materials = materialsData.data?.map((m: any) => m.name).filter(Boolean) || [];
                const cities = citiesData.data?.map((c: any) => c.name).filter(Boolean) || [];

                setProduct({
                    ...productData,
                    productTypes,
                    occasions,
                    colors,
                    materials,
                    cities,
                });

                // Use all images if available, otherwise use single image
                const imagesToUse = productImages.length > 0 ? productImages : (productData.image ? [productData.image] : []);
                setProductImages(imagesToUse);


                // Track view after product is loaded
                const finalProductId = productData.productId || productId;
                trackProductView(finalProductId);
            } else {
                // Even if product not found, track the view (for deleted products)
                trackProductView(productId);
            }
        } catch (error) {
            console.error("Error loading product:", error);
        } finally {
            setLoading(false);
        }
    };

    // Removed toggleSection - no longer needed



    const handleMakeInquiry = () => {
        if (!isLoggedIn) {
            // Redirect to login page with return URL
            const returnUrl = `/products/${productId}?inquiry=true`;
            router.push(`/profile?returnUrl=${encodeURIComponent(returnUrl)}`);
            return;
        }
        setShowInquiryModal(true);
    };

    const getMaxEndDate = (startDate: string) => {
        if (!startDate) return undefined;
        const date = new Date(startDate);
        date.setDate(date.getDate() + 6);
        return date.toISOString().split('T')[0];
    };

    const handleSubmitInquiry = async () => {
        if (!product || !currentUser || !product.db_id || !product.owner_user_id) {
            alert("Missing product or user information");
            return;
        }

        if (!inquiryForm.start_date || !inquiryForm.end_date) {
            alert("Please select both start and end dates");
            return;
        }

        const startDate = new Date(inquiryForm.start_date);
        const endDate = new Date(inquiryForm.end_date);

        if (endDate <= startDate) {
            alert("End date must be after start date");
            return;
        }

        // Check max duration (6 days)
        const start = new Date(inquiryForm.start_date);
        const end = new Date(inquiryForm.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 6) {
            alert("Maximum rental duration is 6 days.");
            return;
        }

        setSubmittingInquiry(true);

        try {
            let chatId = null;
            let inquiryId = null;

            // 1. Check if an inquiry already exists for this product and user pair
            const { data: existingInquiries } = await supabase
                .from("inquiries")
                .select("id, status")
                .eq("product_id", product.db_id)
                .eq("owner_user_id", product.owner_user_id)
                .eq("renter_user_id", currentUser.id)
                .order("created_at", { ascending: false })
                .limit(1);

            if (existingInquiries && existingInquiries.length > 0) {
                const existingInquiry = existingInquiries[0];

                // 2. Check if a chat exists for this inquiry
                const { data: existingChat } = await supabase
                    .from("chats")
                    .select("id")
                    .eq("inquiry_id", existingInquiry.id)
                    .single();

                if (existingChat) {
                    chatId = existingChat.id;
                    inquiryId = existingInquiry.id;

                    console.log("Found existing chat, reusing:", chatId);

                    // Update existing inquiry with new dates and set to pending
                    const { error: updateError } = await supabase
                        .from("inquiries")
                        .update({
                            start_date: inquiryForm.start_date,
                            end_date: inquiryForm.end_date,
                            status: 'pending'
                        })
                        .eq("id", inquiryId);

                    if (updateError) console.error("Error updating existing inquiry:", updateError);
                }
            }

            // 3. If no existing chat found, create new inquiry and chat
            if (!chatId) {
                // Create inquiry
                const { data: inquiryData, error: inquiryError } = await supabase
                    .from("inquiries")
                    .insert([{
                        product_id: product.db_id,
                        owner_user_id: product.owner_user_id,
                        renter_user_id: currentUser.id,
                        start_date: inquiryForm.start_date,
                        end_date: inquiryForm.end_date,
                        status: 'pending'
                    }])
                    .select()
                    .single();

                if (inquiryError) throw inquiryError;
                inquiryId = inquiryData.id;

                // Create chat for this inquiry
                const { data: chatData, error: chatError } = await supabase
                    .from("chats")
                    .insert([{
                        inquiry_id: inquiryData.id
                    }])
                    .select()
                    .single();

                if (chatError) throw chatError;
                chatId = chatData.id;
            }

            // Create initial message in chat automatically
            const startDateFormatted = new Date(inquiryForm.start_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            const endDateFormatted = new Date(inquiryForm.end_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // Create a rich message object for the card
            const cardMessage = {
                type: "inquiry_card",
                product: {
                    id: product.db_id,
                    productId: product.productId || "N/A", // Add human readable ID
                    name: product.name,
                    image: product.image,
                    price: product.price
                },
                dates: {
                    start: startDateFormatted,
                    end: endDateFormatted
                }
            };

            // The text message
            const textMessage = `Hi! I'm interested in renting "${product.name}" from ${startDateFormatted} to ${endDateFormatted}. Please let me know if it's available.`;

            // Insert both messages
            const { error: messageError } = await supabase
                .from("messages")
                .insert([
                    {
                        chat_id: chatId,
                        sender_user_id: currentUser.id,
                        message: JSON.stringify(cardMessage)
                    },
                    {
                        chat_id: chatId,
                        sender_user_id: currentUser.id,
                        message: textMessage
                    }
                ]);

            if (messageError) {
                console.error("Error creating initial message:", messageError);
                // Don't fail the inquiry if message creation fails
            }

            setShowInquiryModal(false);
            setInquiryForm({ start_date: "", end_date: "" });

            // Redirect to chat
            router.push(`/chat?id=${chatId}`);
        } catch (error: any) {
            console.error("Error submitting inquiry:", error);
            alert(error.message || "Failed to submit inquiry. Please try again.");
        } finally {
            setSubmittingInquiry(false);
        }
    };


    if (loading) {
        return (
            <>
                <div className="hidden md:block">
                    <Navbar />
                </div>
                <ProductDetailSkeleton />
            </>
        );
    }

    if (!product) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pb-12">
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">Product not found</p>
                        <button
                            onClick={() => router.push("/")}
                            className="px-6 py-2 bg-black text-white hover:opacity-90 transition-opacity"
                        >
                            Go to Home
                        </button>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Use productImages state, fallback to single image if empty
    const displayImages = productImages.length > 0 ? productImages : (product.image ? [product.image] : []);

    return (
        <>
            <div className="hidden md:block">
                <Navbar />
            </div>
            <main className="min-h-screen pt-0 pb-12">
                <div className="max-w-[1400px] mx-auto px-0 md:px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
                        {/* Main Content - Product Images with Thumbnails on Left */}
                        <ProductGallery
                            images={displayImages}
                            productName={product.name}
                            isInWishlist={isInWishlist}
                            isWishlistLoading={wishlistLoading}
                            onToggleWishlist={toggleWishlist}
                            onShare={handleShare}
                            onBack={handleBack}
                        />

                        {/* Right Sidebar - Product Information */}
                        <div className="lg:col-span-5 px-4 md:px-0 mt-0 lg:mt-24">
                            <div className="">
                                <ProductInfo
                                    title={product.name}
                                    productId={product.productId || product.id}
                                    price={product.price}
                                    originalPrice={product.original_price}
                                    ownerId={product.owner_user_id}
                                    currentUserId={currentUser?.id}
                                    onMakeInquiry={handleMakeInquiry}
                                />

                                {/* Product Details */}
                                <div className="space-y-4 border-t border-gray-200 pt-6">
                                    {product.ownerName && product.owner_user_id && (
                                        <Link
                                            href={`/products?owner_id=${product.owner_user_id}`}
                                            className="flex items-center gap-3 mb-4 group hover:opacity-80 transition-opacity w-fit relative z-10 pointer-events-auto"
                                        >
                                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-base font-medium tracking-wide overflow-hidden border border-gray-200">
                                                {product.ownerAvatar ? (
                                                    <img src={product.ownerAvatar} alt={product.ownerName} className="w-full h-full object-cover" />
                                                ) : (
                                                    getUserInitials(product.ownerName)
                                                )}
                                            </div>
                                            <div className="text-lg font-medium text-gray-900 group-hover:underline decoration-black/50 underline-offset-4">
                                                {formatUserDisplayName(product.ownerName)}
                                            </div>
                                        </Link>
                                    )}
                                    {/* Product Information Accordion */}
                                    <div className="space-y-0 border-t border-gray-200 pt-2">
                                        <ProductAccordions product={product} />
                                    </div>

                                    {/* Bottom bar space removed per user request to move buttons up */}
                                    <div className="pt-2">
                                        {/* Clean space below accordions */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>



                </div>


                <RelatedProducts products={relatedProducts} loading={loadingRelated} />
            </main >
            <Footer />

            {/* Inquiry Modal */}
            {
                showInquiryModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-none max-w-md w-full p-6 relative">
                            <button
                                onClick={() => {
                                    setShowInquiryModal(false);
                                    setInquiryForm({ start_date: "", end_date: "" });
                                }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>

                            <h2 className="text-2xl font-bold mb-6">Make an Inquiry</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative group custom-datepicker-wrapper">
                                        <DatePicker
                                            selected={inquiryForm.start_date ? new Date(inquiryForm.start_date) : null}
                                            onChange={(date: Date | null) => {
                                                if (date) {
                                                    // Normalize to YYYY-MM-DD local time to avoid timezone shifts
                                                    const dateString = date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
                                                    setInquiryForm(prev => ({ ...prev, start_date: dateString }));

                                                    // Auto open end date picker
                                                    setTimeout(() => {
                                                        endDatePickerRef.current?.setOpen(true);
                                                    }, 50);
                                                } else {
                                                    setInquiryForm(prev => ({ ...prev, start_date: "" }));
                                                }
                                            }}
                                            minDate={new Date()}
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="dd/mm/yyyy"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-none text-gray-900 focus:border-black outline-none h-[42px] transition-colors"
                                            ref={startDatePickerRef}
                                            onKeyDown={(e) => e.preventDefault()} // Block typing
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group custom-datepicker-wrapper">
                                        <DatePicker
                                            selected={inquiryForm.end_date ? new Date(inquiryForm.end_date) : null}
                                            onChange={(date: Date | null) => {
                                                if (date) {
                                                    const dateString = date.toLocaleDateString('en-CA');
                                                    setInquiryForm(prev => ({ ...prev, end_date: dateString }));
                                                } else {
                                                    setInquiryForm(prev => ({ ...prev, end_date: "" }));
                                                }
                                            }}
                                            minDate={inquiryForm.start_date ? new Date(inquiryForm.start_date) : new Date()}
                                            maxDate={inquiryForm.start_date ? new Date(new Date(inquiryForm.start_date).getTime() + (6 * 24 * 60 * 60 * 1000)) : undefined}
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="dd/mm/yyyy"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-none text-gray-900 focus:border-black outline-none h-[42px] transition-colors"
                                            ref={endDatePickerRef}
                                            onKeyDown={(e) => e.preventDefault()} // Block typing
                                        />
                                    </div>
                                </div>

                                {inquiryForm.start_date && (
                                    <p className="text-[12px] text-gray-500 mt-[-10px] mb-4">
                                        * Maximum 6 days allowed (Max: {new Date(getMaxEndDate(inquiryForm.start_date)!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})
                                    </p>
                                )}

                                <button
                                    onClick={handleSubmitInquiry}
                                    disabled={submittingInquiry || !inquiryForm.start_date || !inquiryForm.end_date}
                                    className="w-full bg-black text-white font-semibold py-3 px-4 rounded-none hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {submittingInquiry ? "Submitting..." : "Submit Inquiry"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}

