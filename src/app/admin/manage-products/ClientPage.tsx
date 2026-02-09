"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import ProductTable from "@/components/admin/ProductTable";
import { supabase } from "@/lib/supabase";
import Popup from "@/components/Popup";

interface UserProduct {
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string;
    images?: string[];
    primary_image_index?: number;
    original_price?: number | string;
    product_id?: string;
    category?: string | string[];
    created_at: string;
    status?: string;
    listing_status?: string;
    is_active?: boolean;
}

interface User {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
}

export default function ManageProductsClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get("userId");

    const [user, setUser] = useState<User | null>(null);
    const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [popup, setPopup] = useState<{
        isOpen: boolean;
        message: string;
        type: "error" | "success" | "info" | "warning";
        title?: string;
    }>({
        isOpen: false,
        message: "",
        type: "info",
    });

    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        productId: string | null;
        productName: string;
    }>({
        isOpen: false,
        productId: null,
        productName: "",
    });


    useEffect(() => {
        if (userId) {
            loadUser();
            loadUserProducts();
            testSupabaseConnection();
        }
    }, [userId]);

    const testSupabaseConnection = async () => {
        try {
            console.log("🔍 Testing Supabase connection...");
            console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
            console.log("Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

            // Test basic connection
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log("Session test:", { session: !!session, sessionError });

            // Test products table access
            const { data: testData, error: testError, count } = await supabase
                .from("products")
                .select("*", { count: 'exact', head: true });

            console.log("Products table test:", {
                count,
                error: testError,
                canRead: !testError
            });

            if (testError) {
                console.error("❌ Cannot access products table:", testError);
            } else {
                console.log("✅ Supabase connection working");
            }
        } catch (error) {
            console.error("❌ Supabase connection test failed:", error);
        }
    };


    // Reload products when window regains focus (after returning from edit modal)
    useEffect(() => {
        const handleFocus = () => {
            if (userId) {
                loadUserProducts();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [userId]);

    const showPopup = (message: string, type: "error" | "success" | "info" | "warning" = "info", title?: string) => {
        setPopup({ isOpen: true, message, type, title });
    };

    const closePopup = () => {
        setPopup({ ...popup, isOpen: false });
    };

    const loadUser = async () => {
        try {
            console.log("Loading user for ID:", userId);
            const { data, error } = await supabase
                .from("users")
                .select("id, name, phone")
                .eq("id", userId)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setUser(data);
            } else {
                console.warn("User not found for ID:", userId);
                showPopup("User not found", "warning", "Warning");
            }
        } catch (error: any) {
            console.error("Error loading user:", error);
            showPopup(`Failed to load user: ${error.message || JSON.stringify(error)}`, "error", "Error");
        }
    };
    const handleUpdateListingStatus = async (productId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("products")
                .update({ listing_status: newStatus })
                .eq("id", productId);

            if (error) throw error;
            showPopup(`Listing status updated to ${newStatus}`, "success");
            loadUserProducts();
        } catch (error: any) {
            console.error("Error updating listing status:", error);
            showPopup(error.message || "Failed to update listing status", "error", "Error");
        }
    };


    const loadUserProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("owner_user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) {
                // Load all facet associations for these products
                const productIds = data.map(p => p.id);
                const [productTypesResult, occasionsResult, colorsResult, materialsResult, citiesResult] = await Promise.all([
                    supabase.from("product_product_types").select("product_id, type_id, product_types(name)").in("product_id", productIds),
                    supabase.from("product_occasions").select("product_id, occasion_id, occasions(name)").in("product_id", productIds),
                    supabase.from("product_colors").select("product_id, color_id, colors(name)").in("product_id", productIds),
                    supabase.from("product_materials").select("product_id, material_id, materials(name)").in("product_id", productIds),
                    supabase.from("product_cities").select("product_id, city_id, cities(name)").in("product_id", productIds)
                ]);

                // Create maps for each facet type
                const productTypesMap = new Map<string, string[]>();
                const occasionsMap = new Map<string, string[]>();
                const colorsMap = new Map<string, string[]>();
                const materialsMap = new Map<string, string[]>();
                const citiesMap = new Map<string, string[]>();

                productTypesResult.data?.forEach((assoc: any) => {
                    if (!productTypesMap.has(assoc.product_id)) productTypesMap.set(assoc.product_id, []);
                    if (assoc.product_types?.name) productTypesMap.get(assoc.product_id)?.push(assoc.product_types.name);
                });
                occasionsResult.data?.forEach((assoc: any) => {
                    if (!occasionsMap.has(assoc.product_id)) occasionsMap.set(assoc.product_id, []);
                    if (assoc.occasions?.name) occasionsMap.get(assoc.product_id)?.push(assoc.occasions.name);
                });
                colorsResult.data?.forEach((assoc: any) => {
                    if (!colorsMap.has(assoc.product_id)) colorsMap.set(assoc.product_id, []);
                    if (assoc.colors?.name) colorsMap.get(assoc.product_id)?.push(assoc.colors.name);
                });
                materialsResult.data?.forEach((assoc: any) => {
                    if (!materialsMap.has(assoc.product_id)) materialsMap.set(assoc.product_id, []);
                    if (assoc.materials?.name) materialsMap.get(assoc.product_id)?.push(assoc.materials.name);
                });
                citiesResult.data?.forEach((assoc: any) => {
                    if (!citiesMap.has(assoc.product_id)) citiesMap.set(assoc.product_id, []);
                    if (assoc.cities?.name) citiesMap.get(assoc.product_id)?.push(assoc.cities.name);
                });

                const mapped = data.map((p: any) => {
                    const facets = {
                        productTypes: productTypesMap.get(p.id) || [],
                        occasions: occasionsMap.get(p.id) || [],
                        colors: colorsMap.get(p.id) || [],
                        materials: materialsMap.get(p.id) || [],
                        cities: citiesMap.get(p.id) || []
                    };

                    return {
                        id: p.id,
                        user_id: p.owner_user_id,
                        name: p.title || p.name,
                        price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                        image: p.image || "",
                        images: p.images || undefined,
                        primary_image_index: p.primary_image_index ?? undefined,
                        original_price: p.original_price ?? undefined,
                        product_id: p.product_id ?? undefined,
                        category: facets, // Store facets instead of categories
                        created_at: p.created_at,
                        status: p.status, // Add status
                        listing_status: p.listing_status || 'Paid',
                        is_active: p.is_active // Add is_active
                    } as UserProduct & { category: typeof facets };
                });

                setUserProducts(mapped);
            }
        } catch (error) {
            console.error("Error loading user products:", error);
            showPopup("Failed to load products", "error", "Error");
        } finally {
            setLoading(false);
        }
    };

    // New function to handle status toggle
    const handleToggleProductStatus = async (productId: string, newStatus: string) => {
        try {
            const isActive = newStatus === 'approved';

            const { error } = await supabase
                .from("products")
                .update({
                    status: newStatus,
                    is_active: isActive
                })
                .eq("id", productId);

            if (error) throw error;

            showPopup(
                `Product ${isActive ? 'published' : 'moved to drafts'} successfully!`,
                "success"
            );
            loadUserProducts(); // Reload to reflect changes
        } catch (error: any) {
            console.error("Error updating product status:", error);
            showPopup("Failed to update status", "error", "Error");
        }
    };

    const handleDeleteProduct = (id: string, name: string) => {
        setDeleteConfirmation({
            isOpen: true,
            productId: id,
            productName: name,
        });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.productId) return;

        const id = deleteConfirmation.productId;
        setDeleteConfirmation({ isOpen: false, productId: null, productName: "" });

        try {
            // First cleanup reports and chats related to this product
            const { data: inquiries } = await supabase
                .from("inquiries")
                .select("id")
                .eq("product_id", id);

            if (inquiries && inquiries.length > 0) {
                const inquiryIds = inquiries.map(i => i.id);

                const { data: chats } = await supabase
                    .from("chats")
                    .select("id")
                    .in("inquiry_id", inquiryIds);

                if (chats && chats.length > 0) {
                    const chatIds = chats.map(c => c.id);
                    await supabase
                        .from("reports")
                        .delete()
                        .in("chat_id", chatIds);

                    await supabase
                        .from("chats")
                        .delete()
                        .in("inquiry_id", inquiryIds);
                }

                await supabase
                    .from("inquiries")
                    .delete()
                    .in("id", inquiryIds);
            }

            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;
            showPopup("Product deleted successfully!", "success");
            loadUserProducts();
        } catch (error: any) {
            showPopup(error.message || "Failed to delete product", "error", "Error");
            console.error("Error deleting product:", error);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, productId: null, productName: "" });
    };


    const handleOpenAddProduct = () => {
        router.push(`/admin/manage-products/add?userId=${userId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <button
                                    onClick={() => router.push("/admin?tab=users")}
                                    className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Users
                                </button>
                                <h1 className="text-3xl font-semibold text-gray-900">
                                    Products for {user?.name || "User"}
                                </h1>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-sm text-gray-600">
                                        {userProducts.length} product{userProducts.length !== 1 ? 's' : ''} total
                                    </p>
                                    {user && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <p className="text-sm text-gray-600">
                                                Phone: {user.phone}
                                            </p>
                                            {user.email && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <p className="text-sm text-gray-600">
                                                        Email: {user.email}
                                                    </p>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleOpenAddProduct}
                                className="px-6 py-3 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Product
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Statistics Cards */}
                    {userProducts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Products</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">{userProducts.length}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-none">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-600">
                                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Images</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {userProducts.reduce((sum, p) => {
                                                const images = p.images && Array.isArray(p.images) ? p.images.length : (p.image ? 1 : 0);
                                                return sum + images;
                                            }, 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-none">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-green-600">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Avg. Rent Price</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {(() => {
                                                const prices = userProducts
                                                    .map(p => parseFloat(p.price.replace(/[₹,]/g, '')) || 0)
                                                    .filter(p => p > 0);
                                                if (prices.length === 0) return '₹0';
                                                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                                                return `₹${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-none">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-purple-600">
                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Categories</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {(() => {
                                                const categories = new Set<string>();
                                                userProducts.forEach(p => {
                                                    if (p.category) {
                                                        if (Array.isArray(p.category)) {
                                                            p.category.forEach(c => categories.add(c));
                                                        } else {
                                                            categories.add(p.category);
                                                        }
                                                    }
                                                });
                                                return categories.size;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-none">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-orange-600">
                                            <path d="M20 7h-4M4 7h4m0 0a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2m0 0v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Paid</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {(() => {
                                                const totalLoaded = userProducts.reduce((sum, p) => {
                                                    let amount = 0;
                                                    const status = p.listing_status || '';
                                                    if (status.includes('₹')) {
                                                        const match = status.match(/₹(\d+)/);
                                                        if (match) amount = parseInt(match[1]);
                                                    } else if (status === 'Paid') {
                                                        // Legacy or just "Paid" implies 99 based on current rule
                                                        amount = 99;
                                                    }
                                                    return sum + amount;
                                                }, 0);
                                                return `₹${totalLoaded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-100 rounded-none">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Avg. Paid</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {(() => {
                                                const paidAmounts = userProducts.map(p => {
                                                    const status = p.listing_status || '';
                                                    if (status.includes('₹')) {
                                                        const match = status.match(/₹(\d+)/);
                                                        return match ? parseInt(match[1]) : 0;
                                                    } else if (status === 'Paid') {
                                                        return 99;
                                                    }
                                                    return 0;
                                                }).filter(amount => amount > 0);

                                                if (paidAmounts.length === 0) return '₹0';
                                                const avg = paidAmounts.reduce((a, b) => a + b, 0) / paidAmounts.length;
                                                return `₹${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-teal-100 rounded-none">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-teal-600">
                                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                                            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {userProducts.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-none shadow-sm border border-gray-200">
                            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                            <p className="text-sm text-gray-600 mb-6">This user doesn't have any products yet.</p>
                            <button
                                onClick={handleOpenAddProduct}
                                className="px-6 py-3 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-all duration-200 inline-flex items-center gap-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add First Product
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
                            <ProductTable
                                products={userProducts}
                                showOwner={false}
                                onUpdateListingStatus={handleUpdateListingStatus}
                                onEdit={(product) => router.push(`/admin/manage-products/add?userId=${userId}&edit=${product.id}`)}
                                onDelete={(product) => handleDeleteProduct(product.id, product.name)}
                                onToggleStatus={(product) => handleToggleProductStatus(product.id, product.status === 'approved' && product.is_active !== false ? 'draft' : 'approved')}
                            />
                        </div>
                    )}
                </div>
            </div>


            <Popup
                isOpen={popup.isOpen}
                onClose={closePopup}
                message={popup.message}
                type={popup.type}
                title={popup.title}
            />

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-none shadow-xl max-w-sm w-full p-6 animate-scaleIn">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-none flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product?</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirmation.productName}"</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-none hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

