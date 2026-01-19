"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
}

interface User {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
}

export default function ManageProductsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;

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
        router.push(`/admin/manage-products/${userId}/add`);
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                                        <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {(() => {
                                                const prices = userProducts
                                                    .map(p => parseFloat(p.price.replace(/[₹,]/g, '')) || 0)
                                                    .filter(p => p > 0);
                                                if (prices.length === 0) return '₹0';
                                                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                                                return `₹${Math.round(avg).toLocaleString()}`;
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Image
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Product Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Types
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Occasions
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Colors
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Materials
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Cities
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Pricing
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Images
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Uploaded
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {userProducts.map((product) => {
                                            const images = product.images && Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []);
                                            const facets = (product.category && typeof product.category === 'object' && !Array.isArray(product.category))
                                                ? product.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                                : { productTypes: [], occasions: [], colors: [], materials: [], cities: [] };
                                            const createdDate = product.created_at
                                                ? new Date(product.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })
                                                : 'N/A';
                                            const createdTime = product.created_at
                                                ? new Date(product.created_at).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })
                                                : 'N/A';

                                            return (
                                                <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="relative w-20 h-24 bg-gray-100 rounded-none overflow-hidden">
                                                            {product.image ? (
                                                                <Image
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover rounded-none"
                                                                    unoptimized
                                                                    onError={(e) => {
                                                                        console.error("Image load error:", product.image);
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                    No Image
                                                                </div>
                                                            )}
                                                            {images.length > 1 && (
                                                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-none">
                                                                    {images.length}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs">
                                                            <div className="text-sm font-semibold text-gray-900 mb-1">
                                                                {product.name}
                                                            </div>
                                                            {product.product_id && (
                                                                <div className="text-xs text-gray-500 font-mono">
                                                                    ID: {product.product_id}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Types Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.productTypes.length > 0 ? (
                                                                facets.productTypes.map((pt, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-purple-100 text-purple-800">
                                                                        {pt}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Occasions Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.occasions.length > 0 ? (
                                                                facets.occasions.map((oc, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-pink-100 text-pink-800">
                                                                        {oc}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Colors Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.colors.length > 0 ? (
                                                                facets.colors.map((c, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-red-100 text-red-800">
                                                                        {c}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Materials Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.materials.length > 0 ? (
                                                                facets.materials.map((m, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-green-100 text-green-800">
                                                                        {m}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Cities Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.cities.length > 0 ? (
                                                                facets.cities.map((city, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-blue-100 text-blue-800">
                                                                        {city}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {product.price}
                                                            </div>
                                                            {product.original_price && (
                                                                <div className="text-xs text-gray-500">
                                                                    ₹{typeof product.original_price === 'number'
                                                                        ? product.original_price.toLocaleString()
                                                                        : parseFloat(product.original_price).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Images Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-xs text-gray-700">
                                                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="font-semibold text-gray-900">{images.length} {images.length === 1 ? 'image' : 'images'}</span>
                                                        </div>
                                                    </td>

                                                    {/* Uploaded Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1.5 text-xs">
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="font-medium">{createdDate}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-6 text-gray-600">
                                                                <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span>{createdTime}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => router.push(`/admin/manage-products/${userId}/add?edit=${product.id}`)}
                                                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Edit product"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Delete product"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
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

