"use client";

import { useState, useEffect } from "react";
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
    // Removed expandedSections - no longer needed
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const [inquiryForm, setInquiryForm] = useState({
        start_date: "",
        end_date: "",
    });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [hasHistory, setHasHistory] = useState(false);

    useEffect(() => {
        // specific check for history availability
        setHasHistory(window.history.length > 1);

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
        // Safer back navigation:
        // 1. If we have history, try to go back
        // 2. If referrer is from our own site, go back
        // 3. Fallback to home
        if (hasHistory || document.referrer.includes(window.location.host)) {
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

            alert("Inquiry submitted successfully! You can now chat with the owner.");
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
                <main className="min-h-screen pt-20 pb-12">
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
                <main className="min-h-screen pt-20 pb-12">
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
            <main className="min-h-screen pt-0 md:pt-20 pb-12">
                <div className="max-w-[1400px] mx-auto px-0 md:px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* Main Content - Product Images with Thumbnails on Left */}
                        <div className="lg:col-span-8">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Mobile Image Carousel (Visible only on mobile) */}
                                <div className="md:hidden w-full relative">
                                    <div
                                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[4/5] w-full bg-gray-100 relative"
                                        onScroll={handleScroll}
                                    >
                                        {/* Overlay Buttons for Mobile */}
                                        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                                            {/* Back Button */}
                                            <button
                                                onClick={handleBack}
                                                className="w-10 h-10 flex items-center justify-center pointer-events-auto drop-shadow-sm"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M15 18l-6-6 6-6" />
                                                </svg>
                                            </button>

                                            {/* Right Action Buttons */}
                                            <div className="flex flex-col gap-4 pointer-events-auto items-center">
                                                {/* Wishlist Button */}
                                                <button
                                                    onClick={toggleWishlist}
                                                    disabled={wishlistLoading}
                                                    className="w-10 h-10 flex items-center justify-center drop-shadow-sm transition-transform active:scale-95"
                                                >
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill={isInWishlist ? "red" : "none"}
                                                        stroke={isInWishlist ? "red" : "black"}
                                                        strokeWidth="1"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                    </svg>
                                                </button>

                                                {/* Share Button */}
                                                <button
                                                    onClick={handleShare}
                                                    className="w-10 h-10 flex items-center justify-center drop-shadow-sm"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                                        <polyline points="16 6 12 2 8 6" />
                                                        <line x1="12" y1="2" x2="12" y2="15" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
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
                                    {/* Back Button */}
                                    <button
                                        onClick={handleBack}
                                        className="self-start flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-2"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 12H5" />
                                            <path d="M12 19l-7-7 7-7" />
                                        </svg>
                                        Back
                                    </button>

                                    <div className="flex gap-6 justify-center items-start">
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
                        <div className="lg:col-span-4 px-4 md:px-0">
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
                                            {product.original_price && (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm text-gray-500">Original Price</span>
                                                    <span className="text-xl text-gray-600">
                                                        ₹{typeof product.original_price === 'number' ? product.original_price.toLocaleString() : parseFloat(String(product.original_price)).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="space-y-4 border-t border-gray-200 pt-6">
                                            {product.ownerName && product.owner_user_id && (
                                                <Link
                                                    href={`/products?owner_id=${product.owner_user_id}`}
                                                    className="flex items-center gap-3 mb-4 group hover:opacity-80 transition-opacity w-fit"
                                                >
                                                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-base font-medium tracking-wide">
                                                        {getUserInitials(product.ownerName)}
                                                    </div>
                                                    <div className="text-lg font-medium text-gray-900 group-hover:underline decoration-black/50 underline-offset-4">
                                                        {formatUserDisplayName(product.ownerName)}
                                                    </div>
                                                </Link>
                                            )}
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Product Information</h3>
                                                <div className="space-y-3 text-sm text-gray-600">
                                                    {product.productId && (
                                                        <div>
                                                            <span className="font-medium text-gray-700">Product ID:</span>
                                                            <p className="mt-1">{product.productId}</p>
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
                                                    {product.occasions && product.occasions.length > 0 && (
                                                        <div>
                                                            <span className="font-medium text-gray-700">Occasion:</span>
                                                            <p className="mt-1">{product.occasions.join(", ")}</p>
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
                                                    {product.cities && product.cities.length > 0 && (
                                                        <div>
                                                            <span className="font-medium text-gray-700">Available City:</span>
                                                            <p className="mt-1">{product.cities.join(", ")}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Make Inquiry Button */}
                                            {/* Make Inquiry Button */}
                                            <div className="border-t border-gray-200 pt-4">
                                                {currentUser && product.owner_user_id && currentUser.id === product.owner_user_id ? (
                                                    <button
                                                        disabled
                                                        className="w-full bg-gray-200 text-gray-500 font-semibold py-4 px-6 cursor-not-allowed"
                                                    >
                                                        Your Product
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleMakeInquiry}
                                                        className="w-full bg-black text-white font-semibold py-4 px-6 hover:opacity-90 transition-opacity"
                                                    >
                                                        Make Inquiry
                                                    </button>
                                                )}
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
                        <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
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
                                        onChange={(e) => setInquiryForm({ ...inquiryForm, start_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={inquiryForm.end_date}
                                        onChange={(e) => setInquiryForm({ ...inquiryForm, end_date: e.target.value })}
                                        min={inquiryForm.start_date || new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitInquiry}
                                    disabled={submittingInquiry || !inquiryForm.start_date || !inquiryForm.end_date}
                                    className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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

