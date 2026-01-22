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
import LoginModal from "@/components/LoginModal";
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
    const [dbBookedDates, setDbBookedDates] = useState<any[]>([]);

    // Function to get booked dates for this product
    const getBookedDates = () => {
        const excludedDates: Date[] = [];

        dbBookedDates.forEach(dbBooking => {
            // Robust parsing of YYYY-MM-DD to avoid UTC shifts
            const startParts = dbBooking.start_date.split('-').map(Number);
            const endParts = dbBooking.end_date.split('-').map(Number);

            const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

            const current = new Date(start);
            const last = new Date(end);

            while (current <= last) {
                excludedDates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        });

        return excludedDates;
    };
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    // const endDateInputRef = useRef<HTMLInputElement>(null); // Removed native ref
    const [inquiryForm, setInquiryForm] = useState({
        start_date: "",
        end_date: "",
    });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const hasTrackedView = useRef<string | null>(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [isProcessingWishlist, setIsProcessingWishlist] = useState(false);
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
                .in("status", ["approved", "pending_deactivation"])
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
            hasTrackedView.current = null;
            loadProduct();
            checkLoginStatus();
        }
    }, [productId]);

    // Fetch booked dates from Supabase
    useEffect(() => {
        const fetchBookedDatesFromDB = async () => {
            if (!product?.db_id) return;

            try {
                const { data, error } = await supabase
                    .from('inquiries')
                    .select('start_date, end_date, status')
                    .eq('product_id', product.db_id)
                    .neq('status', 'rejected');

                if (error) {
                    console.error("Error fetching booked dates:", error);
                    return;
                }

                if (data) {
                    setDbBookedDates(data);
                }
            } catch (err) {
                console.error("Error fetching booked dates:", err);
            }
        };

        fetchBookedDatesFromDB();
    }, [product?.db_id]);

    // Check if user was redirected from login (inquiry parameter)
    useEffect(() => {
        // Strict consistency check: verify we have all data needed to make a decision
        if (!productId || !isLoggedIn || searchParams.get('inquiry') !== 'true') return;

        // Wait for product and user to be fully loaded
        if (!product || !currentUser) return;

        // Check if user is owner before opening modal
        if (product.owner_user_id === currentUser.id) {
            // Determine if this is the owner - if so, remove inquiry param
            const params = new URLSearchParams(searchParams.toString());
            params.delete('inquiry');
            router.replace(`/products/${productId}?${params.toString()}`);
            return;
        }

        // User just logged in and returned - open inquiry modal
        const timer = setTimeout(() => {
            setShowInquiryModal(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [productId, isLoggedIn, searchParams, currentUser, product]);

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
        if (isProcessingWishlist) return;

        // 1. Optimistic UI update - happens INSTANTLY
        const newStatus = !isInWishlist;
        setIsInWishlist(newStatus);
        setIsProcessingWishlist(true);

        try {
            // 2. Faster session check
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                // Rollback if not logged in
                setIsInWishlist(!newStatus);
                setIsProcessingWishlist(false);
                router.push(`/profile?returnUrl=${encodeURIComponent(window.location.pathname)}`);
                return;
            }

            if (!product?.db_id || !currentUser?.id) {
                setIsProcessingWishlist(false);
                return;
            }

            if (newStatus) {
                // Add to wishlist
                await supabase.from('wishlist').insert({
                    user_id: currentUser.id,
                    product_id: product.db_id
                });

                // Update localStorage
                const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                if (!wishlist.some((p: any) => p.id === product.db_id)) {
                    wishlist.push({
                        id: product.db_id,
                        productId: product.productId || product.db_id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        original_price: product.original_price,
                    });
                    localStorage.setItem("wishlist", JSON.stringify(wishlist));
                }
            } else {
                // Remove from wishlist
                await supabase.from('wishlist')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('product_id', product.db_id);

                // Update localStorage
                const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                const filtered = wishlist.filter((p: any) => p.id !== product.db_id);
                localStorage.setItem("wishlist", JSON.stringify(filtered));
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            // Revert on actual error
            setIsInWishlist(!newStatus);
        } finally {
            setIsProcessingWishlist(false);
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

    // Track product view with 15-minute throttling via database RPC
    const trackProductView = async (dbId: string) => {
        try {
            if (!dbId || hasTrackedView.current === dbId) return;
            hasTrackedView.current = dbId;

            // 1. Get identifiers for the viewer
            const authUserId = currentUser?.id;
            let anonId = typeof window !== 'undefined' ? localStorage.getItem('anokhi_viewer_id') : null;

            // Ensure we have a valid UUID for guest tracking
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!anonId || !uuidRegex.test(anonId)) {
                anonId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                if (typeof window !== 'undefined') localStorage.setItem('anokhi_viewer_id', anonId);
            }

            // 2. Call the database function to handle throttling atomically
            await supabase.rpc('track_product_view', {
                p_product_id: dbId,
                p_user_id: authUserId || null,
                p_anonymous_id: anonId
            });
        } catch (error) {
            console.error("Error tracking product view:", error);
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
                .in("status", ["approved", "pending_deactivation"])
                .eq("is_active", true)
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
                // Try custom_id match
                let { data: productsByCustomId, error: productsByCustomIdError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("custom_id", productId)
                    .in("status", ["approved", "pending_deactivation"])
                    .eq("is_active", true)
                    .limit(1);

                if (!productsByCustomIdError && productsByCustomId && productsByCustomId.length > 0) {
                    const p = productsByCustomId[0];
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
                        productId: p.custom_id || p.product_id, // prioritize custom_id
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
                        .in("status", ["approved", "pending_deactivation"])
                        .eq("is_active", true)
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


                // Track view after product is loaded using database UUID
                if (productData.db_id) {
                    trackProductView(String(productData.db_id));
                }
            } else {
                // If product not found, we can't track by UUID
                // So we do nothing (or we could try to resolve slug to ID, but loadProduct already failed that)
            }
        } catch (error) {
            console.error("Error loading product:", error);
        } finally {
            setLoading(false);
        }
    };

    // Removed toggleSection - no longer needed



    const handleMakeInquiry = () => {
        if (currentUser && product && product.owner_user_id === currentUser.id) {
            alert("You cannot inquire about your own product.");
            return;
        }

        if (!isLoggedIn) {
            setShowLoginPopup(true);
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

        // Limit of maximum 6 days removed

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
            <div className="hidden md:block sticky top-0 z-[1000]">
                <Navbar />
            </div>
            <main className="min-h-screen pt-0 pb-24 md:pb-12">
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
                        <style>
                            {`
                                .react-datepicker {
                                    border: 1px solid #e5e7eb;
                                    font-family: inherit;
                                    border-radius: 0 !important;
                                    margin: 0 auto !important;

                                }
                                .react-datepicker__header {
                                    background-color: white;
                                    border-bottom: 1px solid #e5e7eb;
                                }
                                .react-datepicker__month-container {
                                    width: 100% !important;
                                }
                                .react-datepicker__day-name, .react-datepicker__day {
                                    width: 2rem !important;
                                    line-height: 2rem !important;
                                    margin: 0.05rem !important;
                                    font-size: 0.875rem !important;
                                }
                                .react-datepicker__day--selected, 
                                .react-datepicker__day--in-selecting-range,
                                .react-datepicker__day--in-range,
                                .react-datepicker__month-text--selected,
                                .react-datepicker__month-text--in-selecting-range,
                                .react-datepicker__month-text--in-range {
                                    background-color: #e5e7eb !important;
                                    color: #1f2937 !important;
                                    border-radius: 0.375rem !important;
                                    border: none !important;
                                }
                                .react-datepicker__day--range-start {
                                    background-color: #e5e7eb !important;
                                    color: #1f2937 !important;
                                    border-radius: 0.375rem !important;
                                    border: none !important;
                                }
                                .react-datepicker__day--range-end {
                                    background-color: #e5e7eb !important;
                                    color: #1f2937 !important;
                                    border-radius: 0.375rem !important;
                                    border: 1px solid #9ca3af !important;
                                }
                                .react-datepicker__day--in-selecting-range {
                                    background-color: #d1d5db !important;
                                    color: #374151 !important;
                                    border: 1px solid #9ca3af !important;
                                }
                                .react-datepicker__day--in-range:not(.react-datepicker__day--selected) {
                                    background-color: #e5e7eb !important;
                                    color: #1f2937 !important;
                                    border: none !important;
                                }
                                .react-datepicker__day:hover {
                                    background-color: #f3f4f6 !important;
                                    border-radius: 0.375rem !important;
                                }
                            `}
                        </style>
                        <div className="bg-white rounded-none max-w-xl w-full p-8 relative">
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

                            <h2 className="text-lg font-semibold uppercase tracking-wide mb-6 text-center">Select Rental Period</h2>

                            <div className="space-y-4">
                                <div className="relative group custom-datepicker-wrapper flex justify-center">
                                    <DatePicker
                                        selected={inquiryForm.start_date ? (() => {
                                            const [y, m, d] = inquiryForm.start_date.split('-').map(Number);
                                            return new Date(y, m - 1, d);
                                        })() : null}
                                        onChange={(update: [Date | null, Date | null]) => {
                                            const [start, end] = update;
                                            setInquiryForm({
                                                start_date: start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` : "",
                                                end_date: end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}` : ""
                                            });
                                        }}
                                        startDate={inquiryForm.start_date ? (() => {
                                            const [y, m, d] = inquiryForm.start_date.split('-').map(Number);
                                            return new Date(y, m - 1, d);
                                        })() : null}
                                        endDate={inquiryForm.end_date ? (() => {
                                            const [y, m, d] = inquiryForm.end_date.split('-').map(Number);
                                            return new Date(y, m - 1, d);
                                        })() : null}
                                        selectsRange
                                        inline
                                        minDate={new Date()}
                                        excludeDates={getBookedDates()}
                                        monthsShown={1}
                                        dateFormat="dd/MM/yyyy"
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="border border-black bg-white p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Start Date</p>
                                        <p className="text-sm font-medium">{inquiryForm.start_date ? (() => {
                                            const [y, m, d] = inquiryForm.start_date.split('-').map(Number);
                                            return new Date(y, m - 1, d).toLocaleDateString('en-GB');
                                        })() : "Select date"}</p>
                                    </div>
                                    <div className="border border-black bg-white p-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">End Date</p>
                                        <p className="text-sm font-medium">{inquiryForm.end_date ? (() => {
                                            const [y, m, d] = inquiryForm.end_date.split('-').map(Number);
                                            return new Date(y, m - 1, d).toLocaleDateString('en-GB');
                                        })() : "Select date"}</p>
                                    </div>
                                </div>


                                <button
                                    onClick={handleSubmitInquiry}
                                    disabled={submittingInquiry || !inquiryForm.start_date || !inquiryForm.end_date}
                                    className="w-full bg-black text-white font-semibold py-3 px-4 rounded-none hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {submittingInquiry ? "Submitting..." : "Confirm Selection"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Login Popup */}
            {/* Login Popup */}
            <LoginModal
                isOpen={showLoginPopup}
                onClose={() => setShowLoginPopup(false)}
                onLoginSuccess={async () => {
                    await checkLoginStatus();
                    setShowLoginPopup(false);
                    setShowInquiryModal(true);
                }}
            />
        </>
    );
}

