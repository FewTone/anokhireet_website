"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName, getUserInitials } from "@/lib/utils";

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
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = params?.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [productImages, setProductImages] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        availability: false,
        details: false,
        occasion: false
    });
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const endDateInputRef = useRef<HTMLInputElement>(null);
    const [inquiryForm, setInquiryForm] = useState({
        start_date: "",
        end_date: "",
    });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [referrerPath, setReferrerPath] = useState('');
    const [hasHistory, setHasHistory] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setReferrerPath(document.referrer);
            setHasHistory(window.history.length > 1);
        }
    }, []);

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
            title: product?.name || 'Snitch Product',
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

                // Fetch owner name if owner_user_id exists
                let fetchedOwnerName = "";
                if (p.owner_user_id) {
                    const { data: ownerNameStr } = await supabase
                        .rpc('get_public_user_name', { user_uuid: p.owner_user_id });

                    if (ownerNameStr) {
                        fetchedOwnerName = ownerNameStr;
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

                    // Fetch owner name if owner_user_id exists
                    let fetchedOwnerName = "";
                    if (p.owner_user_id) {
                        const { data: ownerNameStr } = await supabase
                            .rpc('get_public_user_name', { user_uuid: p.owner_user_id });

                        if (ownerNameStr) {
                            fetchedOwnerName = ownerNameStr;
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
                setSelectedImage(imagesToUse.length > 0 ? imagesToUse[0] : productData.image);

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

    // Handle mobile carousel scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollPosition = container.scrollLeft;
        const width = container.clientWidth;
        // Calculate active index based on scroll position - simple snap logic
        const index = Math.round(scrollPosition / width);
        setActiveImageIndex(index);
    };

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
                <Navbar />
                <main className="min-h-screen pb-12">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading product...</p>
                    </div>
                </main>
                <Footer />
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
                        <div className="lg:col-span-7">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Mobile Image Carousel (Visible only on mobile) */}
                                <div className="md:hidden w-full relative">
                                    {/* Overlay Buttons for Mobile - Moved outside scroll container */}
                                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                                        {/* Back Button */}
                                        <button
                                            onClick={handleBack}
                                            className="w-10 h-10 flex items-center justify-center pointer-events-auto bg-white rounded-full shadow-md z-30"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M15 18l-6-6 6-6" />
                                            </svg>
                                        </button>

                                        {/* Right Action Buttons */}
                                        <div className="flex flex-col gap-4 pointer-events-auto items-center">
                                            {/* Wishlist Button */}
                                            <button
                                                onClick={toggleWishlist}
                                                disabled={wishlistLoading}
                                                className="w-10 h-10 flex items-center justify-center transition-transform active:scale-95 bg-white rounded-full shadow-md"
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill={isInWishlist ? "red" : "none"}
                                                    stroke={isInWishlist ? "red" : "black"}
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                </svg>
                                            </button>

                                            {/* Share Button */}
                                            <button
                                                onClick={handleShare}
                                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                                    <polyline points="16 6 12 2 8 6" />
                                                    <line x1="12" y1="2" x2="12" y2="15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[4/5] w-full bg-gray-100 relative"
                                        onScroll={handleScroll}
                                    >
                                        {displayImages.map((img, index) => (
                                            <div
                                                key={index}
                                                className="w-full flex-shrink-0 snap-center snap-always relative"
                                                style={{ scrollSnapStop: 'always' }}
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`${product.name} - View ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="100vw"
                                                    priority={index === 0}
                                                    unoptimized
                                                />
                                            </div>
                                        ))}
                                        {displayImages.length === 0 && (
                                            <div className="w-full flex-shrink-0 snap-center relative flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    {/* Mobile Dots Indicator - Overlay on Image or below */}
                                    {displayImages.length > 1 && (
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
                                            {displayImages.map((_, index) => (
                                                <div
                                                    key={index}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${index === activeImageIndex ? 'bg-black w-4' : 'bg-white/70 backdrop-blur-sm'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>


                                {/* Desktop Image Gallery (Hidden on mobile) */}
                                <div className="hidden md:flex flex-1 w-full flex-col gap-4">
                                        {/* Breadcrumbs */}
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                        <Link href="/" className="hover:text-black transition-colors">Home</Link>
                                        {referrerPath.includes('/products') && (
                                            <>
                                                <span>/</span>
                                                <Link href="/products" className="hover:text-black transition-colors">Products</Link>
                                            </>
                                        )}
                                        {referrerPath.includes('/my-products') && (
                                            <>
                                                <span>/</span>
                                                <Link href="/my-products" className="hover:text-black transition-colors">My Products</Link>
                                            </>
                                        )}
                                        <span>/</span>
                                        <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
                                    </div>

                                    <div className="flex gap-6 justify-end items-start px-4">
                                        {/* Left Side - Small Thumbnail Images (Vertical Column) */}
                                        <div className="flex flex-col gap-3 w-20 flex-shrink-0 pt-2">
                                            {displayImages.map((img, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImage(img)}
                                                    className={`relative w-full aspect-[4/5] border-2 transition-all overflow-hidden bg-gray-50 ${selectedImage === img
                                                        ? "border-black"
                                                        : "border-gray-300 hover:border-gray-500"
                                                        }`}
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`${product.name} - View ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        sizes="80px"
                                                        unoptimized
                                                        onError={(e) => {
                                                            console.error("Image load error:", img);
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>

                                        {/* Center - Main Product Image */}
                                        <div className="relative w-full max-w-[500px] aspect-[4/5] bg-gray-100 shadow-sm">
                                            {selectedImage ? (
                                                <Image
                                                    src={selectedImage}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 1024px) 50vw, 500px"
                                                    priority
                                                    unoptimized
                                                    onError={(e) => {
                                                        console.error("Image load error:", selectedImage);
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                    <span>No Image</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side - Action Buttons (Outside Image) */}
                                        <div className="flex flex-col gap-3 pt-4">
                                            {/* Wishlist Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist();
                                                }}
                                                disabled={wishlistLoading}
                                                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                                                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill={isInWishlist ? "red" : "none"}
                                                    stroke={isInWishlist ? "red" : "currentColor"}
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="text-gray-900 group-hover:text-black"
                                                >
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                </svg>
                                            </button>

                                            {/* Share Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShare();
                                                }}
                                                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                                                title="Share Product"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 group-hover:text-black">
                                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                                    <polyline points="16 6 12 2 8 6" />
                                                    <line x1="12" y1="2" x2="12" y2="15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Product Information */}
                        <div className="lg:col-span-5 px-4 md:px-0 mt-0 lg:mt-12">
                            <div className="sticky top-24">
                                <div className="bg-white space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">{product.name}</h2>

                                        {/* Pricing Information */}
                                        <div className="mb-6 space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm text-gray-500">Rental Price</span>
                                                <span className="text-3xl font-bold text-gray-900">
                                                    {product.price && !product.price.startsWith('₹') ? `₹${product.price.replace(/[₹,]/g, '')}` : product.price}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {product.original_price && (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-sm text-gray-500">Original Price</span>
                                                        <span className="text-xl text-gray-600">
                                                            ₹{typeof product.original_price === 'number' ? product.original_price.toLocaleString() : parseFloat(String(product.original_price)).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                {currentUser && product.owner_user_id && currentUser.id === product.owner_user_id ? (
                                                    <div className="mt-4">
                                                        <button
                                                            disabled
                                                            className="w-full bg-gray-100 text-gray-500 font-semibold py-4 px-6 cursor-not-allowed border border-gray-200"
                                                        >
                                                            Your Product
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                                        <button
                                                            onClick={handleMakeInquiry}
                                                            className="bg-black text-white font-semibold py-4 px-6 hover:opacity-90 transition-opacity text-center text-sm md:text-base"
                                                        >
                                                            Make Inquiry
                                                        </button>
                                                        <button
                                                            onClick={handleMakeInquiry}
                                                            className="bg-black text-white font-semibold py-4 px-6 hover:opacity-90 transition-opacity text-center text-sm md:text-base"
                                                        >
                                                            Send Msg
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className="space-y-4 border-t border-gray-200 pt-6">
                                            {product.ownerName && product.owner_user_id && (
                                                <Link
                                                    href={`/products?owner_id=${product.owner_user_id}`}
                                                    className="flex items-center gap-3 mb-4 group hover:opacity-80 transition-opacity w-fit relative z-10 pointer-events-auto"
                                                >
                                                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-base font-medium tracking-wide">
                                                        {getUserInitials(product.ownerName)}
                                                    </div>
                                                    <div className="text-lg font-medium text-gray-900 group-hover:underline decoration-black/50 underline-offset-4">
                                                        {formatUserDisplayName(product.ownerName)}
                                                    </div>
                                                </Link>
                                            )}
                                            {/* Product Information Accordion */}
                                            <div className="space-y-0 border-t border-gray-200 pt-2">
                                                {/* Availability Section */}
                                                <div className="border-b border-gray-100">
                                                    <button
                                                        onClick={() => setExpandedSections(prev => ({ ...prev, availability: !prev.availability }))}
                                                        className="w-full flex items-center justify-between py-4 text-left group"
                                                    >
                                                        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Availability</span>
                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.availability ? 'rotate-180' : ''}`}
                                                        >
                                                            <path d="M6 9l6 6 6-6" />
                                                        </svg>
                                                    </button>
                                                    {expandedSections.availability && product.cities && product.cities.length > 0 && (
                                                        <div className="pb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                                            <div className="space-y-3 text-sm text-gray-600">
                                                                <div>
                                                                    <span className="font-medium text-gray-700">Available City:</span>
                                                                    <p className="mt-1">{product.cities.join(", ")}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Details Section */}
                                                <div className="border-b border-gray-100">
                                                    <button
                                                        onClick={() => setExpandedSections(prev => ({ ...prev, details: !prev.details }))}
                                                        className="w-full flex items-center justify-between py-4 text-left group"
                                                    >
                                                        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Product Details</span>
                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.details ? 'rotate-180' : ''}`}
                                                        >
                                                            <path d="M6 9l6 6 6-6" />
                                                        </svg>
                                                    </button>
                                                    {expandedSections.details && (
                                                        <div className="pb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                                            <div className="space-y-4 text-sm text-gray-600">
                                                                {product.productId && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-700">Product ID:</span>
                                                                        <p className="mt-1 font-mono text-[12px]">{product.productId}</p>
                                                                    </div>
                                                                )}

                                                                {product.category && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-700">Category:</span>
                                                                        <p className="mt-1">{product.category}</p>
                                                                    </div>
                                                                )}
                                                                {product.productTypes && product.productTypes.length > 0 && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-700">Product Type:</span>
                                                                        <p className="mt-1">{product.productTypes.join(", ")}</p>
                                                                    </div>
                                                                )}
                                                                {product.colors && product.colors.length > 0 && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-700">Color:</span>
                                                                        <div className="flex gap-2 mt-1">
                                                                            {product.colors.map((color, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="w-6 h-6 rounded border border-gray-300"
                                                                                    style={{ backgroundColor: color.hex || color.name }}
                                                                                    title={color.name}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {product.materials && product.materials.length > 0 && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-700">Material:</span>
                                                                        <p className="mt-1">{product.materials.join(", ")}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Occasion Section */}
                                                <div className="border-b border-gray-100">
                                                    <button
                                                        onClick={() => setExpandedSections(prev => ({ ...prev, occasion: !prev.occasion }))}
                                                        className="w-full flex items-center justify-between py-4 text-left group"
                                                    >
                                                        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Occasion</span>
                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.occasion ? 'rotate-180' : ''}`}
                                                        >
                                                            <path d="M6 9l6 6 6-6" />
                                                        </svg>
                                                    </button>
                                                    {expandedSections.occasion && product.occasions && product.occasions.length > 0 && (
                                                        <div className="pb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                                            <div className="space-y-3 text-sm text-gray-600">
                                                                <div>
                                                                    <p className="mt-1">{product.occasions.join(", ")}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
                    </div>
                </div >
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
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                    <input
                                        type="date"
                                        value={inquiryForm.start_date}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            setInquiryForm({ ...inquiryForm, start_date: newDate });
                                            // Auto open end date picker after a short delay to allow state update
                                            if (newDate) {
                                                setTimeout(() => {
                                                    if (endDateInputRef.current) {
                                                        (endDateInputRef.current as any).showPicker?.();
                                                    }
                                                }, 100);
                                            }
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        onClick={(e) => (e.target as any).showPicker?.()}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={endDateInputRef}
                                        type="date"
                                        value={inquiryForm.end_date}
                                        onChange={(e) => setInquiryForm({ ...inquiryForm, end_date: e.target.value })}
                                        min={inquiryForm.start_date || new Date().toISOString().split('T')[0]}
                                        max={getMaxEndDate(inquiryForm.start_date)}
                                        onClick={(e) => (e.target as any).showPicker?.()}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                                    />
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

