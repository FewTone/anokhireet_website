"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginPopup from "@/components/LoginPopup";
import { supabase } from "@/lib/supabase";

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
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params?.id as string;
    
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [productImages, setProductImages] = useState<string[]>([]);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        productInfo: false,
        shippingReturns: false,
    });
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const [inquiryForm, setInquiryForm] = useState({
        start_date: "",
        end_date: "",
    });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);

    useEffect(() => {
        if (productId) {
            loadProduct();
            checkLoginStatus();
        }
    }, [productId]);

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
                
                productData = {
                    id: typeof p.id === 'string' ? p.id : 0,
                    productId: p.product_id,
                    name: p.title || p.name,
                    price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                    image: productImages.length > 0 ? productImages[0] : p.image || "",
                    category: p.category || p.category_id,
                    original_price: p.original_price,
                    owner_user_id: p.owner_user_id,
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
                    
                    productData = {
                        id: typeof p.id === 'string' ? p.id : 0,
                        productId: p.product_id || p.id,
                        name: p.title || p.name,
                        price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                        image: productImages.length > 0 ? productImages[0] : p.image || "",
                        category: p.category || p.category_id,
                        original_price: p.original_price,
                        owner_user_id: p.owner_user_id,
                        db_id: p.id,
                    };
                }
            }

            if (productData) {
                setProduct(productData);
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

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleMakeInquiry = () => {
        if (!isLoggedIn) {
            setShowLoginPopup(true);
            return;
        }
        setShowInquiryModal(true);
    };

    const handleLoginSuccess = () => {
        checkLoginStatus();
        setShowLoginPopup(false);
        // Auto-open inquiry modal after login
        setTimeout(() => {
            setShowInquiryModal(true);
        }, 100);
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

            // Create chat for this inquiry
            const { data: chatData, error: chatError } = await supabase
                .from("chats")
                .insert([{
                    inquiry_id: inquiryData.id
                }])
                .select()
                .single();

            if (chatError) throw chatError;

            alert("Inquiry submitted successfully! You can now chat with the owner.");
            setShowInquiryModal(false);
            setInquiryForm({ start_date: "", end_date: "" });
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
            <Navbar />
            <main className="min-h-screen pt-20 pb-12">
                <div className="max-w-[1400px] mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* Left Sidebar - Product Information */}
                        <div className="lg:col-span-3">
                            <div className="sticky top-24">
                                <h1 className="text-2xl font-bold mb-6">{product.name} Information</h1>
                                
                                {/* Expandable Sections */}
                                <div className="space-y-0">
                                    {/* Product Information Section */}
                                    <div className="border-b border-gray-200">
                                        <button
                                            onClick={() => toggleSection("productInfo")}
                                            className="w-full flex justify-between items-center py-4 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-medium">Product Information</span>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`transition-transform ${
                                                    expandedSections.productInfo ? "rotate-45" : ""
                                                }`}
                                            >
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                        {expandedSections.productInfo && (
                                            <div className="pb-4 text-sm text-gray-600 px-0">
                                                <p>Product ID: {product.productId || product.id}</p>
                                                {product.category && <p>Category: {product.category}</p>}
                                                <p className="mt-2">
                                                    <span className="font-medium">Rental Price:</span> {product.price}
                                                </p>
                                                {product.original_price && (
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        <span className="font-medium">Original Price:</span> ₹{typeof product.original_price === 'number' ? product.original_price : product.original_price}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Shipping & Returns Section */}
                                    <div className="border-b border-gray-200">
                                        <button
                                            onClick={() => toggleSection("shippingReturns")}
                                            className="w-full flex justify-between items-center py-4 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-medium">Shipping & Returns</span>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`transition-transform ${
                                                    expandedSections.shippingReturns ? "rotate-45" : ""
                                                }`}
                                            >
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                        {expandedSections.shippingReturns && (
                                            <div className="pb-4 text-sm text-gray-600 px-0">
                                                <p>Free shipping on orders over ₹999</p>
                                                <p className="mt-2">Easy returns within 30 days</p>
                                                <p className="mt-2">Standard delivery: 3-5 business days</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content - Product Images with Thumbnails on Left */}
                        <div className="lg:col-span-6">
                            <div className="flex gap-4">
                                {/* Left Side - Small Thumbnail Images (Vertical Column) */}
                                <div className="hidden md:flex flex-col gap-3 w-20 flex-shrink-0">
                                    {displayImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(img)}
                                            className={`relative w-full aspect-[4/5] border-2 transition-all overflow-hidden bg-gray-50 ${
                                                selectedImage === img
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
                                <div className="flex-1 relative aspect-[4/5] bg-gray-100">
                                    {selectedImage ? (
                                        <Image
                                            src={selectedImage}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 50vw"
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
                            </div>
                        </div>

                        {/* Right Sidebar - Product Information */}
                        <div className="lg:col-span-3">
                            <div className="sticky top-24">
                                <div className="bg-white space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
                                        
                                        {/* Pricing Information */}
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-3 mb-2">
                                                <span className="text-3xl font-bold text-gray-900">{product.price}</span>
                                                {product.original_price && (
                                                    <span className="text-lg text-gray-500 line-through">
                                                        ₹{typeof product.original_price === 'number' ? product.original_price : product.original_price}
                                                    </span>
                                                )}
                                            </div>
                                            {product.original_price && (
                                                <p className="text-sm text-gray-600">
                                                    Original Price: ₹{typeof product.original_price === 'number' ? product.original_price : product.original_price}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-500 mt-1">Rental Price</p>
                                        </div>

                                        {/* Product Details */}
                                        <div className="space-y-4 border-t border-gray-200 pt-6">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Product Details</h3>
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    {product.productId && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">Product ID:</span>
                                                            <span>{product.productId}</span>
                                                        </div>
                                                    )}
                                                    {product.category && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">Category:</span>
                                                            <span>{product.category}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Images:</span>
                                                        <span>{displayImages.length} photo{displayImages.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shipping & Returns */}
                                            <div className="border-t border-gray-200 pt-4">
                                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Shipping & Returns</h3>
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <div className="flex items-start gap-2">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                                                            <path d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                        <span>Free shipping on orders over ₹999</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                                                            <path d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                        <span>Easy returns within 30 days</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                                                            <path d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                        <span>Standard delivery: 3-5 business days</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Make Inquiry Button */}
                                            <div className="border-t border-gray-200 pt-4">
                                                <button
                                                    onClick={handleMakeInquiry}
                                                    className="w-full bg-black text-white font-semibold py-4 px-6 hover:opacity-90 transition-opacity"
                                                >
                                                    Make Inquiry
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Login Popup */}
            <LoginPopup
                isOpen={showLoginPopup}
                onClose={() => setShowLoginPopup(false)}
                onLoginSuccess={handleLoginSuccess}
            />

            {/* Inquiry Modal */}
            {showInquiryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
            )}
        </>
    );
}

