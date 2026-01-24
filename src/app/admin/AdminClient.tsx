"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { capitalizeFirstLetter, INDIAN_STATES } from "@/lib/utils";
import { useRouter, useSearchParams, ReadonlyURLSearchParams } from "next/navigation";
import Popup from "@/components/Popup";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Product {
    id: number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
    created_at?: string;
}

interface User {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    created_at: string;
    auth_user_id: string | null;
}


interface UserProduct {
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string; // Keep for backward compatibility
    images?: string[]; // Array of image URLs
    primary_image_index?: number; // Index of primary image (for home page)
    original_price?: number | string; // Original price (optional)
    product_id?: string;
    category?: string;
    created_at: string;
    status?: string;
    is_active?: boolean;
    admin_note?: string;
}

// Facet Management Section Component
interface FacetManagementSectionProps {
    title: string;
    description: string;
    items: any[];
    onAdd: () => void;
    onEdit: (item: any) => void;
    onDelete: (id: string, name: string) => void;
    showHex?: boolean;
    showLocation?: boolean;
}

const FacetManagementSection: React.FC<FacetManagementSectionProps> = ({
    title,
    description,
    items,
    onAdd,
    onEdit,
    onDelete,
    showHex = false,
    showLocation = false
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold uppercase tracking-wide text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
                <button
                    onClick={onAdd}
                    className="px-4 py-2 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add {title.slice(0, -1)}
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-none border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</p>
                    <p className="text-sm text-gray-600">Add your first {title.slice(0, -1).toLowerCase()} to get started</p>
                </div>
            ) : (
                <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                {showHex && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>}
                                {showLocation && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    </td>
                                    {showHex && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {item.hex && (
                                                    <div
                                                        className="w-6 h-6 rounded-none border border-gray-300"
                                                        style={{ backgroundColor: item.hex }}
                                                    />
                                                )}
                                                <span className="text-sm text-gray-600">{item.hex || "—"}</span>
                                            </div>
                                        </td>
                                    )}
                                    {showLocation && (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{item.state || "—"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{item.country || "—"}</div>
                                            </td>
                                        </>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded-none hover:bg-blue-50 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDelete(item.id, item.name)}
                                                className="text-red-600 hover:text-red-900 px-3 py-1 rounded-none hover:bg-red-50 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

function AdminContent({ searchParams }: { searchParams: ReadonlyURLSearchParams }) {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
    const [totalViews, setTotalViews] = useState<number>(0);
    const [categories, setCategories] = useState<Array<{ id: string; name: string; image_url: string; link_url: string; display_order: number; is_featured: boolean }>>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; image_url: string; link_url: string; display_order: number; is_featured: boolean } | null>(null);
    const [categoryFormData, setCategoryFormData] = useState({ name: "", image_url: "" });
    const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
    const [categoryImagePreview, setCategoryImagePreview] = useState<string>("");
    const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);
    const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
    const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
    // Featured items drag state (tracking both type and id: "product_type:123" or "occasion:456")
    const [draggedFeaturedItem, setDraggedFeaturedItem] = useState<string | null>(null);
    const [dragOverFeaturedItem, setDragOverFeaturedItem] = useState<string | null>(null);
    const [websiteEnabled, setWebsiteEnabled] = useState(false);
    const [isTogglingWebsite, setIsTogglingWebsite] = useState(false);

    // Facet management states
    const [activeFacetTab, setActiveFacetTab] = useState<"product_types" | "occasions" | "colors" | "materials" | "cities">("product_types");
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [stateSearchQuery, setStateSearchQuery] = useState("");
    const stateDropdownRef = useRef<HTMLDivElement>(null);
    const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string; image_url: string | null; display_order: number; is_featured: boolean }>>([]);
    const [occasions, setOccasions] = useState<Array<{ id: string; name: string; image_url: string | null; display_order: number; is_featured: boolean }>>([]);
    const [colors, setColors] = useState<Array<{ id: string; name: string; hex: string | null; display_order: number }>>([]);
    const [materials, setMaterials] = useState<Array<{ id: string; name: string; display_order: number }>>([]);
    const [cities, setCities] = useState<Array<{ id: string; name: string; state: string | null; country: string | null; display_order: number }>>([]);
    // Product counts for facets (key: "facetType_id", value: count)
    const [facetProductCounts, setFacetProductCounts] = useState<Map<string, number>>(new Map());

    // Hero slides management states
    const [heroSlides, setHeroSlides] = useState<Array<{ id: string; image_url: string; title: string; subtitle: string | null; display_order: number; is_active: boolean }>>([]);
    const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
    const [editingHeroSlide, setEditingHeroSlide] = useState<{ id: string; image_url: string; title: string; subtitle: string | null; display_order: number; is_active: boolean } | null>(null);
    const [heroFormData, setHeroFormData] = useState({ title: "", subtitle: "", image_url: "" });
    const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
    const [heroImagePreview, setHeroImagePreview] = useState<string>("");
    const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
    const [draggedHeroId, setDraggedHeroId] = useState<string | null>(null);
    const [dragOverHeroId, setDragOverHeroId] = useState<string | null>(null);

    // Contact Requests state
    const [contactRequests, setContactRequests] = useState<any[]>([]);

    // Facet modal states
    const [isFacetModalOpen, setIsFacetModalOpen] = useState(false);
    const [editingFacet, setEditingFacet] = useState<any>(null);
    const [facetFormData, setFacetFormData] = useState({ name: "", hex: "", state: "", country: "", image_url: "" });
    const [facetImageFile, setFacetImageFile] = useState<File | null>(null);
    const [facetImagePreview, setFacetImagePreview] = useState<string>("");
    const [isUploadingFacetImage, setIsUploadingFacetImage] = useState(false);
    // Filter states
    const [filterType, setFilterType] = useState<"all" | "user">("all");
    const [filterUserId, setFilterUserId] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterProductType, setFilterProductType] = useState<string | null>(null);
    const [filterOccasion, setFilterOccasion] = useState<string | null>(null);
    const [filterColor, setFilterColor] = useState<string | null>(null);
    const [filterMaterial, setFilterMaterial] = useState<string | null>(null);
    const [filterCity, setFilterCity] = useState<string | null>(null);
    // Column sorting and filtering (Finder-style)
    const [sortColumn, setSortColumn] = useState<string>("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [columnFilters, setColumnFilters] = useState<{
        name?: string;
        type?: string;
        user?: string;
        category?: string;
        price?: string;
        productId?: string;
        images?: string;
        created?: string;
    }>({});
    const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "users" | "hero" | "featured" | "contact" | "reports" | "requests">("dashboard");
    const [reports, setReports] = useState<any[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    // Mobile action menu state
    const [activeActionId, setActiveActionId] = useState<string | null>(null);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isUserProductModalOpen, setIsUserProductModalOpen] = useState(false);
    const [isManageProductsModalOpen, setIsManageProductsModalOpen] = useState(false);
    const [editingUserProduct, setEditingUserProduct] = useState<UserProduct | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userFirstName, setUserFirstName] = useState("");
    const [userLastName, setUserLastName] = useState("");
    const [userFormData, setUserFormData] = useState({
        name: "", // Will be constructed from firstName + lastName
        phone: "+91",
        email: "",
        cities: [] as string[], // Array of city IDs
    });
    const [showAddCity, setShowAddCity] = useState(false);
    const [newCityName, setNewCityName] = useState("");
    const [newCityState, setNewCityState] = useState("");

    const [userProductFormData, setUserProductFormData] = useState({
        name: "",
        price: "",
        image: "",
        originalPrice: "",
        category: "",
    });
    const [userProductImages, setUserProductImages] = useState<string[]>([]); // Array of image URLs
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0); // Index of primary image
    const [userProductImageFiles, setUserProductImageFiles] = useState<File[]>([]); // Multiple files to upload
    const [userProductImagePreviews, setUserProductImagePreviews] = useState<string[]>([]); // Preview URLs
    const [imageSizeInfo, setImageSizeInfo] = useState<Array<{ original: number; converted: number; name: string }>>([]); // Track original and converted sizes
    const [userProductImageFile, setUserProductImageFile] = useState<File | null>(null); // Keep for single image (backward compat)
    const [userProductImagePreview, setUserProductImagePreview] = useState<string>(""); // Keep for single image (backward compat)
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [originalFileSize, setOriginalFileSize] = useState<number>(0);
    const [convertedWebPSize, setConvertedWebPSize] = useState<number>(0);
    const [convertedWebPBlob, setConvertedWebPBlob] = useState<Blob | null>(null);
    const [isConvertingImage, setIsConvertingImage] = useState(false);


    // Generic Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'city' | 'product_type' | 'occasion' | 'color' | 'material' } | null>(null);

    const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ id: string; name: string } | null>(null);
    const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<{ id: string; name: string } | null>(null);
    const [approveConfirmProduct, setApproveConfirmProduct] = useState<{ id: string; name: string; status?: string } | null>(null);
    const [rejectConfirmProduct, setRejectConfirmProduct] = useState<UserProduct | null>(null);
    const [rejectReason, setRejectReason] = useState("");
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

    const showPopup = (message: string, type: "error" | "success" | "info" | "warning" = "info", title?: string) => {
        setPopup({ isOpen: true, message, type, title });
    };

    const closePopup = () => {
        setPopup({ ...popup, isOpen: false });
    };

    useEffect(() => {
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (isCheckingAuth) {
                console.warn("Auth check timeout - setting isCheckingAuth to false");
                setIsCheckingAuth(false);
            }
        }, 10000); // 10 second timeout

        // Only check auth on initial mount
        checkAdminAuth().catch((error) => {
            console.error("Error in checkAdminAuth:", error);
            setIsCheckingAuth(false);
        });

        // Listen for auth state changes from Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
                localStorage.removeItem("adminEmail");
            } else if (event === 'SIGNED_IN' && session) {
                // Re-check auth when signed in
                checkAdminAuth().catch((error) => {
                    console.error("Error in checkAdminAuth (auth change):", error);
                    setIsCheckingAuth(false);
                });
            }
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    // Load all data when authenticated
    useEffect(() => {
        if (isAuthenticated && !isCheckingAuth) {
            console.log("Admin authenticated, loading all data...");
            // Load all data in parallel
            Promise.all([
                loadUsers(),
                loadUserProducts(),
                loadCategories(),
                loadTotalViews(),
                loadWebsiteSetting(),
                loadAllFacets(),
                loadHeroSlides(),
                loadContactRequests(),
                loadReports()
            ]).catch((error) => {
                console.error("Error loading admin data:", error);
            });
        }
    }, [isAuthenticated, isCheckingAuth]);

    // Load active tab from localStorage on mount
    useEffect(() => {
        if (isAuthenticated) {
            const savedTab = localStorage.getItem("adminActiveTab");
            if (savedTab && (savedTab === "dashboard" || savedTab === "products" || savedTab === "users" || savedTab === "facets" || savedTab === "hero")) {
                setActiveTab(savedTab as "dashboard" | "products" | "users" | "hero");
                router.replace(`/admin?tab=${savedTab}`);
            }
        }
    }, [isAuthenticated, router]);

    // Handle URL parameters for tab navigation and category filter
    useEffect(() => {
        if (!isAuthenticated) return;

        // Check for category filter in URL
        const categoryParam = searchParams.get("category");
        if (categoryParam) {
            setFilterCategory(categoryParam);
        }

        // Read facet filters from URL and set filterCategory
        const productTypeParam = searchParams.get("product_type");
        const occasionParam = searchParams.get("occasion");
        const colorParam = searchParams.get("colors");
        const materialParam = searchParams.get("materials");
        const cityParam = searchParams.get("cities");

        // Set filterCategory based on URL parameters (priority: product_type > occasion > colors > materials > cities)
        if (productTypeParam) {
            setFilterCategory(productTypeParam);
            setFilterProductType(null);
            setFilterOccasion(null);
            setFilterColor(null);
            setFilterMaterial(null);
            setFilterCity(null);
        } else if (occasionParam) {
            setFilterCategory(occasionParam);
            setFilterProductType(null);
            setFilterOccasion(null);
            setFilterColor(null);
            setFilterMaterial(null);
            setFilterCity(null);
        } else if (colorParam) {
            setFilterCategory(colorParam);
            setFilterProductType(null);
            setFilterOccasion(null);
            setFilterColor(null);
            setFilterMaterial(null);
            setFilterCity(null);
        } else if (materialParam) {
            setFilterCategory(materialParam);
            setFilterProductType(null);
            setFilterOccasion(null);
            setFilterColor(null);
            setFilterMaterial(null);
            setFilterCity(null);
        } else if (cityParam) {
            setFilterCategory(cityParam);
            setFilterProductType(null);
            setFilterOccasion(null);
            setFilterColor(null);
            setFilterMaterial(null);
            setFilterCity(null);
        } else {
            // Clear all filters if no URL params
            setFilterProductType(null);
            setFilterOccasion(null);
            setFilterColor(null);
            setFilterMaterial(null);
            setFilterCity(null);
            // Don't clear filterCategory here - let it persist if user set it manually
        }

        const tabParam = searchParams.get("tab");
        if (tabParam === "users" || tabParam === "products" || tabParam === "dashboard" || tabParam === "facets" || tabParam === "hero" || tabParam === "featured") {
            setActiveTab(tabParam as "dashboard" | "products" | "users" | "hero");
            localStorage.setItem("adminActiveTab", tabParam);
        }
    }, [searchParams, isAuthenticated]);

    // Handle URL parameters for editing/adding products
    useEffect(() => {
        if (!isAuthenticated || userProducts.length === 0) return;

        const editProductId = searchParams.get("editProductId");
        const userIdParam = searchParams.get("userId");

        if (editProductId && userIdParam) {
            const productToEdit = userProducts.find(p => p.id === editProductId);
            if (productToEdit) {
                setSelectedUserId(userIdParam);
                // Load images array or fallback to single image
                const images = productToEdit.images && Array.isArray(productToEdit.images) && productToEdit.images.length > 0
                    ? productToEdit.images
                    : (productToEdit.image ? [productToEdit.image] : []);

                setEditingUserProduct(productToEdit);
                setUserProductFormData({
                    name: productToEdit.name,
                    price: productToEdit.price,
                    image: productToEdit.image || (images.length > 0 ? images[0] : ""),
                    originalPrice: productToEdit.original_price ? String(productToEdit.original_price) : "",
                    category: productToEdit.category || "",
                });

                setUserProductImages(images);
                const validPrimaryIndex = images.length > 0
                    ? (productToEdit.primary_image_index !== undefined && productToEdit.primary_image_index >= 0 && productToEdit.primary_image_index < images.length
                        ? productToEdit.primary_image_index
                        : 0)
                    : 0;
                setPrimaryImageIndex(validPrimaryIndex);
                setUserProductImageFiles([]);
                setUserProductImagePreviews([]);
                setUserProductImageFile(null);
                setUserProductImagePreview(images.length > 0 ? images[0] : "");
                setOriginalFileSize(0);
                setConvertedWebPSize(0);
                setConvertedWebPBlob(null);
                setIsConvertingImage(false);
                router.push(`/admin/manage-products/add?userId=${userIdParam}`);
                // Switch to users tab and keep userId for redirect back
                setActiveTab("users");
                localStorage.setItem("adminActiveTab", "users");
                router.replace(`/admin?tab=users&userId=${userIdParam}`);
            }
        }

        const addProduct = searchParams.get("addProduct");
        if (addProduct && userIdParam) {
            // Navigate to add product page instead of opening modal
            router.push(`/admin/manage-products/add?userId=${userIdParam}`);
        }
    }, [searchParams, userProducts, isAuthenticated, router]);

    const checkAdminAuth = async () => {
        // Don't check auth if already authenticated and checking
        if (isAuthenticated && !isCheckingAuth) {
            return;
        }

        setIsCheckingAuth(true);

        try {
            // Check Supabase Auth session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                // Only sign out if we were previously authenticated (to clear stale state)
                if (isAuthenticated) {
                    await supabase.auth.signOut();
                    localStorage.removeItem("adminEmail");
                }
                setIsAuthenticated(false);
                setIsCheckingAuth(false);
                return;
            }

            // Verify user is admin in Supabase (check admins table)
            console.log("🔍 Checking admin auth for user:", session.user.id);

            const { data, error } = await supabase
                .from("admins")
                .select("id, email, auth_user_id")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();

            // Check if there's a meaningful error (ignore empty objects {})
            // Supabase may return an empty object {} for some cases, which we should ignore
            let isEmptyError = false;
            let hasRealError = false;

            try {
                if (error) {
                    if (typeof error === 'object') {
                        const errorKeys = Object.keys(error);
                        isEmptyError = errorKeys.length === 0;
                        hasRealError = !isEmptyError && !!(error.message || error.code);
                    } else if (typeof error === 'string') {
                        const errorStr: string = error;
                        hasRealError = errorStr.length > 0;
                    } else {
                        hasRealError = !!error;
                    }
                }
            } catch (checkError) {
                // If we can't check the error, assume it's not a real error
                console.warn("⚠️ Could not check error object:", checkError);
                hasRealError = false;
            }

            // Ignore empty error objects completely
            if (isEmptyError) {
                console.log("ℹ️ Empty error object returned (ignoring)");
            }

            if (hasRealError) {
                // Database error - log details and handle appropriately
                const errorMessage = (error && typeof error === 'object' && error.message) || 'Unknown error';
                const errorCode = (error && typeof error === 'object' && error.code) || 'Unknown code';

                console.error("Database error checking admin:", {
                    message: errorMessage,
                    code: errorCode,
                    details: (error && typeof error === 'object' && error.details) || null,
                    hint: (error && typeof error === 'object' && error.hint) || null,
                });

                // Only sign out if it's a real database error (not just "not found")
                // PGRST116 means "no rows returned" which is expected for non-admin users
                if (errorCode !== 'PGRST116' && !errorMessage?.includes('No rows') && !errorMessage?.includes('not found')) {
                    // Real database error - sign out for safety
                    console.warn("⚠️ Real database error detected, signing out admin");
                    try {
                        await supabase.auth.signOut();
                    } catch (signOutError) {
                        console.warn("Error signing out:", signOutError);
                    }
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem("adminEmail");
                    }
                } else {
                    // User not found or not admin - this is expected, just log
                    console.log("ℹ️ User not found or not admin (expected for non-admin users)");
                }
                setIsAuthenticated(false);
                setIsCheckingAuth(false);
                return;
            }

            // Log successful check (no error or empty error object)
            if (error && JSON.stringify(error) === '{}') {
                console.log("ℹ️ Empty error object returned (ignoring)");
            }

            if (!data) {
                // User not found in admins table - sign out
                await supabase.auth.signOut();
                if (typeof window !== 'undefined') {
                    localStorage.removeItem("adminEmail");
                }
                setIsAuthenticated(false);
                setIsCheckingAuth(false);
                return;
            }

            // User is admin (found in admins table)
            if (data) {
                localStorage.setItem("adminEmail", data.email || session.user.email || "");
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Error checking admin auth:", error);
            setIsAuthenticated(false);
        } finally {
            setIsCheckingAuth(false);
        }
        // Data loading is handled by useEffect when isAuthenticated changes
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder') || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon')) {
            const errorMsg = `Supabase is not configured!

Please create a .env.local file in your project root with:

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

To get these values:
1. Go to https://app.supabase.com
2. Select your project (or create new one)
3. Go to Settings → API
4. Copy "Project URL" for NEXT_PUBLIC_SUPABASE_URL
5. Copy "anon public" key for NEXT_PUBLIC_SUPABASE_ANON_KEY
6. Save .env.local file
7. Restart your dev server (npm run dev)`;

            showPopup(errorMsg, "error", "Configuration Error");
            return;
        }

        try {
            console.log("Attempting login with email:", adminEmail.trim());

            // Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: adminEmail.trim(),
                password: adminPassword,
            });

            if (authError || !authData.user) {
                let errorMessage = "Login failed. Please check your credentials.";

                if (authError?.message?.includes("Invalid login credentials")) {
                    errorMessage = "Invalid email or password. Please try again.";
                } else if (authError?.message) {
                    errorMessage = authError.message;
                }

                showPopup(errorMessage, "error", "Login Error");
                return;
            }

            // Verify user is admin in Supabase (check admins table)
            const { data: adminData, error: adminError } = await supabase
                .from("admins")
                .select("id, email, auth_user_id")
                .eq("auth_user_id", authData.user.id)
                .maybeSingle();

            if (adminError || !adminData) {
                // User not in admins table
                await supabase.auth.signOut();
                showPopup("Access denied. This account is not an admin.", "error", "Access Denied");
                return;
            }

            // Login successful
            localStorage.setItem("adminEmail", adminData.email || adminEmail.trim());
            setIsAuthenticated(true);
            closePopup();

            // Load all data after authentication
            await Promise.all([
                loadUsers(),
                loadUserProducts(),
                loadCategories(),
                loadTotalViews(),
                loadWebsiteSetting()
            ]);

            showPopup("Login successful! Welcome to Admin Dashboard.", "success", "Login Success");
        } catch (error: any) {
            console.error("Login error:", error);

            let errorMessage = "An unexpected error occurred. Please try again.";

            if (error.message) {
                errorMessage = error.message;
            }

            showPopup(errorMessage, "error", "Login Error");
        }
    };


    const loadUsers = async () => {
        try {
            console.log("Loading users...");
            // Load all users first, then filter non-admin users
            // Load all users (admins are in separate admins table)
            // Removed 'email' from selection as it doesn't exist in the public.users table
            const { data, error } = await supabase
                .from("users")
                .select("id, name, phone, created_at, auth_user_id")
                .order("created_at", { ascending: false });

            if (error) {
                // Check if it's a real error (not empty {})
                const errorStr = JSON.stringify(error);
                if (errorStr !== '{}') {
                    console.error("Error loading users:", {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint
                    });
                    showPopup(`Error loading users: ${error.message || 'Unknown error'}`, "error", "Error");
                } else {
                    console.log("ℹ️ Supabase returned an empty error object for loadUsers (ignoring)");
                }
                setUsers([]);
                return;
            }

            if (data) {
                // All users in users table are non-admin (admins are in separate admins table)
                console.log("Total users in database:", data.length);
                setUsers(data);
            } else {
                console.log("No users data returned");
                setUsers([]);
            }
        } catch (error: any) {
            console.error("Unexpected error loading users:", error);
            setUsers([]);
        }
    };


    const loadUserProducts = async () => {
        try {
            console.log("Loading products...");
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("updated_at", { ascending: false });

            if (error) {
                const errorStr = JSON.stringify(error);
                if (errorStr !== '{}') {
                    console.error("Error loading products:", {
                        message: error.message,
                        code: error.code,
                        details: error.details
                    });
                    showPopup(`Error loading products: ${error.message || 'Unknown error'}`, "error", "Error");
                } else {
                    console.log("ℹ️ Supabase returned an empty error object for loadUserProducts (ignoring)");
                }
                setUserProducts([]);
                return;
            }

            if (data) {
                console.log("Loaded products:", data.length);

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

                // Map products to match UserProduct interface
                const mappedProducts = data.map((p: any) => {
                    const facets = {
                        productTypes: productTypesMap.get(p.id) || [],
                        occasions: occasionsMap.get(p.id) || [],
                        colors: colorsMap.get(p.id) || [],
                        materials: materialsMap.get(p.id) || [],
                        cities: citiesMap.get(p.id) || []
                    };

                    // Create a display string for facets
                    const facetParts: string[] = [];
                    if (facets.productTypes.length > 0) facetParts.push(`Types: ${facets.productTypes.join(", ")}`);
                    if (facets.occasions.length > 0) facetParts.push(`Occasions: ${facets.occasions.join(", ")}`);
                    if (facets.colors.length > 0) facetParts.push(`Colors: ${facets.colors.join(", ")}`);
                    if (facets.materials.length > 0) facetParts.push(`Materials: ${facets.materials.join(", ")}`);
                    if (facets.cities.length > 0) facetParts.push(`Cities: ${facets.cities.join(", ")}`);

                    const facetsDisplay = facetParts.length > 0 ? facetParts.join(" | ") : "No facets";

                    return {
                        id: p.id,
                        user_id: p.owner_user_id,
                        name: p.title || p.name,
                        price: p.price || p.price_per_day?.toString() || "",
                        image: p.image || "",
                        images: p.images || undefined,
                        primary_image_index: p.primary_image_index ?? undefined,
                        original_price: p.original_price ?? undefined,
                        product_id: p.product_id,
                        category: facets, // Store facets object instead of category string
                        created_at: p.created_at,
                        status: p.status,
                        is_active: p.is_active,
                    } as UserProduct & { category: typeof facets };
                });
                setUserProducts(mappedProducts);
            } else {
                console.log("No products data returned");
                setUserProducts([]);
            }
        } catch (error) {
            console.error("Error loading products:", error);
            setUserProducts([]);
        }
    };

    const loadCategories = async () => {
        try {
            console.log("Loading categories...");
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) {
                const errorStr = JSON.stringify(error);
                if (errorStr !== '{}') {
                    console.error("Error loading categories:", error);
                    showPopup(`Error loading categories: ${error.message || 'Unknown error'}`, "error", "Error");
                } else {
                    console.log("ℹ️ Supabase returned an empty error object for loadCategories (ignoring)");
                }
                setCategories([]);
                return;
            }

            if (data) {
                console.log("Loaded categories:", data.length);
                setCategories(data);
            } else {
                console.log("No categories data returned");
                setCategories([]);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([]);
        }
    };

    const loadHeroSlides = async () => {
        try {
            const { data, error } = await supabase
                .from("hero_slides")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setHeroSlides(data || []);
        } catch (error: any) {
            console.error("Error loading hero slides:", error);
            setHeroSlides([]);
        }
    };

    // Load contact requests
    const loadContactRequests = async () => {
        try {
            const { data, error } = await supabase
                .from("contact_requests")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setContactRequests(data || []);
        } catch (error) {
            console.error("Error loading contact requests:", error);
        }
    };

    // Load reports
    const loadReports = async () => {
        try {
            const { data, error } = await supabase
                .from("reports")
                .select(`
                    *,
                    reporter:users!fk_reports_reporter(name),
                    reported:users!fk_reports_reported(name)
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error("Error loading reports:", error);
        }
    };

    // Load product counts for all facets
    const loadFacetProductCounts = async () => {
        const countsMap = new Map<string, number>();

        try {
            // Load all junction table data to count products per facet
            const [productTypesData, occasionsData, colorsData, materialsData, citiesData] = await Promise.all([
                supabase.from("product_product_types").select("type_id"),
                supabase.from("product_occasions").select("occasion_id"),
                supabase.from("product_colors").select("color_id"),
                supabase.from("product_materials").select("material_id"),
                supabase.from("product_cities").select("city_id")
            ]);

            // Count products per product type
            if (productTypesData.data) {
                productTypesData.data.forEach((item: any) => {
                    const key = `product_type_${item.type_id}`;
                    countsMap.set(key, (countsMap.get(key) || 0) + 1);
                });
            }

            // Count products per occasion
            if (occasionsData.data) {
                occasionsData.data.forEach((item: any) => {
                    const key = `occasion_${item.occasion_id}`;
                    countsMap.set(key, (countsMap.get(key) || 0) + 1);
                });
            }

            // Count products per color
            if (colorsData.data) {
                colorsData.data.forEach((item: any) => {
                    const key = `color_${item.color_id}`;
                    countsMap.set(key, (countsMap.get(key) || 0) + 1);
                });
            }

            // Count products per material
            if (materialsData.data) {
                materialsData.data.forEach((item: any) => {
                    const key = `material_${item.material_id}`;
                    countsMap.set(key, (countsMap.get(key) || 0) + 1);
                });
            }

            // Count products per city
            if (citiesData.data) {
                citiesData.data.forEach((item: any) => {
                    const key = `city_${item.city_id}`;
                    countsMap.set(key, (countsMap.get(key) || 0) + 1);
                });
            }

            setFacetProductCounts(countsMap);
        } catch (error) {
            console.error("Error loading facet product counts:", error);
        }
    };

    // Load all facet types
    const loadAllFacets = async () => {
        await Promise.all([
            loadProductTypes(),
            loadOccasions(),
            loadColors(),
            loadMaterials(),
            loadCities()
        ]);
        // Load product counts after facets are loaded
        await loadFacetProductCounts();
    };

    const loadProductTypes = async () => {
        try {
            const { data, error } = await supabase
                .from("product_types")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setProductTypes(data || []);
        } catch (error: any) {
            console.error("Error loading product types:", error);
        }
    };

    const loadOccasions = async () => {
        try {
            const { data, error } = await supabase
                .from("occasions")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setOccasions(data || []);
        } catch (error: any) {
            console.error("Error loading occasions:", error);
        }
    };

    const loadColors = async () => {
        try {
            const { data, error } = await supabase
                .from("colors")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setColors(data || []);
        } catch (error: any) {
            console.error("Error loading colors:", error);
        }
    };

    const loadMaterials = async () => {
        try {
            const { data, error } = await supabase
                .from("materials")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setMaterials(data || []);
        } catch (error: any) {
            console.error("Error loading materials:", error);
        }
    };

    const loadCities = async () => {
        try {
            const { data, error } = await supabase
                .from("cities")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setCities(data || []);
        } catch (error: any) {
            console.error("Error loading cities:", error);
        }
    };

    const handleAddNewCity = async () => {
        if (!newCityName.trim()) {
            showPopup("Please enter a city name", "warning", "Validation Error");
            return;
        }

        if (!newCityState.trim()) {
            showPopup("Please enter a state name", "warning", "Validation Error");
            return;
        }

        if (cities.some(c => c.name.toLowerCase() === newCityName.trim().toLowerCase())) {
            showPopup("This city already exists", "warning", "Duplicate");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("cities")
                .insert([{
                    name: newCityName.trim(),
                    state: newCityState.trim(),
                    display_order: cities.length
                }])
                .select()
                .single();

            if (error) throw error;

            // Reload cities to get the updated list
            await loadCities();

            // Automatically select the newly created city (clearing others for single select)
            setUserFormData((prev) => ({
                ...prev,
                cities: [data.id]
            }));

            setNewCityName("");
            setNewCityState("");
            setShowAddCity(false);
            showPopup("City added and selected!", "success");
        } catch (error: any) {
            showPopup(error.message || "Failed to add city", "error", "Error");
            console.error("Error adding city:", error);
        }
    };

    // Facet image upload functions
    const handleFacetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showPopup("Please select an image file", "error", "Invalid File");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showPopup("Image size must be less than 5MB", "error", "File Too Large");
            return;
        }

        setFacetImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFacetImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadFacetImageToSupabase = async (file: File): Promise<string> => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `facets/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    // CRUD functions for Product Types
    const handleSaveProductType = async () => {
        if (!facetFormData.name.trim()) {
            showPopup("Please enter a category name", "warning", "Validation Error");
            return;
        }

        try {
            let imageUrl = facetFormData.image_url;

            if (facetImageFile) {
                setIsUploadingFacetImage(true);
                try {
                    imageUrl = await uploadFacetImageToSupabase(facetImageFile);
                } catch (uploadError: any) {
                    setIsUploadingFacetImage(false);
                    showPopup(uploadError.message || "Failed to upload image", "error", "Upload Error");
                    return;
                }
                setIsUploadingFacetImage(false);
            }

            if (editingFacet) {
                const { error } = await supabase
                    .from("product_types")
                    .update({
                        name: facetFormData.name.trim(),
                        image_url: imageUrl || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingFacet.id);

                if (error) throw error;
                showPopup("Category updated successfully!", "success");
            } else {
                const { error } = await supabase
                    .from("product_types")
                    .insert([{
                        name: facetFormData.name.trim(),
                        image_url: imageUrl || null,
                        display_order: productTypes.length
                    }]);

                if (error) throw error;
                showPopup("Category added successfully!", "success");
            }
            setIsFacetModalOpen(false);
            setEditingFacet(null);
            setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
            setFacetImageFile(null);
            setFacetImagePreview("");
            loadProductTypes();
        } catch (error: any) {
            showPopup(error.message || "Failed to save product type", "error", "Error");
            console.error("Error saving product type:", error);
        }
    };

    const handleDeleteProductType = async (id: string, name: string) => {
        setDeleteTarget({ id, name, type: 'product_type' });
        setIsDeleteModalOpen(true);
    };

    // CRUD functions for Occasions
    const handleSaveOccasion = async () => {
        if (!facetFormData.name.trim()) {
            showPopup("Please enter an occasion name", "warning", "Validation Error");
            return;
        }

        try {
            let imageUrl = facetFormData.image_url;

            if (facetImageFile) {
                setIsUploadingFacetImage(true);
                try {
                    imageUrl = await uploadFacetImageToSupabase(facetImageFile);
                } catch (uploadError: any) {
                    setIsUploadingFacetImage(false);
                    showPopup(uploadError.message || "Failed to upload image", "error", "Upload Error");
                    return;
                }
                setIsUploadingFacetImage(false);
            }

            if (editingFacet) {
                const { error } = await supabase
                    .from("occasions")
                    .update({
                        name: facetFormData.name.trim(),
                        image_url: imageUrl || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingFacet.id);

                if (error) throw error;
                showPopup("Occasion updated successfully!", "success");
            } else {
                const { error } = await supabase
                    .from("occasions")
                    .insert([{
                        name: facetFormData.name.trim(),
                        image_url: imageUrl || null,
                        display_order: occasions.length
                    }]);

                if (error) throw error;
                showPopup("Occasion added successfully!", "success");
            }
            setIsFacetModalOpen(false);
            setEditingFacet(null);
            setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
            setFacetImageFile(null);
            setFacetImagePreview("");
            loadOccasions();
        } catch (error: any) {
            showPopup(error.message || "Failed to save occasion", "error", "Error");
            console.error("Error saving occasion:", error);
        }
    };

    const handleDeleteOccasion = async (id: string, name: string) => {
        setDeleteTarget({ id, name, type: 'occasion' });
        setIsDeleteModalOpen(true);
    };

    // CRUD functions for Colors
    const handleSaveColor = async () => {
        if (!facetFormData.name.trim()) {
            showPopup("Please enter a color name", "warning", "Validation Error");
            return;
        }

        try {
            if (editingFacet) {
                const { error } = await supabase
                    .from("colors")
                    .update({
                        name: facetFormData.name.trim(),
                        hex: facetFormData.hex.trim() || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingFacet.id);

                if (error) throw error;
                showPopup("Color updated successfully!", "success");
            } else {
                const { error } = await supabase
                    .from("colors")
                    .insert([{
                        name: facetFormData.name.trim(),
                        hex: facetFormData.hex.trim() || null,
                        display_order: colors.length
                    }]);

                if (error) throw error;
                showPopup("Color added successfully!", "success");
            }
            setIsFacetModalOpen(false);
            setEditingFacet(null);
            setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
            loadColors();
        } catch (error: any) {
            showPopup(error.message || "Failed to save color", "error", "Error");
            console.error("Error saving color:", error);
        }
    };

    const handleDeleteColor = async (id: string, name: string) => {
        setDeleteTarget({ id, name, type: 'color' });
        setIsDeleteModalOpen(true);
    };

    // CRUD functions for Materials
    const handleSaveMaterial = async () => {
        if (!facetFormData.name.trim()) {
            showPopup("Please enter a material name", "warning", "Validation Error");
            return;
        }

        try {
            if (editingFacet) {
                const { error } = await supabase
                    .from("materials")
                    .update({
                        name: facetFormData.name.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingFacet.id);

                if (error) throw error;
                showPopup("Material updated successfully!", "success");
            } else {
                const { error } = await supabase
                    .from("materials")
                    .insert([{
                        name: facetFormData.name.trim(),
                        display_order: materials.length
                    }]);

                if (error) throw error;
                showPopup("Material added successfully!", "success");
            }
            setIsFacetModalOpen(false);
            setEditingFacet(null);
            setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
            loadMaterials();
        } catch (error: any) {
            showPopup(error.message || "Failed to save material", "error", "Error");
            console.error("Error saving material:", error);
        }
    };

    const handleDeleteMaterial = async (id: string, name: string) => {
        setDeleteTarget({ id, name, type: 'material' });
        setIsDeleteModalOpen(true);
    };

    // CRUD functions for Cities
    const handleSaveCity = async () => {
        if (!facetFormData.name.trim()) {
            showPopup("Please enter a city name", "warning", "Validation Error");
            return;
        }

        if (!facetFormData.state.trim()) {
            showPopup("Please select a State", "warning", "Validation Error");
            return;
        }

        try {
            if (editingFacet) {
                const { error } = await supabase
                    .from("cities")
                    .update({
                        name: facetFormData.name.trim(),
                        state: facetFormData.state.trim(),
                        // country: Removed as requested
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingFacet.id);

                if (error) throw error;
                showPopup("City updated successfully!", "success");
            } else {
                const { error } = await supabase
                    .from("cities")
                    .insert([{
                        name: facetFormData.name.trim(),
                        state: facetFormData.state.trim(),
                        // country: Removed as requested
                        display_order: cities.length
                    }]);

                if (error) throw error;
                showPopup("City added successfully!", "success");
            }
            setIsFacetModalOpen(false);
            setEditingFacet(null);
            setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
            loadCities();
        } catch (error: any) {
            showPopup(error.message || "Failed to save city", "error", "Error");
            console.error("Error saving city:", error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleteModalOpen(false);
        const { id, name, type } = deleteTarget;
        setDeleteTarget(null);

        if (type === 'city') {
            try {
                const { error } = await supabase
                    .from("cities")
                    .delete()
                    .eq("id", id);

                if (error) throw error;
                showPopup("City deleted successfully!", "success");
                loadCities();
            } catch (error: any) {
                showPopup(error.message || "Failed to delete city", "error", "Error");
                console.error("Error deleting city:", error);
            }
        } else if (type === 'product_type') {
            try {
                const { error } = await supabase
                    .from("product_types")
                    .delete()
                    .eq("id", id);

                if (error) throw error;
                showPopup("Category deleted successfully!", "success");
                loadProductTypes();
            } catch (error: any) {
                showPopup(error.message || "Failed to delete product type", "error", "Error");
                console.error("Error deleting product type:", error);
            }
        } else if (type === 'occasion') {
            try {
                const { error } = await supabase
                    .from("occasions")
                    .delete()
                    .eq("id", id);

                if (error) throw error;
                showPopup("Occasion deleted successfully!", "success");
                loadOccasions();
            } catch (error: any) {
                showPopup(error.message || "Failed to delete occasion", "error", "Error");
                console.error("Error deleting occasion:", error);
            }
        } else if (type === 'color') {
            try {
                const { error } = await supabase
                    .from("colors")
                    .delete()
                    .eq("id", id);

                if (error) throw error;
                showPopup("Color deleted successfully!", "success");
                loadColors();
            } catch (error: any) {
                showPopup(error.message || "Failed to delete color", "error", "Error");
                console.error("Error deleting color:", error);
            }
        } else if (type === 'material') {
            try {
                const { error } = await supabase
                    .from("materials")
                    .delete()
                    .eq("id", id);

                if (error) throw error;
                showPopup("Material deleted successfully!", "success");
                loadMaterials();
            } catch (error: any) {
                showPopup(error.message || "Failed to delete material", "error", "Error");
                console.error("Error deleting material:", error);
            }
        }
    };

    const handleDeleteCity = async (id: string, name: string) => {
        setDeleteTarget({ id, name, type: 'city' });
        setIsDeleteModalOpen(true);
    };

    const toggleCategoryFeatured = async (categoryId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("categories")
                .update({ is_featured: !currentStatus, updated_at: new Date().toISOString() })
                .eq("id", categoryId);

            if (error) throw error;
            showPopup(
                !currentStatus
                    ? "Category pinned! It will now appear in Featured Categories on the home page."
                    : "Category unpinned. It will no longer appear in Featured Categories.",
                "success"
            );
            loadCategories();
        } catch (error: any) {
            showPopup(error.message || "Failed to update category", "error", "Error");
            console.error("Error toggling category featured status:", error);
        }
    };

    const uploadCategoryImageToSupabase = async (file: File): Promise<string> => {
        try {
            // Check if admin is logged in
            const adminEmail = localStorage.getItem("adminEmail");

            if (!adminEmail) {
                throw new Error("You are not logged in. Please log in as admin first.");
            }

            // Convert to WebP
            const result = await convertToWebPOptimized(file);
            const webpBlob = result.blob;

            // Generate unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 15);
            const fileName = `categories/${timestamp}-${randomStr}.webp`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from("product-images")
                .upload(fileName, webpBlob, {
                    contentType: "image/webp",
                    upsert: false,
                });

            if (error) {
                console.error("Storage upload error:", error);
                throw new Error(`Image upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("product-images")
                .getPublicUrl(fileName);

            if (!urlData?.publicUrl) {
                throw new Error("Failed to get image URL");
            }

            return urlData.publicUrl;
        } catch (error: any) {
            console.error("Error uploading category image:", error);
            throw error;
        }
    };

    const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showPopup("Please select an image file", "warning", "Invalid File");
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showPopup("Image size must be less than 10MB", "warning", "File Too Large");
                return;
            }

            setCategoryImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setCategoryImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Generate link URL from category name (slugify)
    const generateLinkUrl = (name: string): string => {
        return `/${name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-+|-+$/g, '')}`; // Remove leading/trailing hyphens
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!categoryFormData.name.trim()) {
                showPopup("Please enter a category name", "warning", "Validation Error");
                return;
            }

            // Auto-generate link URL from category name
            const linkUrl = generateLinkUrl(categoryFormData.name.trim());

            // If editing and no new image selected, use existing image_url
            // If new image selected, upload it
            let imageUrl = categoryFormData.image_url;

            if (categoryImageFile) {
                setIsUploadingCategoryImage(true);
                try {
                    imageUrl = await uploadCategoryImageToSupabase(categoryImageFile);
                } catch (uploadError: any) {
                    setIsUploadingCategoryImage(false);
                    showPopup(uploadError.message || "Failed to upload image", "error", "Upload Error");
                    return;
                }
                setIsUploadingCategoryImage(false);
            } else if (!editingCategory && !imageUrl) {
                // New category must have an image
                showPopup("Please select an image", "warning", "Validation Error");
                return;
            }

            if (editingCategory) {
                // Update existing category
                const { error } = await supabase
                    .from("categories")
                    .update({
                        name: categoryFormData.name.trim(),
                        image_url: imageUrl,
                        link_url: linkUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingCategory.id);

                if (error) throw error;
                showPopup("Category updated successfully!", "success");
            } else {
                // Add new category
                const maxOrder = categories.length > 0
                    ? Math.max(...categories.map(c => c.display_order))
                    : -1;

                const { error } = await supabase
                    .from("categories")
                    .insert([{
                        name: categoryFormData.name.trim(),
                        image_url: imageUrl,
                        link_url: linkUrl,
                        display_order: maxOrder + 1
                    }]);

                if (error) throw error;
                showPopup("Category added successfully!", "success");
            }

            setIsCategoryModalOpen(false);
            setEditingCategory(null);
            setCategoryFormData({ name: "", image_url: "" });
            setCategoryImageFile(null);
            setCategoryImagePreview("");
            loadCategories();
        } catch (error: any) {
            setIsUploadingCategoryImage(false);
            showPopup(error.message || "Failed to save category", "error", "Error");
            console.error("Error saving category:", error);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            // Check if any products reference this category
            const { data: productsWithCategory, error: checkError } = await supabase
                .from("products")
                .select("id, title, name")
                .eq("category_id", id);

            if (checkError) {
                throw checkError;
            }

            // If products reference this category, set their category_id to NULL first
            if (productsWithCategory && productsWithCategory.length > 0) {
                const { error: updateError } = await supabase
                    .from("products")
                    .update({ category_id: null })
                    .eq("category_id", id);

                if (updateError) throw updateError;
            }

            // Now delete the category
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);

            if (error) throw error;
            showPopup("Category deleted successfully!", "success");
            loadCategories();
        } catch (error: any) {
            showPopup(error.message || "Failed to delete category", "error", "Error");
            console.error("Error deleting category:", error);
        }
    };

    const moveCategory = async (id: string, direction: "up" | "down") => {
        try {
            const currentIndex = categories.findIndex(c => c.id === id);
            if (currentIndex === -1) return;

            const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= categories.length) return;

            const currentCategory = categories[currentIndex];
            const targetCategory = categories[newIndex];

            // Swap display_order values
            const tempOrder = currentCategory.display_order;
            const newCurrentOrder = targetCategory.display_order;
            const newTargetOrder = tempOrder;

            // Update both categories in database
            await Promise.all([
                supabase
                    .from("categories")
                    .update({ display_order: newCurrentOrder, updated_at: new Date().toISOString() })
                    .eq("id", currentCategory.id),
                supabase
                    .from("categories")
                    .update({ display_order: newTargetOrder, updated_at: new Date().toISOString() })
                    .eq("id", targetCategory.id)
            ]);

            loadCategories();
        } catch (error: any) {
            showPopup(error.message || "Failed to reorder category", "error", "Error");
            console.error("Error moving category:", error);
        }
    };

    // Hero Slides Functions
    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showPopup("Please select an image file", "error", "Invalid File");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showPopup("Image size must be less than 5MB", "error", "File Too Large");
            return;
        }

        setHeroImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setHeroImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadHeroImageToSupabase = async (file: File): Promise<string> => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `hero-slides/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSaveHeroSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let imageUrl = heroFormData.image_url;

            if (heroImageFile) {
                setIsUploadingHeroImage(true);
                try {
                    imageUrl = await uploadHeroImageToSupabase(heroImageFile);
                } catch (uploadError: any) {
                    setIsUploadingHeroImage(false);
                    showPopup(uploadError.message || "Failed to upload image", "error", "Upload Error");
                    return;
                }
                setIsUploadingHeroImage(false);
            } else if (!editingHeroSlide && !imageUrl) {
                showPopup("Please select an image", "warning", "Validation Error");
                return;
            }

            if (editingHeroSlide) {
                const { error } = await supabase
                    .from("hero_slides")
                    .update({
                        image_url: imageUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingHeroSlide.id);

                if (error) throw error;
                showPopup("Hero slide updated successfully!", "success");
            } else {
                const maxOrder = heroSlides.length > 0
                    ? Math.max(...heroSlides.map(s => s.display_order))
                    : -1;

                const { error } = await supabase
                    .from("hero_slides")
                    .insert([{
                        image_url: imageUrl,
                        title: "",
                        subtitle: null,
                        display_order: maxOrder + 1,
                        is_active: true
                    }]);

                if (error) throw error;
                showPopup("Hero slide added successfully!", "success");
            }

            setIsHeroModalOpen(false);
            setEditingHeroSlide(null);
            setHeroFormData({ title: "", subtitle: "", image_url: "" });
            setHeroImageFile(null);
            setHeroImagePreview("");
            loadHeroSlides();
        } catch (error: any) {
            setIsUploadingHeroImage(false);
            showPopup(error.message || "Failed to save hero slide", "error", "Error");
            console.error("Error saving hero slide:", error);
        }
    };

    const handleEditHeroSlide = (slide: { id: string; image_url: string; title: string; subtitle: string | null; display_order: number; is_active: boolean }) => {
        setEditingHeroSlide(slide);
        setHeroFormData({
            title: "",
            subtitle: "",
            image_url: slide.image_url
        });
        setHeroImagePreview(slide.image_url);
        setHeroImageFile(null);
        setIsHeroModalOpen(true);
    };

    const handleDeleteHeroSlide = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete this hero slide?`)) return;

        try {
            const { error } = await supabase
                .from("hero_slides")
                .delete()
                .eq("id", id);

            if (error) throw error;
            showPopup("Hero slide deleted successfully!", "success");
            loadHeroSlides();
        } catch (error: any) {
            showPopup(error.message || "Failed to delete hero slide", "error", "Error");
            console.error("Error deleting hero slide:", error);
        }
    };

    const toggleHeroSlideActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("hero_slides")
                .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;
            showPopup(
                !currentStatus
                    ? "Hero slide activated! It will now appear in the hero section."
                    : "Hero slide deactivated. It will no longer appear in the hero section.",
                "success"
            );
            loadHeroSlides();
        } catch (error: any) {
            showPopup(error.message || "Failed to toggle hero slide status", "error", "Error");
            console.error("Error toggling hero slide status:", error);
        }
    };

    const handleHeroDragStart = (e: React.DragEvent, id: string) => {
        setDraggedHeroId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleHeroDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverHeroId(id);
    };

    const handleHeroDragEnd = () => {
        setDraggedHeroId(null);
        setDragOverHeroId(null);
    };

    const handleHeroDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedHeroId || draggedHeroId === targetId) {
            setDraggedHeroId(null);
            setDragOverHeroId(null);
            return;
        }

        try {
            const draggedIndex = heroSlides.findIndex(s => s.id === draggedHeroId);
            const targetIndex = heroSlides.findIndex(s => s.id === targetId);

            if (draggedIndex === -1 || targetIndex === -1) return;

            const draggedSlide = heroSlides[draggedIndex];
            const targetSlide = heroSlides[targetIndex];

            // Swap display_order values
            const tempOrder = draggedSlide.display_order;
            const newDraggedOrder = targetSlide.display_order;
            const newTargetOrder = tempOrder;

            await Promise.all([
                supabase
                    .from("hero_slides")
                    .update({ display_order: newDraggedOrder, updated_at: new Date().toISOString() })
                    .eq("id", draggedSlide.id),
                supabase
                    .from("hero_slides")
                    .update({ display_order: newTargetOrder, updated_at: new Date().toISOString() })
                    .eq("id", targetSlide.id)
            ]);

            loadHeroSlides();
        } catch (error: any) {
            showPopup(error.message || "Failed to reorder hero slide", "error", "Error");
            console.error("Error reordering hero slide:", error);
        } finally {
            setDraggedHeroId(null);
            setDragOverHeroId(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, categoryId: string) => {
        setDraggedCategoryId(categoryId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", categoryId);
    };

    const handleDragOver = (e: React.DragEvent, categoryId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedCategoryId && draggedCategoryId !== categoryId) {
            setDragOverCategoryId(categoryId);
        }
    };

    const handleDragLeave = () => {
        setDragOverCategoryId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
        e.preventDefault();
        setDragOverCategoryId(null);

        if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
            setDraggedCategoryId(null);
            return;
        }

        const draggedIndex = categories.findIndex(c => c.id === draggedCategoryId);
        const targetIndex = categories.findIndex(c => c.id === targetCategoryId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedCategoryId(null);
            return;
        }

        // Create new array with reordered items
        const newCategories = [...categories];
        const [removed] = newCategories.splice(draggedIndex, 1);
        newCategories.splice(targetIndex, 0, removed);

        // Update display_order for all affected categories
        try {
            const updatePromises = newCategories.map((cat, index) =>
                supabase
                    .from("categories")
                    .update({
                        display_order: index,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", cat.id)
            );

            await Promise.all(updatePromises);
            showPopup("Categories reordered successfully!", "success");
            loadCategories();
        } catch (error: any) {
            showPopup(error.message || "Failed to reorder categories", "error", "Error");
            console.error("Error reordering categories:", error);
        }

        setDraggedCategoryId(null);
    };

    const handleDragEnd = () => {
        setDraggedCategoryId(null);
        setDragOverCategoryId(null);
    };

    const loadTotalViews = async () => {
        try {
            console.log("Loading total views...");
            const { count, error } = await supabase
                .from("product_views")
                .select("*", { count: "exact", head: true });

            if (error) {
                console.error("Error loading total views:", error);
                // Don't show popup for views - it's not critical
                setTotalViews(0);
                return;
            }

            if (count !== null) {
                console.log("Total views:", count);
                setTotalViews(count);
            } else {
                setTotalViews(0);
            }
        } catch (error) {
            console.error("Error loading total views:", error);
            setTotalViews(0);
        }
    };

    const loadWebsiteSetting = async () => {
        try {
            const { data, error } = await supabase
                .from("website_settings")
                .select("value")
                .eq("key", "website_enabled")
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned - setting doesn't exist, default to OFF
                    setWebsiteEnabled(false);
                    return;
                }
                console.error("Error loading website setting:", error);
                setWebsiteEnabled(false); // Default to OFF on error
                return;
            }

            if (data && data.value !== null && data.value !== undefined) {
                // value is JSONB, so it might be a string "true"/"false" or boolean
                // Logic: true = show coming soon (toggle ON), false = show normal website (toggle OFF)
                let settingValue: boolean;

                if (typeof data.value === 'string') {
                    settingValue = data.value === 'true' || data.value === 'True';
                } else if (typeof data.value === 'boolean') {
                    settingValue = data.value;
                } else {
                    // Handle JSONB boolean
                    settingValue = Boolean(data.value);
                }

                // Set the toggle state: true = ON (coming soon), false = OFF (website visible)
                setWebsiteEnabled(settingValue);
                console.log("Website setting loaded:", {
                    rawValue: data.value,
                    settingValue,
                    toggleState: settingValue ? 'ON (coming soon)' : 'OFF (website visible)'
                });
            } else {
                // Default to OFF (show normal website) if setting doesn't exist
                setWebsiteEnabled(false);
                console.log("No website setting found, defaulting to OFF (website visible)");
            }
        } catch (error) {
            console.error("Error loading website setting:", error);
            setWebsiteEnabled(false); // Default to OFF (show normal website) on error
        }
    };

    const toggleWebsite = async () => {
        if (isTogglingWebsite) return; // Prevent double-clicks

        try {
            setIsTogglingWebsite(true);
            const newValue = !websiteEnabled;

            console.log("Toggling website:", { current: websiteEnabled, new: newValue });

            // Update or insert the setting
            const { error } = await supabase
                .from("website_settings")
                .upsert({
                    key: "website_enabled",
                    value: newValue,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: "key"
                });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            console.log("Setting updated successfully:", newValue);

            // Update local state immediately for better UX
            setWebsiteEnabled(newValue);

            showPopup(
                newValue
                    ? "Coming soon page is now active (website hidden)"
                    : "Website is now visible to everyone",
                "success"
            );

            // Reload the setting to ensure sync after a brief delay
            setTimeout(() => {
                loadWebsiteSetting();
            }, 1000);
        } catch (error: any) {
            console.error("Error toggling website:", error);
            showPopup(
                error.message || "Failed to update website setting. Please try again.",
                "error",
                "Error"
            );
            // Reload setting to revert to correct state
            setTimeout(() => {
                loadWebsiteSetting();
            }, 500);
        } finally {
            setIsTogglingWebsite(false);
        }
    };



    const handleEditUser = async (user: User) => {
        setEditingUser(user);

        // Load user cities
        const { data: userCitiesData } = await supabase
            .from("user_cities")
            .select("city_id")
            .eq("user_id", user.id);

        const userCityIds = userCitiesData?.map((uc: any) => uc.city_id).filter(Boolean) || [];

        // Split name into first and last
        const nameParts = user.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setUserFirstName(firstName);
        setUserLastName(lastName);

        setUserFormData({
            name: user.name,
            phone: user.phone,
            email: user.email || "",
            cities: userCityIds,
        });
        setIsUserModalOpen(true);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate name
        if (!userFirstName.trim() || !userLastName.trim()) {
            showPopup("First Name and Surname are required", "error", "Validation Error");
            return;
        }

        const fullName = `${userFirstName.trim()} ${userLastName.trim()}`;

        // Get Phone
        const rawPhone = userFormData.phone.replace(/[^0-9+]/g, '');
        const digitsOnly = rawPhone.replace('+91', '');
        const hasPhone = digitsOnly.length > 0;
        let userPhone: string | null = null;

        // Validate Phone (Mandatory now)
        if (!hasPhone) {
            showPopup("Phone number is required", "error", "Validation Error");
            return;
        }

        if (!rawPhone.startsWith('+91')) {
            showPopup("Phone number must start with +91", "error", "Validation Error");
            return;
        }
        if (digitsOnly.length !== 10) {
            showPopup("Phone number must be exactly 10 digits after +91", "error", "Validation Error");
            return;
        }
        if (!/^\d+$/.test(digitsOnly)) {
            showPopup("Phone number must contain only numbers", "error", "Validation Error");
            return;
        }
        userPhone = rawPhone;

        // Validate cities
        if (!userFormData.cities || userFormData.cities.length === 0) {
            showPopup("Please select at least one city", "error", "Validation Error");
            return;
        }

        try {
            if (editingUser) {
                // Update existing user
                // Check conflicts
                if (userPhone && userPhone !== editingUser.phone) {
                    const { data: conflict } = await supabase.from("users").select("id").eq("phone", userPhone).neq("id", editingUser.id).maybeSingle();
                    if (conflict) { showPopup("Phone number already exists for another user", "error", "Validation Error"); return; }
                }

                const userData = {
                    name: fullName,
                    phone: userPhone,
                };

                // Update
                const { error: updateError } = await supabase.from("users").update(userData).eq("id", editingUser.id);
                if (updateError) throw updateError;

                // Update cities
                await supabase.from("user_cities").delete().eq("user_id", editingUser.id);
                if (userFormData.cities.length > 0) {
                    await supabase.from("user_cities").insert(userFormData.cities.map(cityId => ({ user_id: editingUser.id, city_id: cityId })));
                }

                showPopup("User updated successfully!", "success");
                setIsUserModalOpen(false);
                setEditingUser(null);
                setUserFormData({ name: "", phone: "+91", email: "", cities: [] });
                await loadUsers();
                return;
            }

            // Create New User
            // Check if existing user (by phone)
            let existingUser = null;
            if (userPhone) {
                const { data } = await supabase.from("users").select("*").eq("phone", userPhone).maybeSingle();
                existingUser = data;
            }

            if (existingUser) {
                // Existing user logic - Update name if needed
                const userData = {
                    name: fullName,
                    phone: userPhone || existingUser.phone,
                };

                const { data: updateData, error: updateError } = await supabase.from("users").update(userData).eq("id", existingUser.id).select().single();
                if (updateError) throw updateError;

                // Update cities
                const finalUserId = updateData.id;
                await supabase.from("user_cities").delete().eq("user_id", finalUserId);
                if (userFormData.cities.length > 0) {
                    await supabase.from("user_cities").insert(userFormData.cities.map(cityId => ({ user_id: finalUserId, city_id: cityId })));
                }

                showPopup("User created successfully (merged with existing phone record)!", "success");
                setIsUserModalOpen(false);
                setEditingUser(null);
                setUserFormData({ name: "", phone: "+91", email: "", cities: [] });
                await loadUsers();
            } else {
                // Create completely new user
                const userId = crypto.randomUUID();
                const userData = {
                    id: userId,
                    name: fullName,
                    phone: userPhone,
                };

                const { error: userError } = await supabase.from("users").insert([userData]);
                if (userError) {
                    throw userError;
                }

                // Insert cities
                if (userFormData.cities.length > 0) {
                    await supabase.from("user_cities").insert(
                        userFormData.cities.map(cityId => ({
                            user_id: userId,
                            city_id: cityId
                        }))
                    );
                }

                showPopup("User created successfully!", "success");
                setIsUserModalOpen(false);
                setUserFormData({ name: "", phone: "+91", email: "", cities: [] });
                await loadUsers();
            }

        } catch (error: any) {
            showPopup(error.message || "Unknown error", "error", editingUser ? "Error Updating User" : "Error Creating User");
            console.error("Error creating/updating user:", error);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        // Show confirmation popup
        setDeleteConfirmUser({ id: userId, name: userName });
    };

    const confirmDeleteUser = async () => {
        if (!deleteConfirmUser) return;

        const { id: userId, name: userName } = deleteConfirmUser;

        try {
            // 1. Delete Reports involving the user (as reporter or reported)
            const { error: reportsError } = await supabase
                .from("reports")
                .delete()
                .or(`reporter_user_id.eq.${userId},reported_user_id.eq.${userId}`);

            if (reportsError) {
                console.error("Error deleting user reports:", reportsError);
                // Continue even if reports fail, though it might cause issues later if FK exists
            }

            // 2. Delete Messages sent by the user
            const { error: messagesError } = await supabase
                .from("messages")
                .delete()
                .eq("sender_user_id", userId);

            if (messagesError) {
                console.error("Error deleting user messages:", messagesError);
            }

            // 3. Handle Inquiries and Chats
            // First, find all inquiries where user is owner or renter
            const { data: userInquiries, error: inquiriesFetchError } = await supabase
                .from("inquiries")
                .select("id")
                .or(`owner_user_id.eq.${userId},renter_user_id.eq.${userId}`);

            if (userInquiries && userInquiries.length > 0) {
                const inquiryIds = userInquiries.map(i => i.id);

                // Delete Chats associated with these inquiries
                const { error: chatsError } = await supabase
                    .from("chats")
                    .delete()
                    .in("inquiry_id", inquiryIds);

                if (chatsError) console.error("Error deleting user chats:", chatsError);

                // Delete the Inquiries themselves
                const { error: inquiriesDeleteError } = await supabase
                    .from("inquiries")
                    .delete()
                    .in("id", inquiryIds);

                if (inquiriesDeleteError) console.error("Error deleting user inquiries:", inquiriesDeleteError);
            }

            // 4. Delete user products (Existing logic)
            const { error: productsError } = await supabase
                .from("products")
                .delete()
                .eq("owner_user_id", userId);

            if (productsError) {
                console.error("Error deleting user products:", productsError);
                throw productsError;
            }

            // 5. Delete the user from users table
            const { error: userError } = await supabase
                .from("users")
                .delete()
                .eq("id", userId);

            if (userError) {
                console.error("Error deleting user:", userError);
                throw userError;
            }

            // User deleted successfully
            showPopup(`User "${userName}" has been fully deleted.`, "success");

            // Close confirmation
            setDeleteConfirmUser(null);

            // Reload users list
            await loadUsers();

            // Reload user products to update the list
            await loadUserProducts();
        } catch (error: any) {
            showPopup(error.message || "Unknown error", "error", "Error Deleting User");
            console.error("Error deleting user:", error);
            setDeleteConfirmUser(null);
        }
    };

    // Test user functions removed - using OTP bypass dev mode instead

    const handleEditUserProduct = (product: UserProduct) => {
        // Navigate to the add product page with edit parameter
        if (product.user_id) {
            router.push(`/admin/manage-products/add?userId=${product.user_id}&edit=${product.id}`);
        } else {
            console.error("Product missing user_id, cannot navigate to edit page");
        }
    };

    // Convert image to WebP format with optimized quality and optional resizing
    const convertToWebP = (file: File, quality: number = 0.75, maxWidth?: number, maxHeight?: number): Promise<{ blob: Blob; size: number }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Use window.Image to access the native browser Image constructor
                // instead of the Next.js Image component
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");

                    // Calculate new dimensions if resizing is needed
                    let width = img.width;
                    let height = img.height;

                    if (maxWidth && maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        if (ratio < 1) {
                            width = Math.floor(width * ratio);
                            height = Math.floor(height * ratio);
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }

                    // Use better image smoothing for resizing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve({ blob, size: blob.size });
                            } else {
                                reject(new Error("Failed to convert image to WebP"));
                            }
                        },
                        "image/webp",
                        quality
                    );
                };
                img.onerror = () => reject(new Error("Failed to load image"));
                if (e.target?.result) {
                    img.src = e.target.result as string;
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    // Convert image to WebP with aggressive optimization to ensure size reduction
    const convertToWebPOptimized = async (file: File): Promise<{ blob: Blob; size: number }> => {
        const originalSize = file.size;
        let bestBlob: Blob | null = null;
        let bestSize = originalSize;
        let bestQuality = 0.75;

        // For large images (> 1MB), try resizing first
        const shouldResize = originalSize > 1024 * 1024; // 1MB
        const maxDimension = shouldResize ? 1920 : undefined; // Max 1920px for large images

        // Try more aggressive quality levels
        const qualityLevels = [0.7, 0.6, 0.5, 0.4, 0.3, 0.25];

        for (const quality of qualityLevels) {
            try {
                const { blob, size } = await convertToWebP(file, quality, maxDimension, maxDimension);

                // If this quality produces a smaller file, use it
                if (size < bestSize) {
                    bestBlob = blob;
                    bestSize = size;
                    bestQuality = quality;
                }

                // If we've achieved good compression (at least 30% reduction), stop
                if (size < originalSize * 0.7) {
                    console.log(`Found good compression at quality ${quality}: ${((1 - size / originalSize) * 100).toFixed(1)}% reduction`);
                    break;
                }
            } catch (error) {
                console.warn(`Failed to convert with quality ${quality}:`, error);
                continue;
            }
        }

        // If still larger, try with resizing even for smaller images
        if (bestSize >= originalSize && !shouldResize) {
            console.log("Trying with resizing...");
            for (const quality of [0.5, 0.4, 0.3]) {
                try {
                    const { blob, size } = await convertToWebP(file, quality, 1920, 1920);
                    if (size < bestSize) {
                        bestBlob = blob;
                        bestSize = size;
                    }
                    if (size < originalSize * 0.7) break;
                } catch (error) {
                    continue;
                }
            }
        }

        // If still no improvement, use very low quality as last resort
        if (!bestBlob || bestSize >= originalSize) {
            console.log("Using very low quality as last resort...");
            const { blob } = await convertToWebP(file, 0.25, 1920, 1920);
            return { blob, size: blob.size };
        }

        console.log(`Best compression: quality ${bestQuality}, ${((1 - bestSize / originalSize) * 100).toFixed(1)}% reduction`);
        return { blob: bestBlob, size: bestSize };
    };

    // Upload image to Supabase Storage
    const uploadImageToSupabase = async (file: File, userId: string): Promise<string> => {
        try {
            // Check if admin is logged in (via localStorage)
            const adminEmail = localStorage.getItem("adminEmail");

            if (!adminEmail) {
                throw new Error(
                    "You are not logged in. Please log in as admin first.\n\n" +
                    "1. Go to /admin page\n" +
                    "2. Log in with your admin credentials\n" +
                    "3. Try uploading again"
                );
            }

            console.log("Admin authenticated:", adminEmail);

            // Try to list buckets (may fail due to permissions, but that's okay)
            // We'll try to upload directly and handle errors there
            const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

            if (bucketError) {
                console.warn("Could not list buckets (this is okay, we'll try upload anyway):", bucketError.message);
                // Don't throw error - we'll try to upload directly
            }

            // Log all buckets for debugging
            console.log("Available buckets:", buckets?.map(b => b.name) || "none");
            console.log("Total buckets found:", buckets?.length || 0);

            // Check for bucket (case-insensitive) if we got buckets
            const bucketName = "product-images";
            let actualBucketName = bucketName; // Default to lowercase

            if (buckets && buckets.length > 0) {
                const bucketExists = buckets.some(bucket =>
                    bucket.name.toLowerCase() === bucketName.toLowerCase()
                );

                // Find the actual bucket name (in case it's uppercase)
                const foundBucket = buckets.find(bucket =>
                    bucket.name.toLowerCase() === bucketName.toLowerCase()
                );

                if (foundBucket) {
                    actualBucketName = foundBucket.name;
                    console.log(`Found bucket: ${actualBucketName}`);
                } else {
                    // Bucket not found in list, but might still exist
                    // We'll try to upload anyway and let the upload error tell us
                    console.warn(`Bucket '${bucketName}' not found in list, but will try upload anyway`);
                }
            } else {
                // No buckets returned (might be permission issue)
                // We'll try to upload anyway - if bucket doesn't exist, upload will fail with clear error
                console.warn("Could not list buckets, but will try upload anyway");
            }

            // Convert to WebP (reuse if already converted)
            let webpBlob: Blob;
            if (convertedWebPBlob) {
                // Reuse the already converted blob
                webpBlob = convertedWebPBlob;
            } else {
                // Convert now if not already done
                const result = await convertToWebPOptimized(file);
                webpBlob = result.blob;
                setConvertedWebPSize(result.size);
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 15);
            const fileName = `user-products/${userId}/${timestamp}-${randomStr}.webp`;

            // Upload to Supabase Storage
            // Try upload directly - if bucket doesn't exist, we'll get a clear error
            console.log(`Uploading to bucket: ${bucketName}`);
            console.log(`File: ${fileName}, Size: ${webpBlob.size} bytes`);

            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, webpBlob, {
                    contentType: "image/webp",
                    upsert: false,
                });

            if (error) {
                console.error("Storage upload error:", error);
                console.error("Error details:", {
                    message: error.message,
                    error: error
                });

                // Check authentication status
                const adminEmail = localStorage.getItem("adminEmail");
                const authStatus = adminEmail ? "You are logged in" : "You are NOT logged in";

                if (error.message.includes("new row violates row-level security") || error.message.includes("row-level security")) {
                    throw new Error(
                        `Storage policy error (RLS violation).\n\n` +
                        `Current status: ${authStatus}\n\n` +
                        `Please check:\n` +
                        `1. You are logged in as admin\n` +
                        `2. Storage bucket '${actualBucketName || "product-images"}' exists\n` +
                        `3. Storage policies are configured correctly:\n` +
                        `   - "Allow authenticated uploads" (INSERT) policy exists\n` +
                        `   - Policy should allow authenticated users to INSERT\n` +
                        `4. Bucket is set to Public\n\n` +
                        `See STORAGE_SETUP_GUIDE.md for detailed instructions.\n\n` +
                        `Error: ${error.message}`
                    );
                }
                if (error.message.includes("Bucket not found") || error.message.includes("not found") || error.message.includes("does not exist")) {
                    throw new Error(
                        `Storage bucket 'product-images' not found.\n\n` +
                        `The bucket might not exist or you don't have permission to access it.\n\n` +
                        `Please verify:\n` +
                        `1. Go to Supabase Dashboard → Storage\n` +
                        `2. Check if 'product-images' bucket exists\n` +
                        `3. Make sure it's set to Public\n` +
                        `4. Check storage policies are configured (should have 4 policies)\n\n` +
                        `If bucket doesn't exist, create it:\n` +
                        `- Name: product-images (lowercase)\n` +
                        `- Check "Public bucket"\n` +
                        `- Then add policies (see FIX_STORAGE_POLICIES.md)`
                    );
                }
                throw new Error(`Upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            if (!urlData?.publicUrl) {
                throw new Error("Failed to get public URL for uploaded image");
            }

            const publicUrl = urlData.publicUrl;
            console.log("Image uploaded successfully. Public URL:", publicUrl);
            console.log("File path:", fileName);

            return publicUrl;
        } catch (error: any) {
            console.error("Error uploading image:", error);
            throw error;
        }
    };

    const handleSaveUserProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId && !editingUserProduct) {
            showPopup("Please select a user first", "warning", "Validation Error");
            return;
        }

        // Check if images are required for new products
        const hasExistingImages = editingUserProduct && userProductImages.length > 0;
        const hasNewImageFiles = userProductImageFiles.length > 0;
        const hasSingleImageFile = userProductImageFile !== null;

        if (!editingUserProduct && !hasNewImageFiles && !hasSingleImageFile) {
            showPopup("Please select at least one image file", "warning", "Validation Error");
            return;
        }

        setIsUploadingImage(true);
        try {
            const userId = selectedUserId || editingUserProduct?.user_id;
            if (!userId) {
                throw new Error("User ID is required");
            }

            // Upload multiple new images
            const uploadedImageUrls: string[] = [];
            if (userProductImageFiles.length > 0) {
                for (const file of userProductImageFiles) {
                    try {
                        const url = await uploadImageToSupabase(file, userId);
                        uploadedImageUrls.push(url);
                    } catch (uploadError: any) {
                        setIsUploadingImage(false);
                        const errorMessage = `Image upload failed: ${uploadError.message}\n\nPlease check:\n1. Storage bucket 'product-images' exists\n2. Storage policies are configured\n3. You are logged in as admin\n\nSee SUPABASE_SETUP_GUIDE.md for setup instructions.`;
                        showPopup(errorMessage, "error", "Image Upload Failed");
                        console.error("Upload error details:", uploadError);
                        return;
                    }
                }
            }

            // Handle single image upload (backward compatibility)
            let singleImageUrl = userProductFormData.image;
            if (userProductImageFile) {
                try {
                    singleImageUrl = await uploadImageToSupabase(userProductImageFile, userId);
                } catch (uploadError: any) {
                    setIsUploadingImage(false);
                    const errorMessage = `Image upload failed: ${uploadError.message}\n\nPlease check:\n1. Storage bucket 'product-images' exists\n2. Storage policies are configured\n3. You are logged in as admin\n\nSee SUPABASE_SETUP_GUIDE.md for setup instructions.`;
                    showPopup(errorMessage, "error", "Image Upload Failed");
                    console.error("Upload error details:", uploadError);
                    return;
                }
            }

            // Combine existing images with newly uploaded ones
            let allImages: string[] = [];
            if (editingUserProduct && userProductImages.length > 0) {
                // Keep existing images
                allImages = [...userProductImages];
            }
            // Add newly uploaded images
            allImages = [...allImages, ...uploadedImageUrls];
            // If single image was uploaded, add it too
            if (userProductImageFile && singleImageUrl) {
                allImages.push(singleImageUrl);
            }
            // If no images array but single image exists, use it
            if (allImages.length === 0 && singleImageUrl) {
                allImages = [singleImageUrl];
            }

            // Validate: Must have at least one image
            if (allImages.length === 0) {
                setIsUploadingImage(false);
                showPopup("At least one image is required. Please upload an image.", "error", "Validation Error");
                return;
            }

            // Ensure primary_image_index is valid and mandatory
            // PRIMARY IMAGE IS MANDATORY - always ensure one is set
            let validPrimaryIndex = primaryImageIndex;
            if (validPrimaryIndex < 0 || validPrimaryIndex >= allImages.length) {
                validPrimaryIndex = 0; // Auto-set first image as primary (MANDATORY)
                console.log("Auto-setting first image as primary (mandatory requirement)");
            }

            // Final validation: Ensure primary index is always valid
            if (validPrimaryIndex < 0 || validPrimaryIndex >= allImages.length) {
                validPrimaryIndex = 0; // Force first image as primary
            }

            // Show warning if user didn't explicitly set primary (but still allow save)
            if (allImages.length > 1 && primaryImageIndex < 0) {
                console.log("Primary image auto-set to first image (mandatory)");
            }

            // Prepare update/insert data
            // Generate product_id if not editing (auto-generate for new products)
            let productId = null;
            if (!editingUserProduct) {
                // Auto-generate product_id: use timestamp + random string
                productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            } else {
                // Keep existing product_id when editing
                productId = editingUserProduct.product_id || null;
            }

            const productData: any = {
                name: userProductFormData.name,
                price: userProductFormData.price,
                images: allImages.length > 0 ? allImages : null,
                primary_image_index: allImages.length > 0 ? validPrimaryIndex : 0,
                product_id: productId,
                category: userProductFormData.category || null,
            };

            // Add original_price if provided
            if (userProductFormData.originalPrice && userProductFormData.originalPrice.trim() !== "") {
                const originalPriceNum = parseFloat(userProductFormData.originalPrice);
                if (!isNaN(originalPriceNum)) {
                    productData.original_price = originalPriceNum;
                }
            }

            // Keep backward compatibility: set image field to primary image
            if (allImages.length > 0) {
                productData.image = allImages[validPrimaryIndex];
            } else if (singleImageUrl) {
                productData.image = singleImageUrl;
            }

            if (editingUserProduct) {
                // Update existing product - map to new schema
                const updateData: any = {
                    title: productData.name,
                    name: productData.name, // Keep for compatibility
                    price: productData.price,
                    price_per_day: productData.price ? parseFloat(productData.price) || null : null,
                    image: productData.image,
                    owner_user_id: editingUserProduct.user_id,
                };

                if (productData.category) {
                    updateData.category_id = productData.category;
                }

                const { error } = await supabase
                    .from("products")
                    .update(updateData)
                    .eq("id", editingUserProduct.id);

                if (error) throw error;
                showPopup("Product updated successfully!", "success");
            } else {
                // Add new product - map to new schema
                if (!selectedUserId) {
                    throw new Error("User ID is required. Please select a user first.");
                }

                const insertData: any = {
                    owner_user_id: selectedUserId,
                    title: productData.name,
                    name: productData.name, // Keep for compatibility
                    price: productData.price,
                    price_per_day: productData.price ? parseFloat(productData.price) || null : null,
                    image: productData.image,
                };

                if (productData.category) {
                    insertData.category_id = productData.category;
                }

                const { error } = await supabase
                    .from("products")
                    .insert([insertData]);

                if (error) throw error;
                showPopup("Product added successfully!", "success");
            }

            setIsUserProductModalOpen(false);
            setUserProductFormData({ name: "", price: "", image: "", originalPrice: "", category: "" });
            setUserProductImages([]);
            setPrimaryImageIndex(0);
            setUserProductImageFiles([]);
            setUserProductImagePreviews([]);
            setImageSizeInfo([]);
            setUserProductImageFile(null);
            setUserProductImagePreview("");
            setOriginalFileSize(0);
            setConvertedWebPSize(0);
            setConvertedWebPBlob(null);

            // If we came from manage products page, redirect back there
            const userIdParam = searchParams.get("userId");
            const wasEditing = editingUserProduct !== null;
            const userIdToRedirect = userIdParam || (editingUserProduct ? editingUserProduct.user_id : null);

            setEditingUserProduct(null);

            if (userIdToRedirect) {
                // Redirect back to manage products page (whether editing or adding)
                router.push(`/admin/manage-products?userId=${userIdToRedirect}`);
                return; // Don't reload products here, let the manage products page handle it
            } else {
                // Stay on admin page and reload products
                loadUserProducts();
            }
        } catch (error: any) {
            showPopup(error.message || "Unknown error", "error", "Error Saving Product");
            console.error("Error saving product:", error);
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Handle multiple image selection
    const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate all files
        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                showPopup("Please select only image files", "error", "Invalid File Type");
                e.target.value = "";
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showPopup(`Image "${file.name}" is too large (max 5MB)`, "error", "File Too Large");
                e.target.value = "";
                return;
            }
        }

        // Process all files in parallel
        const processPromises = files.map(async (file) => {
            const originalSize = file.size;

            try {
                // Convert to WebP
                const { blob, size: convertedSize } = await convertToWebPOptimized(file);

                // Create preview from original file
                const preview = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                });

                // Create File object from converted blob
                const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                    type: "image/webp",
                });

                return {
                    file: convertedFile,
                    preview,
                    sizeInfo: {
                        original: originalSize,
                        converted: convertedSize,
                        name: file.name,
                    },
                };
            } catch (error) {
                console.error("Error converting image:", error);
                // Fallback: use original file if conversion fails
                const preview = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                });

                return {
                    file,
                    preview,
                    sizeInfo: {
                        original: originalSize,
                        converted: originalSize,
                        name: file.name,
                    },
                };
            }
        });

        // Wait for all files to be processed
        const processed = await Promise.all(processPromises);

        // Extract results
        const newFiles = processed.map(p => p.file);
        const newPreviews = processed.map(p => p.preview);
        const newSizeInfo = processed.map(p => p.sizeInfo);

        // Update state
        setUserProductImageFiles(prev => [...prev, ...newFiles]);
        setUserProductImagePreviews(prev => {
            const allPreviews = [...prev, ...newPreviews];
            // Auto-set first image as primary if no primary is set (MANDATORY)
            if (userProductImages.length === 0 && prev.length === 0 && allPreviews.length > 0) {
                setPrimaryImageIndex(0);
            }
            return allPreviews;
        });
        setImageSizeInfo(prev => [...prev, ...newSizeInfo]);

        e.target.value = ""; // Clear input for next selection
    };

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    // Remove an image from the array
    const removeImage = (index: number, isNew: boolean) => {
        if (isNew) {
            // Removing from new previews
            const previewIndex = index - userProductImages.length;
            const newFiles = userProductImageFiles.filter((_, i) => i !== previewIndex);
            const newPreviews = userProductImagePreviews.filter((_, i) => i !== previewIndex);
            const newSizeInfo = imageSizeInfo.filter((_, i) => i !== previewIndex);

            setUserProductImageFiles(newFiles);
            setUserProductImagePreviews(newPreviews);
            setImageSizeInfo(newSizeInfo);

            // Adjust primary image index if needed
            if (primaryImageIndex === index) {
                // Primary was removed - set first available as primary
                setPrimaryImageIndex(0);
            } else if (primaryImageIndex > index) {
                setPrimaryImageIndex(prev => prev - 1);
            }
        } else {
            // Removing from existing images
            const newImages = userProductImages.filter((_, i) => i !== index);
            setUserProductImages(newImages);

            // Adjust primary image index if needed
            if (primaryImageIndex === index) {
                // Primary image was removed - set first remaining image as primary
                if (newImages.length > 0) {
                    setPrimaryImageIndex(0);
                } else if (userProductImagePreviews.length > 0) {
                    // If no existing images but has previews, set first preview as primary
                    setPrimaryImageIndex(0);
                } else {
                    setPrimaryImageIndex(0);
                }
            } else if (primaryImageIndex > index) {
                // Primary is after removed image - adjust index
                setPrimaryImageIndex(prev => prev - 1);
            }
        }
    };

    // Set primary image (favorite)
    const setPrimaryImage = (index: number) => {
        setPrimaryImageIndex(index);
    };

    const handleUserProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("File selected:", {
                name: file.name,
                type: file.type,
                size: file.size,
                sizeMB: (file.size / (1024 * 1024)).toFixed(2) + " MB"
            });

            // Validate file type
            if (!file.type.startsWith("image/")) {
                showPopup("Please select an image file", "error", "Invalid File Type");
                e.target.value = ""; // Clear the input
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showPopup("Image size should be less than 5MB", "error", "File Too Large");
                e.target.value = ""; // Clear the input
                return;
            }

            setUserProductImageFile(file);
            setOriginalFileSize(file.size);
            setConvertedWebPSize(0); // Reset converted size - will be updated after conversion
            setConvertedWebPBlob(null); // Reset blob
            setIsConvertingImage(true);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setUserProductImagePreview(e.target?.result as string);
            };
            reader.onerror = () => {
                console.error("Error reading file for preview");
                showPopup("Error reading image file", "error", "File Read Error");
                setIsConvertingImage(false);
            };
            reader.readAsDataURL(file);

            // Convert to WebP immediately to show the converted size
            try {
                const { blob: webpBlob, size: webpSize } = await convertToWebPOptimized(file);
                setConvertedWebPSize(webpSize);
                setConvertedWebPBlob(webpBlob); // Store the converted blob for later use
                const savedPercent = ((1 - webpSize / file.size) * 100).toFixed(1);
                console.log("Conversion complete:", {
                    original: file.size,
                    converted: webpSize,
                    saved: savedPercent + "%",
                    increased: webpSize > file.size
                });
            } catch (error) {
                console.error("Error converting image:", error);
                // Don't show alert here, just log - conversion will happen again on upload
            } finally {
                setIsConvertingImage(false);
            }
        } else {
            console.log("No file selected");
            setUserProductImageFile(null);
            setUserProductImagePreview("");
            setOriginalFileSize(0);
            setConvertedWebPSize(0);
            setConvertedWebPBlob(null);
            setIsConvertingImage(false);
        }
    };

    const handleDeleteUserProduct = async (id: string, name: string = "this product") => {
        setDeleteConfirmProduct({ id, name });
    };

    const confirmDeleteUserProduct = async () => {
        if (!deleteConfirmProduct) return;

        const { id, name } = deleteConfirmProduct;

        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;

            // Reload data
            await loadUserProducts();

            setDeleteConfirmProduct(null);
            showPopup(`Product "${name}" deleted successfully!`, "success");
        } catch (error: any) {
            showPopup(error.message || "Unknown error", "error", "Error Deleting Product");
            console.error("Error deleting product:", error);
            setDeleteConfirmProduct(null);
        }
    };

    const handleApproveProduct = (product: UserProduct) => {
        setApproveConfirmProduct({ id: product.id, name: product.name, status: product.status });
    };

    const confirmApproveProduct = async () => {
        if (!approveConfirmProduct) return;
        const { id, name, status } = approveConfirmProduct;

        try {
            const isDeactivation = status === 'pending_deactivation';
            const isReactivation = status === 'pending_reactivation';

            const updateData = isDeactivation
                ? { status: 'approved', is_active: false }
                : { status: 'approved', is_active: true };

            const { error } = await supabase
                .from("products")
                .update(updateData)
                .eq("id", id);

            if (error) throw error;

            let successMessage = "Product approved successfully!";
            if (isDeactivation) successMessage = "Deactivation approved!";
            if (isReactivation) successMessage = "Reactivation approved!";

            showPopup(successMessage, "success");
            loadUserProducts();
            setApproveConfirmProduct(null);
        } catch (error: any) {
            console.error("Error approving product:", error);
            showPopup(`Error approving product: ${error.message}`, "error");
            setApproveConfirmProduct(null);
        }
    };

    const handleRejectProduct = (product: UserProduct) => {
        setRejectConfirmProduct(product);
        setRejectReason("");
    };

    const confirmRejectProduct = async () => {
        if (!rejectConfirmProduct) return;

        const product = rejectConfirmProduct;
        const isDeactivation = product.status === 'pending_deactivation';
        const isReactivation = product.status === 'pending_reactivation';

        try {
            let updateData;
            if (isDeactivation) {
                // If deactivation rejected -> it stays approved and active (Live)
                updateData = { status: 'approved', admin_note: rejectReason, is_active: true };
            } else if (isReactivation) {
                // If reactivation rejected -> it stays approved but inactive (Deactivated)
                updateData = { status: 'approved', admin_note: rejectReason, is_active: false };
            } else {
                // If new listing rejected -> it returns to draft so user can edit and resubmit
                updateData = { status: 'draft', admin_note: rejectReason, is_active: false };
            }

            const { error } = await supabase
                .from("products")
                .update(updateData)
                .eq("id", product.id);

            if (error) throw error;

            let successMessage = "Product rejected successfully!";
            if (isDeactivation) successMessage = "Deactivation request rejected!";
            if (isReactivation) successMessage = "Reactivation request rejected!";

            showPopup(successMessage, "success");
            loadUserProducts();
            setRejectConfirmProduct(null);
            setRejectReason("");
        } catch (error: any) {
            console.error("Error rejecting product:", error);
            showPopup(`Error rejecting product: ${error.message}`, "error");
            setRejectConfirmProduct(null);
        }
    };

    const handleLogout = async () => {
        try {
            // Sign out from Supabase Auth
            await supabase.auth.signOut();

            // Clear localStorage
            localStorage.removeItem("adminEmail");

            // Reset authentication state
            setIsAuthenticated(false);

            // Redirect to home page
            router.push("/");
        } catch (error) {
            console.error("Error logging out:", error);
            // Still clear local storage and redirect even if signOut fails
            localStorage.removeItem("adminEmail");
            setIsAuthenticated(false);
            router.push("/");
        }
    };

    // Calculate total products (only user products)
    const totalProducts = userProducts.length;

    // Calculate user statistics
    const totalUsers = users.length;
    const sellerUserIds = new Set(userProducts.map(p => p.user_id));
    const sellerUsersCount = users.filter(u => sellerUserIds.has(u.id)).length;
    const visitorUsersCount = totalUsers - sellerUsersCount;

    // Show loading state
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show login form if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-none shadow-lg p-8 max-w-md w-full">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Admin Login</h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="admin@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="Enter password"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setAdminEmail("anokhireet@gmail.com");
                                setAdminPassword("Reet@1432@1402");
                            }}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors mb-2 text-sm"
                        >
                            Auto Fill Credentials
                        </button>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity"
                        >
                            Login
                        </button>
                    </form>
                    <p className="text-sm text-gray-500 mt-4 text-center">
                        Only admin accounts can access this page
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-none text-sm text-blue-700">
                        <p className="font-semibold mb-2">Default Admin Credentials:</p>
                        <p>Email: anokhireet@gmail.com</p>
                        <p>Password: Reet@1432@1402</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Custom Admin Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40" id="admin-header" style={{ height: '4rem' }}>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold uppercase tracking-wide text-gray-900">Admin Panel</h1>
                            <span className="text-sm text-gray-500">Anokhi Reet</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                {adminEmail || "Admin"}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pb-6">
                <div className="flex flex-col lg:flex-row gap-6 max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Vertical Sidebar */}
                    <aside className="w-full lg:w-56 flex-shrink-0" id="admin-sidebar">
                        <div className="bg-white rounded-none border border-gray-200 overflow-hidden sticky self-start max-h-[calc(100vh-7rem)] flex flex-col" id="admin-sidebar-container" style={{ top: 'calc(4rem + 2rem)', position: 'sticky' }}>
                            {/* Sidebar Header */}
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
                                <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                                <p className="text-xs text-gray-600 mt-1">Navigation</p>
                            </div>

                            {/* Navigation Menu */}
                            <nav className="p-2 flex-1 overflow-y-auto min-h-0">
                                <button
                                    onClick={() => {
                                        // Prevent scroll and maintain sidebar position
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("dashboard");
                                        localStorage.setItem("adminActiveTab", "dashboard");
                                        router.replace("/admin");
                                        // Maintain scroll position to prevent sidebar shift
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "dashboard"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    <span>Dashboard</span>
                                </button>

                                <button
                                    onClick={() => {
                                        // Prevent scroll and maintain sidebar position
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("products");
                                        localStorage.setItem("adminActiveTab", "products");
                                        router.replace("/admin?tab=products");
                                        // Maintain scroll position to prevent sidebar shift
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "products"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                                    </svg>
                                    <span>Products</span>
                                </button>

                                <button
                                    onClick={() => {
                                        // Prevent scroll and maintain sidebar position
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("requests");
                                        localStorage.setItem("adminActiveTab", "requests");
                                        router.replace("/admin?tab=requests");
                                        // Maintain scroll position to prevent sidebar shift
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "requests"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <span>Requests</span>
                                    {(userProducts.filter(p => p.status === 'pending' || p.status === 'pending_deactivation' || p.status === 'pending_reactivation').length > 0) && (
                                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === "requests" ? "bg-white text-black" : "bg-red-500 text-white"}`}>
                                            {userProducts.filter(p => p.status === 'pending' || p.status === 'pending_deactivation' || p.status === 'pending_reactivation').length}
                                        </span>
                                    )}
                                </button>


                                <button
                                    onClick={() => {
                                        // Prevent scroll and maintain sidebar position
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("users");
                                        localStorage.setItem("adminActiveTab", "users");
                                        router.replace("/admin?tab=users");
                                        // Maintain scroll position to prevent sidebar shift
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "users"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    <span>Users</span>
                                </button>

                                <button
                                    onClick={() => {
                                        // Prevent scroll and maintain sidebar position
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("featured");
                                        localStorage.setItem("adminActiveTab", "featured");
                                        router.replace("/admin?tab=featured");
                                        // Maintain scroll position to prevent sidebar shift
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "featured"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    <span>Categories</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("hero");
                                        localStorage.setItem("adminActiveTab", "hero");
                                        router.replace("/admin?tab=hero");
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "hero"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="9" x2="21" y2="9"></line>
                                        <line x1="9" y1="21" x2="9" y2="9"></line>
                                    </svg>
                                    <span>Hero Section</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("contact");
                                        localStorage.setItem("adminActiveTab", "contact");
                                        router.replace("/admin?tab=contact");
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "contact"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    <span>Messages</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const currentScrollY = window.scrollY;
                                        setActiveTab("reports");
                                        localStorage.setItem("adminActiveTab", "reports");
                                        router.replace("/admin?tab=reports");
                                        requestAnimationFrame(() => {
                                            window.scrollTo(0, currentScrollY);
                                        });
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-normal transition-all duration-200 rounded-none mb-1 ${activeTab === "reports"
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                        <line x1="4" y1="22" x2="4" y2="15"></line>
                                    </svg>
                                    <span>Reports</span>
                                </button>
                            </nav>

                            {/* Logout Button */}
                            <div className="p-4 border-t border-gray-200 flex-shrink-0">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">

                        {/* Categories Tab - Removed: Now using 5 facet types instead */}
                        {/* Removed categories tab - using facets instead */}
                        {false && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-none border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-semibold uppercase tracking-wide text-gray-900">Featured Categories</h2>
                                            <p className="text-sm text-gray-600 mt-1">Pin categories to display them in FEATURED CATEGORIES on the home page</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingCategory(null);
                                                setCategoryFormData({ name: "", image_url: "" });
                                                setCategoryImageFile(null);
                                                setCategoryImagePreview("");
                                                setIsCategoryModalOpen(true);
                                            }}
                                            className="px-6 py-3 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                            Add Category
                                        </button>
                                    </div>

                                    {categories.length === 0 ? (
                                        <div className="text-center py-16 bg-gray-50 rounded-none border-2 border-dashed border-gray-300">
                                            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-900 mb-2">No categories found</p>
                                            <p className="text-sm text-gray-600 mb-6">Add your first category to display on the home page</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {categories.map((category, index) => (
                                                <div
                                                    key={category.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, category.id)}
                                                    onDragOver={(e) => handleDragOver(e, category.id)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, category.id)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`flex items-center gap-4 p-4 rounded-none border transition-all cursor-move relative ${draggedCategoryId === category.id
                                                        ? "opacity-50 border-gray-200 bg-gray-50"
                                                        : dragOverCategoryId === category.id
                                                            ? "border-gray-200 bg-gray-50"
                                                            : "bg-gray-50 border-gray-200 hover:shadow-md"
                                                        }`}
                                                    style={dragOverCategoryId === category.id ? {
                                                        borderLeft: '4px solid #3b82f6'
                                                    } : {}}
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="text-gray-400 font-semibold text-lg w-8 text-center">{index + 1}</div>
                                                            <svg
                                                                className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 8h16M4 16h16" />
                                                            </svg>
                                                        </div>
                                                        <div className="relative w-20 h-20 bg-gray-200 rounded-none overflow-hidden flex-shrink-0">
                                                            {(() => {
                                                                const imageUrl = category?.image_url;
                                                                const isValidUrl = imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0 && imageUrl !== 'null' && imageUrl !== 'undefined';

                                                                return isValidUrl ? (
                                                                    <Image
                                                                        src={imageUrl.trim()}
                                                                        alt={category.name || 'Category image'}
                                                                        fill
                                                                        className="object-cover"
                                                                        unoptimized
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                        No Image
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        // Navigate to products tab with category filter
                                                                        setActiveTab("products");
                                                                        setFilterCategory(category.id);
                                                                        localStorage.setItem("adminActiveTab", "products");
                                                                        router.push(`/admin?tab=products&category=${category.id}`);
                                                                    }}
                                                                    className="text-left hover:underline"
                                                                >
                                                                    <h3 className="font-semibold text-gray-900 truncate hover:text-black">
                                                                        {category.name || "Unnamed Category"}
                                                                    </h3>
                                                                </button>
                                                                {category.is_featured && (
                                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-none flex items-center gap-1">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                        </svg>
                                                                        Featured
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 truncate">{category.link_url}</p>
                                                            <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline"
                                                                onClick={() => {
                                                                    setActiveTab("products");
                                                                    setFilterCategory(category.id);
                                                                    localStorage.setItem("adminActiveTab", "products");
                                                                    router.push(`/admin?tab=products&category=${category.id}`);
                                                                }}
                                                            >
                                                                View {userProducts.filter(p => {
                                                                    // Check if product has this category
                                                                    // 1. Check category_ids array (from product_categories)
                                                                    if ((p as any).category_ids && Array.isArray((p as any).category_ids)) {
                                                                        return (p as any).category_ids.includes(category.id);
                                                                    }
                                                                    // 2. Check if category name is in the category string (comma-separated)
                                                                    if (p.category && typeof p.category === 'string') {
                                                                        const categoryNames = p.category.split(',').map(c => c.trim());
                                                                        return categoryNames.includes(category.name) || categoryNames.includes(category.id);
                                                                    }
                                                                    // 3. Fallback: exact match
                                                                    return p.category === category.name || p.category === category.id;
                                                                }).length} products →
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleCategoryFeatured(category.id, category.is_featured || false)}
                                                            className={`p-2 rounded-none transition-colors ${category.is_featured
                                                                ? "text-yellow-600 hover:bg-yellow-50 bg-yellow-50"
                                                                : "text-gray-400 hover:text-yellow-600 hover:bg-gray-100"
                                                                }`}
                                                            title={category.is_featured ? "Unpin from Featured Categories" : "Pin to Featured Categories"}
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill={category.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1">
                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-none whitespace-nowrap">
                                                            Drag to reorder
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setEditingCategory(category);
                                                                setCategoryFormData({
                                                                    name: category.name,
                                                                    image_url: category.image_url
                                                                });
                                                                setCategoryImageFile(null);
                                                                setCategoryImagePreview("");
                                                                setIsCategoryModalOpen(true);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category.id, category.name)}
                                                            className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dashboard Tab */}
                        {activeTab === "dashboard" && (
                            <div className="space-y-6">
                                {/* Website Toggle Card */}
                                <div className="bg-white p-6 rounded-none border border-gray-200 hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Website Visibility</h3>
                                            <p className="text-sm text-gray-600">
                                                {websiteEnabled
                                                    ? "Coming soon page is active (website hidden)"
                                                    : "Website is currently visible to everyone"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm font-medium ${websiteEnabled ? 'text-green-600' : 'text-red-600'}`}>
                                                {websiteEnabled ? 'ON' : 'OFF'}
                                            </span>
                                            <button
                                                onClick={toggleWebsite}
                                                disabled={isTogglingWebsite}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-none transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${websiteEnabled ? 'bg-black' : 'bg-gray-300'
                                                    } ${isTogglingWebsite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-none bg-white transition-transform ${websiteEnabled ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-none border border-gray-200 hover:shadow-lg transition-all duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Products</h3>
                                            <div className="p-3 bg-blue-100 rounded-none">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-600">
                                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-semibold text-gray-900">{totalProducts}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {userProducts.length} user products
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 rounded-none border border-gray-200 hover:shadow-lg transition-all duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Users</h3>
                                            <div className="p-3 bg-purple-100 rounded-none">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-purple-600">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="9" cy="7" r="4"></circle>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-semibold text-gray-900">{totalUsers}</p>
                                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                                            <p>• Seller users: <span className="font-semibold text-gray-700">{sellerUsersCount}</span></p>
                                            <p>• Visitor users: <span className="font-semibold text-gray-700">{visitorUsersCount}</span></p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-none border border-gray-200 hover:shadow-lg transition-all duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Categories</h3>
                                            <div className="p-3 bg-green-100 rounded-none">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-green-600">
                                                    <rect x="3" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="14" width="7" height="7"></rect>
                                                    <rect x="3" y="14" width="7" height="7"></rect>
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-semibold text-gray-900">
                                            {productTypes.length + occasions.length + colors.length + materials.length + cities.length}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {productTypes.filter(pt => pt.is_featured).length +
                                                occasions.filter(oc => oc.is_featured).length} featured
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 rounded-none border border-gray-200 hover:shadow-lg transition-all duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Views</h3>
                                            <div className="p-3 bg-indigo-100 rounded-none">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-600">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-semibold text-gray-900">{totalViews.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            All-time product views (includes deleted)
                                        </p>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Recent Products */}
                                    <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-sm font-semibold text-gray-900">Recent Products</h3>
                                            <p className="text-xs text-gray-500 mt-1">Latest 5 products added</p>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {userProducts
                                                .filter(p => p.created_at)
                                                .sort((a, b) => {
                                                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                                                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                                                    return dateB - dateA;
                                                })
                                                .slice(0, 5)
                                                .map((product, index) => (
                                                    <div key={index} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-none overflow-hidden">
                                                                {product.image && (
                                                                    <Image
                                                                        src={product.image}
                                                                        alt={product.name}
                                                                        width={48}
                                                                        height={48}
                                                                        className="w-full h-full object-cover"
                                                                        unoptimized
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {product.created_at ? new Date(product.created_at).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    }) : 'Date not available'}
                                                                </p>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                <span className="text-sm font-semibold text-gray-700">{product.price}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {userProducts.length === 0 && (
                                                <div className="px-6 py-8 text-center">
                                                    <p className="text-sm text-gray-500">No products yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Users */}
                                    <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-sm font-semibold text-gray-900">Recent Users</h3>
                                            <p className="text-xs text-gray-500 mt-1">Latest 5 users registered</p>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {users
                                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .slice(0, 5)
                                                .map((user) => {
                                                    const userProductCount = userProducts.filter(p => p.user_id === user.id).length;
                                                    return (
                                                        <div key={user.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        {new Date(user.created_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                                <div className="flex-shrink-0 ml-4 text-right">
                                                                    <p className="text-sm font-semibold text-gray-700">{userProductCount}</p>
                                                                    <p className="text-xs text-gray-500">products</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            {users.length === 0 && (
                                                <div className="px-6 py-8 text-center">
                                                    <p className="text-sm text-gray-500">No users yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Products Tab */}
                        {activeTab === "products" && (() => {
                            // Show loading state if products haven't loaded yet
                            if (userProducts.length === 0 && !isCheckingAuth) {
                                return (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-none border border-gray-200 p-8 text-center">
                                            <p className="text-gray-500">Loading products...</p>
                                        </div>
                                    </div>
                                );
                            }

                            // Get all unique categories
                            const allCategories = Array.from(new Set([
                                ...userProducts.map(p => p.category).filter(Boolean)
                            ])) as string[];

                            // Filter products (only user products)
                            let filteredUserProducts = userProducts.map(p => ({ ...p, type: 'user' as const }));

                            // Apply user filter
                            if (filterUserId !== 'all') {
                                filteredUserProducts = filteredUserProducts.filter(p => p.user_id === filterUserId);
                            }

                            // Apply category/facet filter - check if product belongs to selected category or facet
                            if (filterCategory !== 'all') {
                                filteredUserProducts = filteredUserProducts.filter(p => {
                                    // Check if filterCategory is a facet (product type, occasion, color, material, or city)
                                    const facets = (p.category && typeof p.category === 'object' && !Array.isArray(p.category))
                                        ? p.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                        : null;

                                    if (facets) {
                                        // Check product types
                                        const productType = productTypes.find(pt => pt.id === filterCategory);
                                        if (productType && facets.productTypes.includes(productType.name)) {
                                            return true;
                                        }

                                        // Check occasions
                                        const occasion = occasions.find(oc => oc.id === filterCategory);
                                        if (occasion && facets.occasions.includes(occasion.name)) {
                                            return true;
                                        }

                                        // Check colors
                                        const color = colors.find(c => c.id === filterCategory);
                                        if (color && facets.colors.includes(color.name)) {
                                            return true;
                                        }

                                        // Check materials
                                        const material = materials.find(m => m.id === filterCategory);
                                        if (material && facets.materials.includes(material.name)) {
                                            return true;
                                        }

                                        // Check cities
                                        const city = cities.find(c => c.id === filterCategory);
                                        if (city && facets.cities.includes(city.name)) {
                                            return true;
                                        }
                                    }

                                    // Fallback: check category_ids array (from product_categories) or legacy category field
                                    if ((p as any).category_ids && Array.isArray((p as any).category_ids)) {
                                        return (p as any).category_ids.includes(filterCategory);
                                    }
                                    // Fallback: check category string (legacy or display)
                                    if (p.category && typeof p.category === 'string') {
                                        const selectedCategory = categories.find(c => c.id === filterCategory);
                                        if (selectedCategory) {
                                            return p.category.includes(selectedCategory.name) ||
                                                p.category === filterCategory;
                                        }
                                    }
                                    return false;
                                });
                            }

                            // Apply search query
                            if (searchQuery.trim()) {
                                const query = searchQuery.toLowerCase();
                                filteredUserProducts = filteredUserProducts.filter(p => {
                                    const facets = (p.category && typeof p.category === 'object' && !Array.isArray(p.category))
                                        ? p.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                        : null;

                                    const facetText = facets
                                        ? `${facets.productTypes.join(" ")} ${facets.occasions.join(" ")} ${facets.colors.join(" ")} ${facets.materials.join(" ")} ${facets.cities.join(" ")}`.toLowerCase()
                                        : "";

                                    return p.name.toLowerCase().includes(query) ||
                                        (p.product_id && p.product_id.toLowerCase().includes(query)) ||
                                        facetText.includes(query) ||
                                        users.find(u => u.id === p.user_id)?.name.toLowerCase().includes(query) ||
                                        users.find(u => u.id === p.user_id)?.phone.includes(query);
                                });
                            }

                            // Apply column-specific filters
                            if (columnFilters.name) {
                                const query = columnFilters.name.toLowerCase();
                                filteredUserProducts = filteredUserProducts.filter(p => p.name.toLowerCase().includes(query));
                            }
                            if (columnFilters.type && columnFilters.type === 'public') {
                                filteredUserProducts = [];
                            }
                            if (columnFilters.user) {
                                filteredUserProducts = filteredUserProducts.filter(p => {
                                    const owner = users.find(u => u.id === p.user_id);
                                    return owner && (
                                        owner.name.toLowerCase().includes(columnFilters.user!.toLowerCase()) ||
                                        owner.phone.includes(columnFilters.user!)
                                    );
                                });
                            }
                            if (columnFilters.category) {
                                filteredUserProducts = filteredUserProducts.filter(p => {
                                    const facets = (p.category && typeof p.category === 'object' && !Array.isArray(p.category))
                                        ? p.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                        : null;

                                    if (!facets) return false;

                                    const allFacetNames = [
                                        ...facets.productTypes,
                                        ...facets.occasions,
                                        ...facets.colors,
                                        ...facets.materials,
                                        ...facets.cities
                                    ];

                                    return allFacetNames.some(name => name.toLowerCase().includes(columnFilters.category!.toLowerCase()));
                                });
                            }
                            if (columnFilters.productId) {
                                const query = columnFilters.productId.toLowerCase();
                                filteredUserProducts = filteredUserProducts.filter(p =>
                                    (p.product_id && p.product_id.toLowerCase().includes(query)) ||
                                    p.id.toString().includes(query)
                                );
                            }
                            if (columnFilters.price) {
                                const query = columnFilters.price.toLowerCase();
                                filteredUserProducts = filteredUserProducts.filter(p => p.price.toLowerCase().includes(query));
                            }

                            // Sort (only user products)
                            let allFilteredProducts = [...filteredUserProducts];

                            // Apply sorting
                            if (sortColumn) {
                                allFilteredProducts.sort((a, b) => {
                                    let aVal: any;
                                    let bVal: any;

                                    switch (sortColumn) {
                                        case 'name':
                                            aVal = a.name?.toLowerCase() || '';
                                            bVal = b.name?.toLowerCase() || '';
                                            break;
                                        case 'type':
                                            aVal = a.type || '';
                                            bVal = b.type || '';
                                            break;
                                        case 'category':
                                            // Sort by facets - use first facet name found
                                            const aFacets = (a.category && typeof a.category === 'object' && !Array.isArray(a.category))
                                                ? a.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                                : null;
                                            const bFacets = (b.category && typeof b.category === 'object' && !Array.isArray(b.category))
                                                ? b.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                                : null;

                                            const aFacetText = aFacets
                                                ? `${aFacets.productTypes.join(" ")} ${aFacets.occasions.join(" ")} ${aFacets.colors.join(" ")} ${aFacets.materials.join(" ")} ${aFacets.cities.join(" ")}`.toLowerCase()
                                                : '';
                                            const bFacetText = bFacets
                                                ? `${bFacets.productTypes.join(" ")} ${bFacets.occasions.join(" ")} ${bFacets.colors.join(" ")} ${bFacets.materials.join(" ")} ${bFacets.cities.join(" ")}`.toLowerCase()
                                                : '';

                                            aVal = aFacetText;
                                            bVal = bFacetText;
                                            break;
                                        case 'productId':
                                            aVal = ('productId' in a ? a.productId : 'product_id' in a ? a.product_id : a.id)?.toString() || '';
                                            bVal = ('productId' in b ? b.productId : 'product_id' in b ? b.product_id : b.id)?.toString() || '';
                                            break;
                                        case 'price':
                                            // Extract numeric value from price string
                                            aVal = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
                                            bVal = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
                                            break;
                                        case 'created':
                                            aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
                                            bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
                                            break;
                                        default:
                                            return 0;
                                    }

                                    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                                    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                                    return 0;
                                });
                            }

                            const displayCount = allFilteredProducts.length;

                            return (
                                <div className="space-y-6">
                                    {/* All Products Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h2 className="text-xl font-semibold uppercase tracking-wide text-gray-900">All Products</h2>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Showing {displayCount} of {totalProducts} products
                                                </p>
                                            </div>
                                        </div>

                                        {/* Filters */}
                                        <div className="bg-white rounded-none border border-gray-200 p-4 mb-6">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                {/* Search */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search by name, ID, category..."
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                                    />
                                                </div>


                                                {/* User Filter */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
                                                    <select
                                                        value={filterUserId}
                                                        onChange={(e) => setFilterUserId(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                                        disabled={filterType === 'all'}
                                                    >
                                                        <option value="all">All Users</option>
                                                        {users.map(user => (
                                                            <option key={user.id} value={user.id}>{user.name} ({user.phone})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Facet Filter - Note: This is a simplified filter, full facet filtering should be done via dedicated filter UI */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Facet</label>
                                                    <select
                                                        value={filterCategory}
                                                        onChange={(e) => setFilterCategory(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                                    >
                                                        <option value="all">All Facets</option>
                                                        <optgroup label="Categories">
                                                            {productTypes.map(pt => (
                                                                <option key={pt.id} value={pt.id}>{pt.name}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Occasions">
                                                            {occasions.map(oc => (
                                                                <option key={oc.id} value={oc.id}>{oc.name}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Colors">
                                                            {colors.map(c => (
                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Materials">
                                                            {materials.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Cities">
                                                            {cities.map(city => (
                                                                <option key={city.id} value={city.id}>{city.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Clear Filters */}
                                            {(filterType !== 'all' || filterUserId !== 'all' || filterCategory !== 'all' || searchQuery.trim() || Object.keys(columnFilters).length > 0) && (
                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setFilterType('all');
                                                            setFilterUserId('all');
                                                            setFilterCategory('all');
                                                            setSearchQuery('');
                                                            setColumnFilters({});
                                                            setSortColumn('');
                                                            setSortDirection('asc');
                                                        }}
                                                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                                            <div className="overflow-x-auto hidden md:block">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Image
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            if (sortColumn === 'name') {
                                                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                                            } else {
                                                                                setSortColumn('name');
                                                                                setSortDirection('asc');
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                                    >
                                                                        Name
                                                                        {sortColumn === 'name' && (
                                                                            <svg className={`w-3 h-3 ${sortDirection === 'asc' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 15l7-7 7 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenFilterColumn(openFilterColumn === 'name' ? null : 'name');
                                                                        }}
                                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-none hover:bg-gray-200 ${columnFilters.name ? 'opacity-100 text-blue-600' : ''}`}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                {openFilterColumn === 'name' && (
                                                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg z-50 p-3 min-w-[200px]">
                                                                        <input
                                                                            type="text"
                                                                            value={columnFilters.name || ''}
                                                                            onChange={(e) => setColumnFilters({ ...columnFilters, name: e.target.value })}
                                                                            placeholder="Filter by name..."
                                                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex justify-end gap-2 mt-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newFilters = { ...columnFilters };
                                                                                    delete newFilters.name;
                                                                                    setColumnFilters(newFilters);
                                                                                    setOpenFilterColumn(null);
                                                                                }}
                                                                                className="text-xs text-gray-600 hover:text-gray-900"
                                                                            >
                                                                                Clear
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                                                                <div className="flex items-center gap-2">
                                                                    <span>Owner/User</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenFilterColumn(openFilterColumn === 'user' ? null : 'user');
                                                                        }}
                                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-none hover:bg-gray-200 ${columnFilters.user ? 'opacity-100 text-blue-600' : ''}`}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                {openFilterColumn === 'user' && (
                                                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg z-50 p-3 min-w-[200px] filter-dropdown-container">
                                                                        <input
                                                                            type="text"
                                                                            value={columnFilters.user || ''}
                                                                            onChange={(e) => setColumnFilters({ ...columnFilters, user: e.target.value })}
                                                                            placeholder="Filter by user name/phone..."
                                                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex justify-end gap-2 mt-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newFilters = { ...columnFilters };
                                                                                    delete newFilters.user;
                                                                                    setColumnFilters(newFilters);
                                                                                    setOpenFilterColumn(null);
                                                                                }}
                                                                                className="text-xs text-gray-600 hover:text-gray-900"
                                                                            >
                                                                                Clear
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Types
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Occasions
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Colors
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Materials
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Cities
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            if (sortColumn === 'productId') {
                                                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                                            } else {
                                                                                setSortColumn('productId');
                                                                                setSortDirection('asc');
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                                    >
                                                                        Product ID
                                                                        {sortColumn === 'productId' && (
                                                                            <svg className={`w-3 h-3 ${sortDirection === 'asc' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 15l7-7 7 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenFilterColumn(openFilterColumn === 'productId' ? null : 'productId');
                                                                        }}
                                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-none hover:bg-gray-200 ${columnFilters.productId ? 'opacity-100 text-blue-600' : ''}`}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                {openFilterColumn === 'productId' && (
                                                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg z-50 p-3 min-w-[200px] filter-dropdown-container">
                                                                        <input
                                                                            type="text"
                                                                            value={columnFilters.productId || ''}
                                                                            onChange={(e) => setColumnFilters({ ...columnFilters, productId: e.target.value })}
                                                                            placeholder="Filter by product ID..."
                                                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex justify-end gap-2 mt-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newFilters = { ...columnFilters };
                                                                                    delete newFilters.productId;
                                                                                    setColumnFilters(newFilters);
                                                                                    setOpenFilterColumn(null);
                                                                                }}
                                                                                className="text-xs text-gray-600 hover:text-gray-900"
                                                                            >
                                                                                Clear
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            if (sortColumn === 'price') {
                                                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                                            } else {
                                                                                setSortColumn('price');
                                                                                setSortDirection('asc');
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                                    >
                                                                        Price
                                                                        {sortColumn === 'price' && (
                                                                            <svg className={`w-3 h-3 ${sortDirection === 'asc' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 15l7-7 7 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenFilterColumn(openFilterColumn === 'price' ? null : 'price');
                                                                        }}
                                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-none hover:bg-gray-200 ${columnFilters.price ? 'opacity-100 text-blue-600' : ''}`}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                {openFilterColumn === 'price' && (
                                                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg z-50 p-3 min-w-[200px] filter-dropdown-container">
                                                                        <input
                                                                            type="text"
                                                                            value={columnFilters.price || ''}
                                                                            onChange={(e) => setColumnFilters({ ...columnFilters, price: e.target.value })}
                                                                            placeholder="Filter by price..."
                                                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex justify-end gap-2 mt-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newFilters = { ...columnFilters };
                                                                                    delete newFilters.price;
                                                                                    setColumnFilters(newFilters);
                                                                                    setOpenFilterColumn(null);
                                                                                }}
                                                                                className="text-xs text-gray-600 hover:text-gray-900"
                                                                            >
                                                                                Clear
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Images
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            if (sortColumn === 'created') {
                                                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                                            } else {
                                                                                setSortColumn('created');
                                                                                setSortDirection('asc');
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                                                    >
                                                                        Created
                                                                        {sortColumn === 'created' && (
                                                                            <svg className={`w-3 h-3 ${sortDirection === 'asc' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 15l7-7 7 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {/* Combined Products (sorted) */}
                                                        {allFilteredProducts.map((product) => {
                                                            const owner = users.find(u => u.id === (product as any).user_id);
                                                            const primaryImage = (product as any).images && Array.isArray((product as any).images) && (product as any).images.length > 0
                                                                ? ((product as any).primary_image_index !== undefined && (product as any).primary_image_index >= 0 && (product as any).primary_image_index < (product as any).images.length
                                                                    ? (product as any).images[(product as any).primary_image_index]
                                                                    : (product as any).images[0])
                                                                : (product as any).image;
                                                            const imageCount = (product as any).images && Array.isArray((product as any).images)
                                                                ? (product as any).images.length
                                                                : ((product as any).image ? 1 : 0);
                                                            const facets = (product.category && typeof product.category === 'object' && !Array.isArray(product.category))
                                                                ? product.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                                                : { productTypes: [], occasions: [], colors: [], materials: [], cities: [] };

                                                            return (
                                                                <tr key={`user-${product.id}`} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="relative w-16 h-20 bg-gray-100 rounded-none overflow-hidden">
                                                                            {primaryImage && (
                                                                                <Image
                                                                                    src={primaryImage}
                                                                                    alt={product.name}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                    unoptimized
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                                            {product.name}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <>
                                                                            <div className="text-sm font-medium text-gray-700">
                                                                                {owner ? owner.name : 'Unknown'}
                                                                            </div>
                                                                            {owner && (
                                                                                <>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {owner.phone}
                                                                                    </div>
                                                                                    {owner.email && (
                                                                                        <div className="text-xs text-gray-400">
                                                                                            {owner.email}
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </>
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
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-500">
                                                                            {(product as any).product_id || `#${product.id}`}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {product.price}
                                                                        </div>
                                                                        {(product as any).original_price && (
                                                                            <div className="text-xs text-gray-400">
                                                                                {typeof (product as any).original_price === 'number'
                                                                                    ? `₹${(product as any).original_price}`
                                                                                    : (product as any).original_price}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-500">
                                                                            {imageCount}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-xs text-gray-500">
                                                                            {product.created_at ? new Date(product.created_at).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                year: 'numeric'
                                                                            }) : '-'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex flex-col">
                                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${product.status === 'approved'
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : product.status === 'rejected'
                                                                                    ? 'bg-red-100 text-red-800'
                                                                                    : product.status === 'pending_deactivation'
                                                                                        ? 'bg-orange-100 text-orange-800'
                                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                                }`}>
                                                                                {product.status === 'pending_deactivation' ? 'Deactivation Request' : product.status ? capitalizeFirstLetter(product.status) : 'Approved'}
                                                                            </span>
                                                                            {product.status === 'rejected' && product.admin_note && (
                                                                                <span className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={product.admin_note}>
                                                                                    Note: {product.admin_note}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                        {(product.status === 'pending' || product.status === 'pending_deactivation') && (
                                                                            <div className="flex gap-2 mb-2">
                                                                                <button
                                                                                    onClick={() => handleApproveProduct(product)}
                                                                                    className={`text-white px-2 py-1 rounded-none text-xs transition ${product.status === 'pending_deactivation'
                                                                                        ? 'bg-orange-600 hover:bg-orange-700'
                                                                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                                                                        }`}
                                                                                >
                                                                                    {product.status === 'pending_deactivation' ? 'Approve Deactivate' : 'Approve'}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleRejectProduct(product)}
                                                                                    className="text-red-600 bg-white border border-red-200 hover:bg-red-50 px-2 py-1 rounded-none text-xs transition"
                                                                                >
                                                                                    Reject
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleEditUserProduct(product as any)}
                                                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteUserProduct((product as any).id, (product as any).name)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {allFilteredProducts.length === 0 && (
                                                            <tr>
                                                                <td colSpan={13} className="px-6 py-12 text-center">
                                                                    <div className="text-gray-500">
                                                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                        </svg>
                                                                        <p className="text-lg font-medium">No products found</p>
                                                                        <p className="text-sm mt-1">Add your first product to get started</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Card View for Products */}
                                            <div className="md:hidden space-y-4 p-4">
                                                {allFilteredProducts.map((product) => {
                                                    const owner = users.find(u => u.id === (product as any).user_id);
                                                    const primaryImage = (product as any).images && Array.isArray((product as any).images) && (product as any).images.length > 0
                                                        ? ((product as any).primary_image_index !== undefined && (product as any).primary_image_index >= 0 && (product as any).primary_image_index < (product as any).images.length
                                                            ? (product as any).images[(product as any).primary_image_index]
                                                            : (product as any).images[0])
                                                        : (product as any).image;

                                                    return (
                                                        <div key={`mobile-prod-${product.id}`} className="bg-white border border-gray-200 rounded-none overflow-hidden relative shadow-sm">
                                                            <div className="flex p-3 gap-3">
                                                                {/* Product Image */}
                                                                <div className="w-20 h-24 bg-gray-100 flex-shrink-0 relative overflow-hidden rounded-none">
                                                                    {primaryImage && (
                                                                        <Image
                                                                            src={primaryImage}
                                                                            alt={product.name}
                                                                            fill
                                                                            className="object-cover"
                                                                            unoptimized
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Details */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                                                                            <div className="text-sm font-medium text-gray-900">{product.price}</div>
                                                                        </div>

                                                                        {/* 3-Dot Action Menu */}
                                                                        <div className="relative ml-2">
                                                                            <button
                                                                                onClick={() => setActiveActionId(activeActionId === product.id ? null : product.id)}
                                                                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                                            >
                                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                                                                    <circle cx="12" cy="12" r="1" />
                                                                                    <circle cx="12" cy="5" r="1" />
                                                                                    <circle cx="12" cy="19" r="1" />
                                                                                </svg>
                                                                            </button>

                                                                            {activeActionId === product.id && (
                                                                                <>
                                                                                    <div
                                                                                        className="fixed inset-0 z-40"
                                                                                        onClick={() => setActiveActionId(null)}
                                                                                    ></div>
                                                                                    <div className="absolute right-0 top-6 w-48 bg-white border border-gray-200 shadow-xl rounded-none z-50">
                                                                                        <div className="py-1">
                                                                                            {(product.status === 'pending' || product.status === 'pending_deactivation') && (
                                                                                                <>
                                                                                                    <button
                                                                                                        onClick={() => {
                                                                                                            handleApproveProduct(product);
                                                                                                            setActiveActionId(null);
                                                                                                        }}
                                                                                                        className={`w-full text-left px-4 py-2 text-sm ${product.status === 'pending_deactivation' ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                                                                    >
                                                                                                        {product.status === 'pending_deactivation' ? 'Approve Deactivate' : 'Approve'}
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => {
                                                                                                            handleRejectProduct(product);
                                                                                                            setActiveActionId(null);
                                                                                                        }}
                                                                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                                                    >
                                                                                                        Reject
                                                                                                    </button>
                                                                                                </>
                                                                                            )}
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    handleEditUserProduct(product as any);
                                                                                                    setActiveActionId(null);
                                                                                                }}
                                                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                                                            >
                                                                                                Edit
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    handleDeleteUserProduct((product as any).id, (product as any).name);
                                                                                                    setActiveActionId(null);
                                                                                                }}
                                                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                                            >
                                                                                                Delete
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                            {owner ? owner.name : 'Unknown'}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-[10px] font-medium ${product.status === 'approved'
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : product.status === 'rejected'
                                                                                    ? 'bg-red-100 text-red-800'
                                                                                    : product.status === 'pending_deactivation'
                                                                                        ? 'bg-orange-100 text-orange-800'
                                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                                }`}>
                                                                                {product.status === 'pending_deactivation' ? 'Deactivation Request' : product.status ? capitalizeFirstLetter(product.status) : 'Approved'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {allFilteredProducts.length === 0 && (
                                                    <div className="text-center py-8 bg-white border border-gray-200">
                                                        <p className="text-gray-500">No products found</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Requests Tab (Drafts + Deactivations) */}
                        {activeTab === "requests" && (() => {
                            // Filter products to show only new listing (pending), reactivation, and deactivation requests
                            let filteredRequests = userProducts.filter(p => p.status === 'pending' || p.status === 'pending_deactivation' || p.status === 'pending_reactivation');

                            // Apply search query
                            if (searchQuery.trim()) {
                                const query = searchQuery.toLowerCase();
                                filteredRequests = filteredRequests.filter(p => {
                                    return p.name.toLowerCase().includes(query) ||
                                        (p.product_id && p.product_id.toLowerCase().includes(query)) ||
                                        users.find(u => u.id === p.user_id)?.name.toLowerCase().includes(query) ||
                                        users.find(u => u.id === p.user_id)?.phone.includes(query);
                                });
                            }

                            // Apply User Filter
                            if (filterUserId !== 'all') {
                                filteredRequests = filteredRequests.filter(p => p.user_id === filterUserId);
                            }

                            return (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-none border border-gray-200">
                                        <div>
                                            <h2 className="text-xl font-semibold uppercase tracking-wide text-gray-900">Pending Requests</h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Review and take action on {filteredRequests.length} pending items (New Listings & Deactivations)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <div className="bg-white rounded-none border border-gray-200 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Search */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Search Requests</label>
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search pending items..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                                />
                                            </div>
                                            {/* User Filter */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
                                                <select
                                                    value={filterUserId}
                                                    onChange={(e) => setFilterUserId(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                                >
                                                    <option value="all">All Users</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id}>{user.name} ({user.phone})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Request Type</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredRequests.map((product) => {
                                                        const owner = users.find(u => u.id === (product as any).user_id);
                                                        const primaryImage = (product as any).images && Array.isArray((product as any).images) && (product as any).images.length > 0
                                                            ? ((product as any).primary_image_index !== undefined ? (product as any).images[(product as any).primary_image_index] : (product as any).images[0])
                                                            : (product as any).image;

                                                        return (
                                                            <tr key={product.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="relative w-12 h-16 bg-gray-100 rounded-none overflow-hidden">
                                                                        {primaryImage && (
                                                                            <Image
                                                                                src={primaryImage}
                                                                                alt={product.name}
                                                                                fill
                                                                                className="object-cover"
                                                                                unoptimized
                                                                                onError={(e) => {
                                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                    <div className="text-xs text-gray-500">ID: {(product as any).product_id || product.id}</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm text-gray-900">{owner ? owner.name : 'Unknown'}</div>
                                                                    <div className="text-xs text-gray-500">{owner ? owner.phone : ''}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.price}</td>
                                                                <td className="px-6 py-4 text-center">
                                                                    {product.status === 'pending' ? (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-900 text-amber-50">
                                                                            New Listing
                                                                        </span>
                                                                    ) : product.status === 'pending_reactivation' ? (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-900 text-emerald-50">
                                                                            Reactivation
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-900 text-orange-50">
                                                                            Deactivation
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button
                                                                            onClick={() => handleApproveProduct(product)}
                                                                            className={`px-3 py-1.5 text-white text-[10px] uppercase font-bold tracking-wider transition ${product.status === 'pending_deactivation'
                                                                                ? 'bg-orange-600 hover:bg-orange-700'
                                                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                                                                }`}
                                                                        >
                                                                            {product.status === 'pending_deactivation' ? 'Approve Deactivate' : product.status === 'pending_reactivation' ? 'Approve Live' : 'Approve'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleEditUserProduct(product as any)}
                                                                            className="px-3 py-1.5 bg-white text-blue-600 border border-blue-200 text-[10px] uppercase font-bold tracking-wider hover:bg-blue-50 transition"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRejectProduct(product)}
                                                                            className="px-3 py-1.5 bg-white text-red-600 border border-red-200 text-[10px] uppercase font-bold tracking-wider hover:bg-red-50 transition"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {filteredRequests.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium uppercase tracking-wider text-xs">
                                                                No pending requests found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Facets Tab - Removed: Now integrated into Featured Categories */}
                        {/* Removed facets tab - using Featured Categories instead */}
                        {false && (
                            <div className="space-y-6">
                                {/* Facet Type Tabs */}
                                <div className="bg-white rounded-none border border-gray-200 p-4">
                                    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-4">
                                        <button
                                            onClick={() => setActiveFacetTab("product_types")}
                                            className={`px-4 py-2 rounded-none font-medium transition-all ${activeFacetTab === "product_types"
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            Categories
                                        </button>
                                        <button
                                            onClick={() => setActiveFacetTab("occasions")}
                                            className={`px-4 py-2 rounded-none font-medium transition-all ${activeFacetTab === "occasions"
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            Occasions
                                        </button>
                                        <button
                                            onClick={() => setActiveFacetTab("colors")}
                                            className={`px-4 py-2 rounded-none font-medium transition-all ${activeFacetTab === "colors"
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            Colors
                                        </button>
                                        <button
                                            onClick={() => setActiveFacetTab("materials")}
                                            className={`px-4 py-2 rounded-none font-medium transition-all ${activeFacetTab === "materials"
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            Materials
                                        </button>
                                        <button
                                            onClick={() => setActiveFacetTab("cities")}
                                            className={`px-4 py-2 rounded-none font-medium transition-all ${activeFacetTab === "cities"
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            Cities
                                        </button>
                                    </div>

                                    {/* Product Types Section */}
                                    {activeFacetTab === "product_types" && (
                                        <FacetManagementSection
                                            title="Categories"
                                            description="Manage categories like Choly, Western, Sari, Patola, etc."
                                            items={productTypes}
                                            onAdd={() => {
                                                setEditingFacet(null);
                                                setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                setFacetImageFile(null);
                                                setFacetImagePreview("");
                                                setIsFacetModalOpen(true);
                                            }}
                                            onEdit={(item) => {
                                                setEditingFacet(item);
                                                setFacetFormData({
                                                    name: item.name,
                                                    hex: "",
                                                    state: "",
                                                    country: "",
                                                    image_url: item.image_url || ""
                                                });
                                                setFacetImageFile(null);
                                                setFacetImagePreview(item.image_url || "");
                                                setIsFacetModalOpen(true);
                                            }}
                                            onDelete={handleDeleteProductType}
                                        />
                                    )}

                                    {/* Occasions Section */}
                                    {activeFacetTab === "occasions" && (
                                        <FacetManagementSection
                                            title="Occasions"
                                            description="Manage occasions like Navratri, Marriage, etc."
                                            items={occasions}
                                            onAdd={() => {
                                                setEditingFacet(null);
                                                setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                setFacetImageFile(null);
                                                setFacetImagePreview("");
                                                setIsFacetModalOpen(true);
                                            }}
                                            onEdit={(item) => {
                                                setEditingFacet(item);
                                                setFacetFormData({
                                                    name: item.name,
                                                    hex: "",
                                                    state: "",
                                                    country: "",
                                                    image_url: item.image_url || ""
                                                });
                                                setFacetImageFile(null);
                                                setFacetImagePreview(item.image_url || "");
                                                setIsFacetModalOpen(true);
                                            }}
                                            onDelete={handleDeleteOccasion}
                                        />
                                    )}

                                    {/* Colors Section */}
                                    {activeFacetTab === "colors" && (
                                        <FacetManagementSection
                                            title="Colors"
                                            description="Manage colors like Red, Blue, Green, Yellow, etc."
                                            items={colors}
                                            onAdd={() => {
                                                setEditingFacet(null);
                                                setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                setFacetImageFile(null);
                                                setFacetImagePreview("");
                                                setIsFacetModalOpen(true);
                                            }}
                                            onEdit={(item) => {
                                                setEditingFacet(item);
                                                setFacetFormData({
                                                    name: item.name,
                                                    hex: item.hex || "",
                                                    state: "",
                                                    country: "",
                                                    image_url: ""
                                                });
                                                setIsFacetModalOpen(true);
                                            }}
                                            onDelete={handleDeleteColor}
                                            showHex={true}
                                        />
                                    )}

                                    {/* Materials Section */}
                                    {activeFacetTab === "materials" && (
                                        <FacetManagementSection
                                            title="Materials"
                                            description="Manage materials like Cotton, Cotton-Poly, Linen, Tencel, Silk, etc."
                                            items={materials}
                                            onAdd={() => {
                                                setEditingFacet(null);
                                                setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                setFacetImageFile(null);
                                                setFacetImagePreview("");
                                                setIsFacetModalOpen(true);
                                            }}
                                            onEdit={(item) => {
                                                setEditingFacet(item);
                                                setFacetFormData({
                                                    name: item.name,
                                                    hex: "",
                                                    state: "",
                                                    country: "",
                                                    image_url: ""
                                                });
                                                setIsFacetModalOpen(true);
                                            }}
                                            onDelete={handleDeleteMaterial}
                                        />
                                    )}

                                    {/* Cities Section */}
                                    {activeFacetTab === "cities" && (
                                        <FacetManagementSection
                                            title="Cities"
                                            description="Manage cities where products are available like Rajkot, Surat, Ahmedabad, etc."
                                            items={cities}
                                            onAdd={() => {
                                                setEditingFacet(null);
                                                setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                setFacetImageFile(null);
                                                setFacetImagePreview("");
                                                setIsFacetModalOpen(true);
                                            }}
                                            onEdit={(item) => {
                                                setEditingFacet(item);
                                                setFacetFormData({
                                                    name: item.name,
                                                    hex: "",
                                                    state: item.state || "",
                                                    country: item.country || "",
                                                    image_url: ""
                                                });
                                                setIsFacetModalOpen(true);
                                            }}
                                            onDelete={handleDeleteCity}
                                            showLocation={true}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "users" && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white rounded-none border border-gray-200 p-6">
                                    <div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            // Reset form data when opening modal for new user
                                            setEditingUser(null);
                                            setUserFormData({ name: "", phone: "+91", email: "", cities: [] });
                                            // Ensure cities are loaded when opening modal
                                            if (cities.length === 0) {
                                                await loadCities();
                                            }
                                            setIsUserModalOpen(true);
                                        }}
                                        className="px-5 py-2.5 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        Create User Account
                                    </button>
                                </div>

                                <div className="bg-white rounded-none border border-gray-200 overflow-hidden mb-6">
                                    <div className="overflow-x-auto hidden md:block">
                                        <table className="w-full">
                                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Phone
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Created
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {users.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center">
                                                            <div className="text-gray-500">
                                                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2h5m16 0v-7a2 2 0 00-2-2H3a2 2 0 00-2 2v7m16 0H9" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <p className="text-lg font-medium">No users found</p>
                                                                <p className="text-sm mt-1">Create your first user account to get started</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    users.map((user) => (
                                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {user.name}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-600">{user.phone}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-600">
                                                                    {new Date(user.created_at).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    {user.auth_user_id ? (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-green-100 text-green-800">
                                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                            </svg>
                                                                            Authenticated
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-gray-100 text-gray-800">
                                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                            </svg>
                                                                            Not Authenticated
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEditUser(user)}
                                                                        className="px-4 py-2 bg-gray-600 text-white font-medium rounded-none hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1"
                                                                        title="Edit user details"
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                        </svg>
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            router.push(`/admin/manage-products/${user.id}`);
                                                                        }}
                                                                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                    >
                                                                        Manage Products
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1"
                                                                        title="Delete user and all their products"
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                        </svg>
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View for Users */}
                                    <div className="md:hidden space-y-4 p-4">
                                        {users.length === 0 ? (
                                            <div className="text-center py-8 bg-white border border-gray-200">
                                                <p className="text-gray-500">No users found</p>
                                            </div>
                                        ) : (
                                            users.map((user) => (
                                                <div key={`mobile-user-${user.id}`} className="bg-white border border-gray-200 rounded-none overflow-hidden relative shadow-sm p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900">{user.name}</h3>
                                                            <p className="text-sm text-gray-500">{user.phone}</p>
                                                        </div>
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveActionId(activeActionId === user.id ? null : user.id)}
                                                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                            >
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                                                    <circle cx="12" cy="12" r="1" />
                                                                    <circle cx="12" cy="5" r="1" />
                                                                    <circle cx="12" cy="19" r="1" />
                                                                </svg>
                                                            </button>

                                                            {activeActionId === user.id && (
                                                                <>
                                                                    <div
                                                                        className="fixed inset-0 z-40"
                                                                        onClick={() => setActiveActionId(null)}
                                                                    ></div>
                                                                    <div className="absolute right-0 top-6 w-48 bg-white border border-gray-200 shadow-xl rounded-none z-50">
                                                                        <div className="py-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleEditUser(user);
                                                                                    setActiveActionId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    router.push(`/admin/manage-products/${user.id}`);
                                                                                    setActiveActionId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                                                            >
                                                                                Manage Products
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleDeleteUser(user.id, user.name);
                                                                                    setActiveActionId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                                        <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                                        {user.auth_user_id ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-medium bg-green-100 text-green-800">
                                                                Authenticated
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-medium bg-gray-100 text-gray-800">
                                                                Not Auth
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>
                        )}



                        {/* Create/Edit User Modal */}
                        {isUserModalOpen && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none max-w-md w-full">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-2xl font-semibold">{editingUser ? "Edit User" : "Create User Account"}</h2>
                                            <button
                                                onClick={() => {
                                                    setIsUserModalOpen(false);
                                                    setEditingUser(null);
                                                    setUserFirstName("");
                                                    setUserLastName("");
                                                    setUserFormData({ name: "", phone: "+91", email: "", cities: [] });
                                                    setShowAddCity(false);
                                                    setNewCityName("");
                                                    setNewCityState("");
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>

                                        <form onSubmit={handleCreateUser} className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={userFirstName}
                                                        onChange={(e) => setUserFirstName(capitalizeFirstLetter(e.target.value))}
                                                        placeholder="First Name"
                                                        className="w-full px-4 py-2 border rounded-none focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Surname *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={userLastName}
                                                        onChange={(e) => setUserLastName(capitalizeFirstLetter(e.target.value))}
                                                        placeholder="Surname"
                                                        className="w-full px-4 py-2 border rounded-none focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Phone (10 digits)
                                                </label>
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 rounded-none-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                                                        +91
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        value={userFormData.phone.replace('+91', '')}
                                                        onChange={(e) => {
                                                            // Only allow numbers
                                                            const numbersOnly = e.target.value.replace(/[^0-9]/g, '');
                                                            // Limit to 10 digits
                                                            const limitedNumbers = numbersOnly.slice(0, 10);
                                                            setUserFormData({ ...userFormData, phone: '+91' + limitedNumbers });
                                                        }}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-none-md focus:outline-none focus:ring-2 focus:ring-black"
                                                        placeholder="1234567890"
                                                        maxLength={10}
                                                        pattern="[0-9]{10}"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Enter 10-digit mobile number (numbers only)
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        From Where (Cities) *
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowAddCity(!showAddCity);
                                                            if (showAddCity) {
                                                                setNewCityName("");
                                                                setNewCityState("");
                                                            }
                                                        }}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        {showAddCity ? "Cancel" : "+ Add New"}
                                                    </button>
                                                </div>

                                                {showAddCity && (
                                                    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-none">
                                                        <div className="flex flex-col gap-2">
                                                            <input
                                                                type="text"
                                                                value={newCityName}
                                                                onChange={(e) => setNewCityName(e.target.value)}
                                                                placeholder="City Name"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={newCityState}
                                                                onChange={(e) => setNewCityState(e.target.value)}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleAddNewCity();
                                                                    }
                                                                }}
                                                                placeholder="State *"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleAddNewCity}
                                                                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                            >
                                                                Add City
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="border border-gray-300 rounded-none max-h-48 overflow-y-auto p-2">
                                                    {cities.length === 0 ? (
                                                        <p className="text-xs text-gray-500">Loading cities...</p>
                                                    ) : (
                                                        cities.map(city => {
                                                            const isChecked = userFormData.cities.includes(city.id);
                                                            return (
                                                                <label
                                                                    key={city.id}
                                                                    className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded-none"
                                                                >
                                                                    <div className={`w-4 h-4 border flex items-center justify-center rounded-full ${isChecked ? 'border-black' : 'border-gray-300'}`}>
                                                                        {isChecked && <div className="w-2 h-2 bg-black rounded-full" />}
                                                                    </div>
                                                                    <input
                                                                        type="radio"
                                                                        checked={isChecked}
                                                                        name="userCity"
                                                                        value={city.id}
                                                                        onChange={() => {
                                                                            setUserFormData(prev => ({
                                                                                ...prev,
                                                                                cities: [city.id]
                                                                            }));
                                                                        }}
                                                                        className="hidden"
                                                                    />
                                                                    <span className="text-sm text-gray-700 select-none">
                                                                        {city.name}
                                                                        {city.state && <span className="text-gray-400 text-xs ml-1">({city.state})</span>}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Select the city where the user is from.
                                                </p>
                                            </div>



                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity"
                                                >
                                                    {editingUser ? "Update User" : "Create User"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsUserModalOpen(false);
                                                        setEditingUser(null);
                                                        setUserFormData({ name: "", phone: "+91", email: "", cities: [] });
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Manage Products Modal */}
                        {isManageProductsModalOpen && selectedUserId && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none border border-gray-200 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                                    {/* Modal Header */}
                                    <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                        <div>
                                            <h2 className="text-2xl font-semibold uppercase tracking-wide text-gray-900">
                                                Products for {users.find((u) => u.id === selectedUserId)?.name || "User"}
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {userProducts.filter((p) => p.user_id === selectedUserId).length} product{userProducts.filter((p) => p.user_id === selectedUserId).length !== 1 ? 's' : ''} total
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsManageProductsModalOpen(false);
                                                setSelectedUserId(null);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-none transition-colors"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {userProducts.filter((p) => p.user_id === selectedUserId).length === 0 ? (
                                            <div className="text-center py-12">
                                                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                                                <p className="text-sm text-gray-600">This user doesn't have any products yet.</p>
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
                                                                    Name
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                    Price
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {userProducts
                                                                .filter((p) => p.user_id === selectedUserId)
                                                                .map((product) => (
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
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="text-sm font-semibold text-gray-900 max-w-xs">
                                                                                {product.name}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {product.price}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        handleEditUserProduct(product);
                                                                                        setIsManageProductsModalOpen(false);
                                                                                    }}
                                                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                                >
                                                                                    Edit
                                                                                </button>
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                                                                            await handleDeleteUserProduct(product.id, product.name);
                                                                                            await loadUserProducts();
                                                                                        }
                                                                                    }}
                                                                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                                        <button
                                            onClick={() => {
                                                // Keep selectedUserId, just open the product modal
                                                setEditingUserProduct(null);
                                                setUserProductFormData({
                                                    name: "",
                                                    price: "",
                                                    image: "",
                                                    originalPrice: "",
                                                    category: "",
                                                });
                                                setUserProductImages([]);
                                                setPrimaryImageIndex(0);
                                                setUserProductImageFiles([]);
                                                setUserProductImagePreviews([]);
                                                setUserProductImageFile(null);
                                                setUserProductImagePreview("");
                                                setOriginalFileSize(0);
                                                setConvertedWebPSize(0);
                                                setConvertedWebPBlob(null);
                                                setIsConvertingImage(false);
                                                router.push(`/admin/manage-products/${selectedUserId}/add`);
                                            }}
                                            className="px-5 py-2.5 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                            Add Product
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsManageProductsModalOpen(false);
                                                setSelectedUserId(null);
                                            }}
                                            className="px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-none hover:bg-gray-300 transition-all duration-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User Product Modal */}
                        {isUserProductModalOpen && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h2 className="text-2xl font-semibold">
                                                    {editingUserProduct ? "Edit User Product" : "Add User Product"}
                                                </h2>
                                                {selectedUserId && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        For: {users.find((u) => u.id === selectedUserId)?.name || "User"}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const userIdParam = searchParams.get("userId");
                                                    const addProduct = searchParams.get("addProduct");
                                                    // Capture values before clearing state
                                                    const editingProductUserId = editingUserProduct?.user_id;
                                                    const wasEditing = !!editingUserProduct;
                                                    const userIdToUse = userIdParam || editingProductUserId || selectedUserId;

                                                    // Always clear all state first
                                                    setEditingUserProduct(null);
                                                    setSelectedUserId(null);
                                                    setUserProductFormData({ name: "", price: "", image: "", originalPrice: "", category: "" });
                                                    setUserProductImages([]);
                                                    setPrimaryImageIndex(0);
                                                    setUserProductImageFiles([]);
                                                    setUserProductImagePreviews([]);
                                                    setImageSizeInfo([]);
                                                    setUserProductImageFile(null);
                                                    setUserProductImagePreview("");
                                                    setOriginalFileSize(0);
                                                    setConvertedWebPSize(0);
                                                    setConvertedWebPBlob(null);
                                                    setIsConvertingImage(false);
                                                    setIsUserProductModalOpen(false);

                                                    // If we came from manage products page (either editing or adding), redirect back
                                                    if (userIdToUse && (wasEditing || addProduct)) {
                                                        // Clear URL params and redirect
                                                        router.push(`/admin/manage-products/${userIdToUse}`);
                                                    }
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>

                                        <form onSubmit={handleSaveUserProduct} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Product Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={userProductFormData.name}
                                                    onChange={(e) =>
                                                        setUserProductFormData({
                                                            ...userProductFormData,
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Rental Price *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={userProductFormData.price}
                                                    onChange={(e) =>
                                                        setUserProductFormData({
                                                            ...userProductFormData,
                                                            price: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                                    placeholder="e.g., ₹999"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    The rental price for this outfit (required)
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Original Price of Outfit (Optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={userProductFormData.originalPrice}
                                                    onChange={(e) =>
                                                        setUserProductFormData({
                                                            ...userProductFormData,
                                                            originalPrice: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="e.g., 1299"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Original purchase price of the outfit (optional, for display purposes)
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={userProductFormData.category}
                                                    onChange={(e) =>
                                                        setUserProductFormData({
                                                            ...userProductFormData,
                                                            category: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                                    placeholder="e.g., Shirts, Jeans, Dresses"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Product category for filtering and organization (optional)
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 border border-gray-200 rounded-none p-4">
                                                <label className="block text-sm font-semibold text-gray-800 mb-3">
                                                    Upload Product Images {!editingUserProduct && "*"}
                                                </label>
                                                <label
                                                    htmlFor="user-product-images-input"
                                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-none bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all cursor-pointer group"
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <p className="mb-2 text-sm text-gray-500">
                                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Multiple images supported (PNG, JPG, WEBP)
                                                        </p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleMultipleImagesChange}
                                                        className="hidden"
                                                        id="user-product-images-input"
                                                    />
                                                </label>
                                                {imageSizeInfo.length > 0 && (
                                                    <div className="mt-3 border border-gray-200 rounded-none bg-white">
                                                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Size Optimization</h4>
                                                        </div>
                                                        <div className="divide-y divide-gray-100">
                                                            {imageSizeInfo.map((info, index) => {
                                                                const reduction = ((1 - info.converted / info.original) * 100).toFixed(1);
                                                                const isOptimized = info.converted < info.original;
                                                                return (
                                                                    <div key={index} className="px-4 py-2.5">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <p className="text-xs font-medium text-gray-900 truncate flex-shrink-0 min-w-0 max-w-[200px]">
                                                                                {info.name}
                                                                            </p>
                                                                            <div className="flex items-center gap-3 flex-1 justify-end">
                                                                                <span className="text-xs text-gray-500">{formatFileSize(info.original)}</span>
                                                                                <span className="text-xs text-gray-400">→</span>
                                                                                <span className={`text-xs font-semibold ${isOptimized ? 'text-green-600' : 'text-gray-700'}`}>
                                                                                    {formatFileSize(info.converted)}
                                                                                </span>
                                                                                {isOptimized && (
                                                                                    <span className="text-xs text-blue-600 font-medium">
                                                                                        -{reduction}%
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Multiple Images Management */}
                                            {(userProductImages.length > 0 || userProductImagePreviews.length > 0) && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                                        Product Images ({userProductImages.length + userProductImagePreviews.length})
                                                    </label>

                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                        {/* Existing Images */}
                                                        {userProductImages.map((imgUrl, index) => (
                                                            <div key={`existing-${index}`} className="relative group">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPrimaryImage(index)}
                                                                    className="relative w-full aspect-square rounded-none overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-all"
                                                                >
                                                                    <Image
                                                                        src={imgUrl}
                                                                        alt={`Product image ${index + 1}`}
                                                                        fill
                                                                        className="object-cover"
                                                                        unoptimized
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = "none";
                                                                        }}
                                                                    />
                                                                    {/* Heart icon overlay - always visible, filled when selected */}
                                                                    <div className="absolute top-2 right-2 z-10">
                                                                        <div className={`${primaryImageIndex === index ? 'bg-red-500' : 'bg-white/80'} rounded-none p-1.5 shadow-md transition-all`}>
                                                                            <svg
                                                                                className={`w-5 h-5 ${primaryImageIndex === index ? 'text-white fill-white' : 'text-gray-400'}`}
                                                                                fill={primaryImageIndex === index ? "currentColor" : "none"}
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                    {/* Close/Cross icon for removing image */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeImage(index, false);
                                                                        }}
                                                                        className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-none p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Remove image"
                                                                    >
                                                                        <svg
                                                                            className="w-4 h-4"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* New Image Previews */}
                                                        {userProductImagePreviews.map((preview, index) => {
                                                            const totalIndex = userProductImages.length + index;
                                                            return (
                                                                <div key={`preview-${index}`} className="relative group">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPrimaryImage(totalIndex)}
                                                                        className="relative w-full aspect-square rounded-none overflow-hidden border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all"
                                                                    >
                                                                        <Image
                                                                            src={preview}
                                                                            alt={`New image ${index + 1}`}
                                                                            fill
                                                                            className="object-cover"
                                                                            unoptimized
                                                                        />
                                                                        {/* Heart icon overlay - always visible, filled when selected */}
                                                                        <div className="absolute top-2 right-2 z-10">
                                                                            <div className={`${primaryImageIndex === totalIndex ? 'bg-red-500' : 'bg-white/80'} rounded-none p-1.5 shadow-md transition-all`}>
                                                                                <svg
                                                                                    className={`w-5 h-5 ${primaryImageIndex === totalIndex ? 'text-white fill-white' : 'text-gray-400'}`}
                                                                                    fill={primaryImageIndex === totalIndex ? "currentColor" : "none"}
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                        {/* Close/Cross icon for removing image */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                removeImage(totalIndex, true);
                                                                            }}
                                                                            className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-none p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                                            title="Remove image"
                                                                        >
                                                                            <svg
                                                                                className="w-4 h-4"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Click an image to set it as primary (shown on home page). Click the heart icon to like/unlike.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Single Image Preview (Backward Compatibility) */}
                                            {(userProductImagePreview || userProductFormData.image) &&
                                                userProductImages.length === 0 &&
                                                userProductImagePreviews.length === 0 && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Preview
                                                        </label>
                                                        <div className="relative w-32 h-40 border border-gray-300 rounded-none">
                                                            <Image
                                                                src={userProductImagePreview || userProductFormData.image}
                                                                alt="Preview"
                                                                fill
                                                                className="object-cover rounded-none"
                                                                unoptimized
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = "none";
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={isUploadingImage}
                                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isUploadingImage
                                                        ? "Uploading..."
                                                        : editingUserProduct
                                                            ? "Update Product"
                                                            : "Add Product"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const userIdParam = searchParams.get("userId");
                                                        const addProduct = searchParams.get("addProduct");
                                                        // Capture values before clearing state
                                                        const editingProductUserId = editingUserProduct?.user_id;
                                                        const wasEditing = !!editingUserProduct;
                                                        const userIdToUse = userIdParam || editingProductUserId || selectedUserId;

                                                        // Always clear all state first
                                                        setEditingUserProduct(null);
                                                        setSelectedUserId(null);
                                                        setUserProductFormData({ name: "", price: "", image: "", originalPrice: "", category: "" });
                                                        setUserProductImages([]);
                                                        setPrimaryImageIndex(0);
                                                        setUserProductImageFiles([]);
                                                        setUserProductImagePreviews([]);
                                                        setImageSizeInfo([]);
                                                        setUserProductImageFile(null);
                                                        setUserProductImagePreview("");
                                                        setOriginalFileSize(0);
                                                        setConvertedWebPSize(0);
                                                        setConvertedWebPBlob(null);
                                                        setIsConvertingImage(false);
                                                        setIsUserProductModalOpen(false);

                                                        // If we came from manage products page (either editing or adding), redirect back
                                                        if (userIdToUse && (wasEditing || addProduct)) {
                                                            // Clear URL params and redirect
                                                            router.push(`/admin/manage-products/${userIdToUse}`);
                                                        }
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hero Section Tab */}
                        {activeTab === "hero" && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-none border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-semibold uppercase tracking-wide text-gray-900">Hero Section Slides</h2>
                                            <p className="text-sm text-gray-600 mt-1">Manage hero section images and content. Drag to reorder slides.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingHeroSlide(null);
                                                setHeroFormData({ title: "", subtitle: "", image_url: "" });
                                                setHeroImageFile(null);
                                                setHeroImagePreview("");
                                                setIsHeroModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                            Add Slide
                                        </button>
                                    </div>

                                    {heroSlides.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-none">
                                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-500 text-lg font-medium mb-2">No hero slides yet</p>
                                            <p className="text-gray-400 text-sm">Click "Add Slide" to create your first hero slide</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {heroSlides.map((slide, index) => (
                                                <div
                                                    key={slide.id}
                                                    draggable
                                                    onDragStart={(e) => handleHeroDragStart(e, slide.id)}
                                                    onDragOver={(e) => handleHeroDragOver(e, slide.id)}
                                                    onDragEnd={handleHeroDragEnd}
                                                    onDrop={(e) => handleHeroDrop(e, slide.id)}
                                                    className={`flex items-center gap-4 p-4 border-2 rounded-none transition-all ${draggedHeroId === slide.id
                                                        ? "border-blue-500 bg-blue-50 opacity-50"
                                                        : dragOverHeroId === slide.id
                                                            ? "border-green-500 bg-green-50"
                                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <div className="text-gray-400 text-sm font-medium w-8 text-center">
                                                            {index + 1}
                                                        </div>
                                                        <div className="w-6 h-6 text-gray-400 cursor-move">
                                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 8h16M4 16h16" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    <div className="relative w-24 h-32 rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                                                        {slide.image_url ? (
                                                            <Image
                                                                src={slide.image_url}
                                                                alt="Hero slide"
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                No Image
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-lg font-semibold text-gray-900">Hero Slide #{index + 1}</h3>
                                                            {!slide.is_active && (
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-none">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => toggleHeroSlideActive(slide.id, slide.is_active)}
                                                            className={`p-2 rounded-none transition-colors ${slide.is_active
                                                                ? "text-green-600 hover:bg-green-50 bg-green-50"
                                                                : "text-gray-400 hover:text-green-600 hover:bg-gray-100"
                                                                }`}
                                                            title={slide.is_active ? "Deactivate slide" : "Activate slide"}
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill={slide.is_active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1">
                                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditHeroSlide(slide)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-none transition-colors"
                                                            title="Edit slide"
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHeroSlide(slide.id, slide.title)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-none transition-colors"
                                                            title="Delete slide"
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <Popup
                            isOpen={popup.isOpen}
                            onClose={closePopup}
                            message={popup.message}
                            type={popup.type}
                            title={popup.title}
                        />

                        {/* Facet Add/Edit Modal */}
                        {isDeleteModalOpen && deleteTarget && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none max-w-sm w-full shadow-xl">
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold mb-2">Confirm Delete</h3>
                                        <p className="text-gray-600 mb-6">
                                            Are you sure you want to delete <span className="font-semibold">"{deleteTarget.name}"</span>?
                                            This action cannot be undone.
                                        </p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setIsDeleteModalOpen(false)}
                                                className="flex-1 py-3 border border-gray-300 font-medium hover:bg-gray-50 transition-colors uppercase tracking-wider text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirmDelete}
                                                className="flex-1 py-3 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors uppercase tracking-wider text-sm shadow-md"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isFacetModalOpen && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none max-w-md w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-2xl font-semibold">
                                                {editingFacet ? `Edit ${activeFacetTab === "product_types" ? "Product Type" : activeFacetTab === "occasions" ? "Occasion" : activeFacetTab === "colors" ? "Color" : activeFacetTab === "materials" ? "Material" : "City"}` : `Add ${activeFacetTab === "product_types" ? "Product Type" : activeFacetTab === "occasions" ? "Occasion" : activeFacetTab === "colors" ? "Color" : activeFacetTab === "materials" ? "Material" : "City"}`}
                                            </h2>
                                            <button
                                                onClick={() => {
                                                    setIsFacetModalOpen(false);
                                                    setEditingFacet(null);
                                                    setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>

                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            if (activeFacetTab === "product_types") handleSaveProductType();
                                            else if (activeFacetTab === "occasions") handleSaveOccasion();
                                            else if (activeFacetTab === "colors") handleSaveColor();
                                            else if (activeFacetTab === "materials") handleSaveMaterial();
                                            else if (activeFacetTab === "cities") handleSaveCity();
                                        }} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={facetFormData.name}
                                                    onChange={(e) => setFacetFormData({ ...facetFormData, name: capitalizeFirstLetter(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                                    placeholder={activeFacetTab === "product_types" ? "e.g., Choly, Western, Sari" : activeFacetTab === "occasions" ? "e.g., Navratri, Marriage" : activeFacetTab === "colors" ? "e.g., Red, Blue, Green" : activeFacetTab === "materials" ? "e.g., Cotton, Silk, Linen" : "e.g., Rajkot, Surat, Ahmedabad"}
                                                />
                                            </div>

                                            {activeFacetTab === "colors" && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Hex Color Code (optional)
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="text"
                                                            value={facetFormData.hex}
                                                            onChange={(e) => setFacetFormData({ ...facetFormData, hex: e.target.value })}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                                            placeholder="#FF0000"
                                                        />
                                                        {facetFormData.hex && (
                                                            <div
                                                                className="w-12 h-12 rounded-none border border-gray-300"
                                                                style={{ backgroundColor: facetFormData.hex }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {activeFacetTab === "cities" && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            State *
                                                        </label>
                                                        <div className="relative" ref={stateDropdownRef}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsStateDropdownOpen(!isStateDropdownOpen);
                                                                    if (!isStateDropdownOpen) {
                                                                        setStateSearchQuery("");
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-black"
                                                            >
                                                                <span className={facetFormData.state ? "text-gray-900" : "text-gray-500"}>
                                                                    {facetFormData.state || "Select State"}
                                                                </span>
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>

                                                            {isStateDropdownOpen && (
                                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 flex flex-col">
                                                                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                                                        <input
                                                                            type="text"
                                                                            value={stateSearchQuery}
                                                                            onChange={(e) => setStateSearchQuery(e.target.value)}
                                                                            placeholder="Search state..."
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 focus:outline-none focus:border-black"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                    <div className="overflow-y-auto flex-1">
                                                                        {INDIAN_STATES.filter(state =>
                                                                            state.name.toLowerCase().includes(stateSearchQuery.toLowerCase())
                                                                        ).map((state) => (
                                                                            <button
                                                                                key={state.code}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setFacetFormData({ ...facetFormData, state: state.name });
                                                                                    setIsStateDropdownOpen(false);
                                                                                    setStateSearchQuery("");
                                                                                }}
                                                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${facetFormData.state === state.name ? 'bg-gray-50 font-medium' : ''
                                                                                    }`}
                                                                            >
                                                                                {state.name}
                                                                            </button>
                                                                        ))}
                                                                        {INDIAN_STATES.filter(state =>
                                                                            state.name.toLowerCase().includes(stateSearchQuery.toLowerCase())
                                                                        ).length === 0 && (
                                                                                <div className="px-4 py-2 text-sm text-gray-500 text-center">
                                                                                    No states found
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Country field removed as requested */}
                                                </>
                                            )}

                                            {(activeFacetTab === "product_types" || activeFacetTab === "occasions") && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Image (optional)
                                                    </label>
                                                    <label
                                                        htmlFor="facet-image-input"
                                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-none bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                                                    >
                                                        {facetImagePreview || (editingFacet && editingFacet.image_url) ? (
                                                            <div className="relative w-full h-full">
                                                                <Image
                                                                    src={facetImagePreview || editingFacet.image_url}
                                                                    alt="Facet image preview"
                                                                    fill
                                                                    className="object-cover rounded-none"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <p className="mb-2 text-sm text-gray-500">
                                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                                </p>
                                                                <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFacetImageChange}
                                                            className="hidden"
                                                            id="facet-image-input"
                                                        />
                                                    </label>
                                                    {facetImageFile && (
                                                        <p className="text-xs text-gray-500 text-center mt-2">
                                                            Selected: {facetImageFile.name} ({(facetImageFile.size / 1024 / 1024).toFixed(2)} MB)
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={isUploadingFacetImage}
                                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isUploadingFacetImage ? "Uploading..." : editingFacet ? "Update" : "Add"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsFacetModalOpen(false);
                                                        setEditingFacet(null);
                                                        setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                        setFacetImageFile(null);
                                                        setFacetImagePreview("");
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Category Add/Edit Modal */}
                        {isCategoryModalOpen && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none max-w-md w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-2xl font-semibold">
                                                {editingCategory ? "Edit Category" : "Add Category"}
                                            </h2>
                                            <button
                                                onClick={() => {
                                                    setIsCategoryModalOpen(false);
                                                    setEditingCategory(null);
                                                    setCategoryFormData({ name: "", image_url: "" });
                                                    setCategoryImageFile(null);
                                                    setCategoryImagePreview("");
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>

                                        <form onSubmit={handleSaveCategory} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={categoryFormData.name}
                                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                                    placeholder="e.g., Shirts, Jeans, Dresses"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category Image *
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleCategoryImageChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Select an image file (max 10MB)</p>

                                                {/* Show preview of selected image or existing image */}
                                                {((categoryImagePreview && categoryImagePreview.trim()) || (editingCategory && categoryFormData.image_url && typeof categoryFormData.image_url === 'string' && categoryFormData.image_url.trim().length > 0)) && (
                                                    <div className="mt-3 relative w-32 h-40 border border-gray-300 rounded-none overflow-hidden">
                                                        {(categoryImagePreview && categoryImagePreview.trim()) || (categoryFormData.image_url && typeof categoryFormData.image_url === 'string' && categoryFormData.image_url.trim().length > 0) ? (
                                                            <Image
                                                                src={categoryImagePreview || categoryFormData.image_url}
                                                                alt="Preview"
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = "none";
                                                                }}
                                                            />
                                                        ) : null}
                                                        {categoryImageFile && (
                                                            <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-none">
                                                                New
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {categoryImageFile && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Selected: {categoryImageFile.name} ({(categoryImageFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={isUploadingCategoryImage}
                                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isUploadingCategoryImage
                                                        ? "Uploading..."
                                                        : editingCategory
                                                            ? "Update Category"
                                                            : "Add Category"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCategoryModalOpen(false);
                                                        setEditingCategory(null);
                                                        setCategoryFormData({ name: "", image_url: "" });
                                                        setCategoryImageFile(null);
                                                        setCategoryImagePreview("");
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete User Confirmation Modal */}
                        {deleteConfirmUser && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none border border-gray-200 max-w-md w-full">
                                    <div className="p-6">
                                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-none">
                                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                            Delete User?
                                        </h3>
                                        <p className="text-sm text-gray-600 text-center mb-6">
                                            Are you sure you want to delete <strong>{deleteConfirmUser.name}</strong>?
                                        </p>
                                        <div className="bg-red-50 border border-red-200 rounded-none p-4 mb-6">
                                            <p className="text-sm text-red-800 font-medium mb-2">This will:</p>
                                            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                                <li>Delete the user account</li>
                                                <li>Delete all products belonging to this user</li>
                                                <li>Remove products from the home page immediately</li>
                                            </ul>
                                            <p className="text-sm text-red-800 font-medium mt-3">This action cannot be undone.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setDeleteConfirmUser(null)}
                                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={confirmDeleteUser}
                                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors"
                                            >
                                                Delete User
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {deleteConfirmProduct && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none border border-gray-200 max-w-md w-full">
                                    <div className="p-6">
                                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-none">
                                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                            Delete Product?
                                        </h3>
                                        <p className="text-sm text-gray-600 text-center mb-6">
                                            Are you sure you want to delete <strong>{deleteConfirmProduct.name}</strong>?
                                        </p>
                                        <div className="bg-red-50 border border-red-200 rounded-none p-4 mb-6">
                                            <p className="text-sm text-red-800 font-medium mb-1 text-center">This will remove the product from the website permanently.</p>
                                            <p className="text-xs text-red-600 text-center uppercase tracking-wider font-semibold mt-2">This action cannot be undone.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setDeleteConfirmProduct(null)}
                                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={confirmDeleteUserProduct}
                                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
                                            >
                                                Delete Product
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Approval Confirmation Modal */}
                        {approveConfirmProduct && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none border border-gray-200 max-w-md w-full shadow-2xl">
                                    <div className="p-6">
                                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full border border-green-200">
                                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2 uppercase tracking-wide">
                                            Approve Product?
                                        </h3>
                                        <p className="text-sm text-gray-600 text-center mb-6">
                                            Are you sure you want to approve <strong>{approveConfirmProduct.name}</strong>?
                                        </p>
                                        <div className="bg-green-50 border border-green-200 rounded-none p-4 mb-6">
                                            <p className="text-sm text-green-800 font-medium mb-1 text-center">This will make the product live on the website.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setApproveConfirmProduct(null)}
                                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-800 font-bold rounded-none hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm border border-gray-300"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={confirmApproveProduct}
                                                className={`flex-1 px-4 py-3 text-white font-bold rounded-none hover:opacity-90 transition-colors uppercase tracking-wider text-sm shadow-lg active:scale-[0.98] ${approveConfirmProduct.status === 'pending_deactivation'
                                                    ? 'bg-orange-600'
                                                    : 'bg-emerald-600'
                                                    }`}
                                            >
                                                {approveConfirmProduct.status === 'pending_deactivation' ? 'Confirm Deactivate' : 'Confirm Approve'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reject Confirmation Modal */}
                        {rejectConfirmProduct && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none border border-gray-200 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                                    <div className="p-6">
                                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-50 rounded-none border border-red-100">
                                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 text-center mb-1 uppercase tracking-wider">
                                            Reject Request?
                                        </h3>
                                        <p className="text-sm text-gray-500 text-center mb-8">
                                            Are you sure you want to reject <br /><strong className="text-gray-900">{rejectConfirmProduct.name}</strong>?
                                        </p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setRejectConfirmProduct(null)}
                                                className="flex-1 px-4 py-3 bg-white text-gray-900 font-bold rounded-none hover:bg-gray-50 transition-colors uppercase tracking-wider text-xs border border-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={confirmRejectProduct}
                                                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-none hover:bg-red-700 transition-colors shadow-sm uppercase tracking-wider text-xs border border-transparent"
                                            >
                                                Confirm Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Hero Slide Add/Edit Modal */}
                        {isHeroModalOpen && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-2xl font-semibold">
                                                {editingHeroSlide ? "Edit Hero Slide" : "Add Hero Slide"}
                                            </h2>
                                            <button
                                                onClick={() => {
                                                    setIsHeroModalOpen(false);
                                                    setEditingHeroSlide(null);
                                                    setHeroFormData({ title: "", subtitle: "", image_url: "" });
                                                    setHeroImageFile(null);
                                                    setHeroImagePreview("");
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>

                                        <form onSubmit={handleSaveHeroSlide} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Image *
                                                </label>
                                                <div className="space-y-3">
                                                    <label
                                                        htmlFor="hero-image-input"
                                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-none bg-gray-50 hover:border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                                                    >
                                                        {heroImagePreview ? (
                                                            <div className="relative w-full h-full">
                                                                <Image
                                                                    src={heroImagePreview}
                                                                    alt="Hero slide preview"
                                                                    fill
                                                                    className="object-cover rounded-none"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <p className="mb-2 text-sm text-gray-500">
                                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                                </p>
                                                                <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleHeroImageChange}
                                                            className="hidden"
                                                            id="hero-image-input"
                                                        />
                                                    </label>
                                                    {heroImageFile && (
                                                        <p className="text-xs text-gray-500 text-center">
                                                            Selected: {heroImageFile.name} ({(heroImageFile.size / 1024 / 1024).toFixed(2)} MB)
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsHeroModalOpen(false);
                                                        setEditingHeroSlide(null);
                                                        setHeroFormData({ title: "", subtitle: "", image_url: "" });
                                                        setHeroImageFile(null);
                                                        setHeroImagePreview("");
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isUploadingHeroImage}
                                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isUploadingHeroImage ? "Uploading..." : editingHeroSlide ? "Update Slide" : "Add Slide"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Featured Categories Tab */}
                        {activeTab === "featured" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold uppercase tracking-wide text-gray-900">Featured Categories</h2>
                                        <p className="text-sm text-gray-600 mt-1">Pin items from Categories, Occasions, Colors, Materials, and Cities to display them in FEATURED CATEGORIES on the home page</p>
                                    </div>
                                </div>

                                {/* Top Section: All Featured Items Combined */}
                                {(() => {
                                    // Combine all featured items from all facet types
                                    const featuredItems: Array<{ id: string; name: string; image_url: string | null; type: string; typeLabel: string; display_order: number; productCount?: number }> = [];

                                    // Add featured product types
                                    productTypes.filter(pt => pt.is_featured).forEach(pt => {
                                        featuredItems.push({
                                            id: pt.id,
                                            name: pt.name,
                                            image_url: pt.image_url,
                                            type: 'product_type',
                                            typeLabel: 'Product Type',
                                            display_order: pt.display_order,
                                            productCount: facetProductCounts.get(`product_type_${pt.id}`) || 0
                                        });
                                    });

                                    // Add featured occasions
                                    occasions.filter(oc => oc.is_featured).forEach(oc => {
                                        featuredItems.push({
                                            id: oc.id,
                                            name: oc.name,
                                            image_url: oc.image_url,
                                            type: 'occasion',
                                            typeLabel: 'Occasion',
                                            display_order: oc.display_order,
                                            productCount: facetProductCounts.get(`occasion_${oc.id}`) || 0
                                        });
                                    });

                                    // Sort by display_order
                                    featuredItems.sort((a, b) => a.display_order - b.display_order);

                                    return featuredItems.length > 0 ? (
                                        <div className="mb-8 border-2 border-yellow-200 rounded-none p-6 bg-yellow-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-none">★</span>
                                                        Featured Items - Reorder Here
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">Drag and drop to reorder featured items across all types. This order will be used on the home page.</p>
                                                </div>
                                                <span className="text-sm text-gray-500">{featuredItems.length} featured items</span>
                                            </div>
                                            <div className="space-y-3">
                                                {featuredItems.map((item, index) => {
                                                    const itemKey = `${item.type}:${item.id}`;
                                                    return (
                                                        <div
                                                            key={itemKey}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                setDraggedFeaturedItem(itemKey);
                                                                e.dataTransfer.effectAllowed = "move";
                                                                e.dataTransfer.setData("text/html", itemKey);
                                                            }}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                e.dataTransfer.dropEffect = "move";
                                                                if (draggedFeaturedItem && draggedFeaturedItem !== itemKey) {
                                                                    setDragOverFeaturedItem(itemKey);
                                                                }
                                                            }}
                                                            onDragLeave={() => setDragOverFeaturedItem(null)}
                                                            onDrop={async (e) => {
                                                                e.preventDefault();
                                                                setDragOverFeaturedItem(null);

                                                                if (!draggedFeaturedItem || draggedFeaturedItem === itemKey) {
                                                                    setDraggedFeaturedItem(null);
                                                                    return;
                                                                }

                                                                const draggedIndex = featuredItems.findIndex(i => `${i.type}:${i.id}` === draggedFeaturedItem);
                                                                const targetIndex = featuredItems.findIndex(i => `${i.type}:${i.id}` === itemKey);

                                                                if (draggedIndex === -1 || targetIndex === -1) {
                                                                    setDraggedFeaturedItem(null);
                                                                    return;
                                                                }

                                                                // Reorder array
                                                                const newItems = [...featuredItems];
                                                                const [removed] = newItems.splice(draggedIndex, 1);
                                                                newItems.splice(targetIndex, 0, removed);

                                                                // Update display_order for all featured items globally
                                                                try {
                                                                    const updatePromises = newItems.map(async (it, idx) => {
                                                                        const tableName = it.type === 'product_type' ? 'product_types' : it.type === 'occasion' ? 'occasions' : null;
                                                                        if (!tableName) return Promise.resolve();

                                                                        return supabase
                                                                            .from(tableName)
                                                                            .update({
                                                                                display_order: idx,
                                                                                updated_at: new Date().toISOString()
                                                                            })
                                                                            .eq("id", it.id);
                                                                    });

                                                                    await Promise.all(updatePromises);
                                                                    showPopup("Featured items reordered successfully! The order will be reflected on the home page.", "success");
                                                                    await Promise.all([loadProductTypes(), loadOccasions()]);
                                                                } catch (error: any) {
                                                                    showPopup(error.message || "Failed to reorder featured items", "error", "Error");
                                                                    console.error("Error reordering featured items:", error);
                                                                }

                                                                setDraggedFeaturedItem(null);
                                                            }}
                                                            onDragEnd={() => {
                                                                setDraggedFeaturedItem(null);
                                                                setDragOverFeaturedItem(null);
                                                            }}
                                                            className={`flex items-center gap-4 p-4 rounded-none border transition-all cursor-move ${draggedFeaturedItem === itemKey
                                                                ? "opacity-50 border-gray-300 bg-white"
                                                                : dragOverFeaturedItem === itemKey
                                                                    ? "border-yellow-400 bg-yellow-100 shadow-md"
                                                                    : "bg-white border-yellow-200 hover:shadow-md"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-yellow-600 font-semibold text-sm w-6">{index + 1}</div>
                                                                <div>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400">
                                                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="relative w-16 h-16 bg-gray-200 rounded-none overflow-hidden flex-shrink-0">
                                                                {item.image_url ? (
                                                                    <Image
                                                                        src={item.image_url}
                                                                        alt={item.name}
                                                                        fill
                                                                        className="object-cover"
                                                                        unoptimized
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                        No Image
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-none">
                                                                        {item.typeLabel}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 mb-1">
                                                                    /products?{item.type === 'product_type' ? 'product_type' : item.type === 'occasion' ? 'occasion' : item.type}={item.id}
                                                                </p>
                                                                {item.productCount !== undefined && (
                                                                    <p className="text-xs text-blue-600 cursor-pointer hover:underline"
                                                                        onClick={() => {
                                                                            setActiveTab("products");
                                                                            localStorage.setItem("adminActiveTab", "products");
                                                                            setFilterCategory(item.id);
                                                                            router.push(`/admin?tab=products`);
                                                                        }}
                                                                    >
                                                                        View {item.productCount} products →
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-8 border-2 border-gray-200 border-dashed rounded-none p-8 bg-gray-50 text-center">
                                            <p className="text-sm text-gray-500">No featured items yet. Pin items from the sections below to add them here.</p>
                                        </div>
                                    );
                                })()}

                                {/* Vertical List Layout */}
                                <div className="space-y-8">
                                    {/* Section 1: Product Types */}
                                    <div className="border border-gray-200 rounded-none p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">{productTypes.length} items</span>
                                                <button
                                                    onClick={() => {
                                                        setActiveFacetTab("product_types");
                                                        setEditingFacet(null);
                                                        setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                        setFacetImageFile(null);
                                                        setFacetImagePreview("");
                                                        setIsFacetModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {productTypes.length === 0 ? (
                                                <div className="text-center py-8 bg-gray-50 rounded-none border border-dashed border-gray-300">
                                                    <p className="text-sm text-gray-500">No items</p>
                                                </div>
                                            ) : (
                                                productTypes.map((pt, index) => {
                                                    const productCount = facetProductCounts.get(`product_type_${pt.id}`) || 0;

                                                    return (
                                                        <div
                                                            key={pt.id}
                                                            className="flex items-center gap-4 p-4 rounded-none border transition-all bg-white border-gray-200 hover:shadow-md"
                                                        >
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-gray-400 font-semibold text-sm w-6">{index + 1}</div>
                                                                <div className="cursor-move">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400">
                                                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="relative w-16 h-16 bg-gray-200 rounded-none overflow-hidden flex-shrink-0">
                                                                {pt.image_url ? (
                                                                    <Image
                                                                        src={pt.image_url}
                                                                        alt={pt.name}
                                                                        fill
                                                                        className="object-cover"
                                                                        unoptimized
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                        No Image
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-gray-900">{pt.name}</h4>
                                                                    {pt.is_featured && (
                                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-none">
                                                                            ★ Featured
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 mb-1">/products?product_type={pt.id}</p>
                                                                <p className="text-xs text-blue-600 cursor-pointer hover:underline"
                                                                    onClick={() => {
                                                                        setActiveTab("products");
                                                                        localStorage.setItem("adminActiveTab", "products");
                                                                        setFilterCategory(pt.id);
                                                                        router.push(`/admin?tab=products`);
                                                                    }}
                                                                >
                                                                    View {productCount} products →
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <button
                                                                    onClick={async () => {
                                                                        const newFeatured = !pt.is_featured;
                                                                        try {
                                                                            const { error } = await supabase
                                                                                .from("product_types")
                                                                                .update({ is_featured: newFeatured })
                                                                                .eq("id", pt.id);
                                                                            if (error) throw error;
                                                                            loadProductTypes();
                                                                            showPopup(newFeatured ? "Product type pinned!" : "Product type unpinned!", "success");
                                                                        } catch (error: any) {
                                                                            showPopup(error.message || "Failed to update", "error");
                                                                        }
                                                                    }}
                                                                    className={`p-2 rounded-none transition-colors ${pt.is_featured
                                                                        ? "text-yellow-600 hover:bg-yellow-50 bg-yellow-50"
                                                                        : "text-gray-400 hover:text-yellow-600 hover:bg-gray-100"
                                                                        }`}
                                                                    title={pt.is_featured ? "Unpin" : "Pin"}
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={pt.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1">
                                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                </button>
                                                                <span className="text-xs text-gray-400">Drag to reorder</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveFacetTab("product_types");
                                                                        setEditingFacet(pt);
                                                                        setFacetFormData({
                                                                            name: pt.name,
                                                                            hex: "",
                                                                            state: "",
                                                                            country: "",
                                                                            image_url: pt.image_url || ""
                                                                        });
                                                                        setFacetImageFile(null);
                                                                        setFacetImagePreview(pt.image_url || "");
                                                                        setIsFacetModalOpen(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProductType(pt.id, pt.name)}
                                                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 2: Occasions */}
                                    <div className="border border-gray-200 rounded-none p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Occasions</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">{occasions.length} items</span>
                                                <button
                                                    onClick={() => {
                                                        setActiveFacetTab("occasions");
                                                        setEditingFacet(null);
                                                        setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                        setFacetImageFile(null);
                                                        setFacetImagePreview("");
                                                        setIsFacetModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {occasions.length === 0 ? (
                                                <div className="text-center py-8 bg-gray-50 rounded-none border border-dashed border-gray-300">
                                                    <p className="text-sm text-gray-500">No items</p>
                                                </div>
                                            ) : (
                                                occasions.map((oc, index) => {
                                                    const productCount = facetProductCounts.get(`occasion_${oc.id}`) || 0;

                                                    return (
                                                        <div
                                                            key={oc.id}
                                                            className="flex items-center gap-4 p-4 rounded-none border transition-all bg-white border-gray-200 hover:shadow-md"
                                                        >
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-gray-400 font-semibold text-sm w-6">{index + 1}</div>
                                                                <div className="cursor-move">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400">
                                                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="relative w-16 h-16 bg-gray-200 rounded-none overflow-hidden flex-shrink-0">
                                                                {oc.image_url ? (
                                                                    <Image
                                                                        src={oc.image_url}
                                                                        alt={oc.name}
                                                                        fill
                                                                        className="object-cover"
                                                                        unoptimized
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                        No Image
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-gray-900">{oc.name}</h4>
                                                                    {oc.is_featured && (
                                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-none">
                                                                            ★ Featured
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 mb-1">/products?occasion={oc.id}</p>
                                                                <p className="text-xs text-blue-600 cursor-pointer hover:underline"
                                                                    onClick={() => {
                                                                        setActiveTab("products");
                                                                        localStorage.setItem("adminActiveTab", "products");
                                                                        setFilterCategory(oc.id);
                                                                        router.push(`/admin?tab=products`);
                                                                    }}
                                                                >
                                                                    View {productCount} products →
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <button
                                                                    onClick={async () => {
                                                                        const newFeatured = !oc.is_featured;
                                                                        try {
                                                                            const { error } = await supabase
                                                                                .from("occasions")
                                                                                .update({ is_featured: newFeatured })
                                                                                .eq("id", oc.id);
                                                                            if (error) throw error;
                                                                            loadOccasions();
                                                                            showPopup(newFeatured ? "Occasion pinned!" : "Occasion unpinned!", "success");
                                                                        } catch (error: any) {
                                                                            showPopup(error.message || "Failed to update", "error");
                                                                        }
                                                                    }}
                                                                    className={`p-2 rounded-none transition-colors ${oc.is_featured
                                                                        ? "text-yellow-600 hover:bg-yellow-50 bg-yellow-50"
                                                                        : "text-gray-400 hover:text-yellow-600 hover:bg-gray-100"
                                                                        }`}
                                                                    title={oc.is_featured ? "Unpin" : "Pin"}
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={oc.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1">
                                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                </button>
                                                                <span className="text-xs text-gray-400">Drag to reorder</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveFacetTab("occasions");
                                                                        setEditingFacet(oc);
                                                                        setFacetFormData({
                                                                            name: oc.name,
                                                                            hex: "",
                                                                            state: "",
                                                                            country: "",
                                                                            image_url: oc.image_url || ""
                                                                        });
                                                                        setFacetImageFile(null);
                                                                        setFacetImagePreview(oc.image_url || "");
                                                                        setIsFacetModalOpen(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteOccasion(oc.id, oc.name)}
                                                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 3: Colors */}
                                    <div className="border border-gray-200 rounded-none p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Colors</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">{colors.length} items</span>
                                                <button
                                                    onClick={() => {
                                                        setActiveFacetTab("colors");
                                                        setEditingFacet(null);
                                                        setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                        setFacetImageFile(null);
                                                        setFacetImagePreview("");
                                                        setIsFacetModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {colors.length === 0 ? (
                                                <div className="text-center py-8 bg-gray-50 rounded-none border border-dashed border-gray-300">
                                                    <p className="text-sm text-gray-500">No items</p>
                                                </div>
                                            ) : (
                                                colors.map((c, index) => {
                                                    const productCount = facetProductCounts.get(`color_${c.id}`) || 0;

                                                    return (
                                                        <div
                                                            key={c.id}
                                                            className="flex items-center gap-4 p-4 rounded-none border transition-all bg-white border-gray-200 hover:shadow-md"
                                                        >
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-gray-400 font-semibold text-sm w-6">{index + 1}</div>
                                                                <div className="cursor-move">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400">
                                                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="relative w-16 h-16 bg-gray-200 rounded-none overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                {c.hex ? (
                                                                    <div className="w-full h-full rounded-none border border-gray-300" style={{ backgroundColor: c.hex }}></div>
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs rounded-none">
                                                                        No Color
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 mb-1">{c.name}</h4>
                                                                <p className="text-xs text-gray-600 mb-1">/products?color={c.id}</p>
                                                                <p className="text-xs text-blue-600 cursor-pointer hover:underline"
                                                                    onClick={() => {
                                                                        setActiveTab("products");
                                                                        localStorage.setItem("adminActiveTab", "products");
                                                                        setFilterCategory(c.id);
                                                                        router.push(`/admin?tab=products`);
                                                                    }}
                                                                >
                                                                    View {productCount} products →
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-gray-400">Drag to reorder</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveFacetTab("colors");
                                                                        setEditingFacet(c);
                                                                        setFacetFormData({
                                                                            name: c.name,
                                                                            hex: c.hex || "",
                                                                            state: "",
                                                                            country: "",
                                                                            image_url: ""
                                                                        });
                                                                        setFacetImageFile(null);
                                                                        setFacetImagePreview("");
                                                                        setIsFacetModalOpen(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteColor(c.id, c.name)}
                                                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 4: Materials */}
                                    <div className="border border-gray-200 rounded-none p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Materials</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">{materials.length} items</span>
                                                <button
                                                    onClick={() => {
                                                        setActiveFacetTab("materials");
                                                        setEditingFacet(null);
                                                        setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                        setFacetImageFile(null);
                                                        setFacetImagePreview("");
                                                        setIsFacetModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {materials.length === 0 ? (
                                                <div className="text-center py-8 bg-gray-50 rounded-none border border-dashed border-gray-300">
                                                    <p className="text-sm text-gray-500">No items</p>
                                                </div>
                                            ) : (
                                                materials.map((m, index) => {
                                                    const productCount = facetProductCounts.get(`material_${m.id}`) || 0;

                                                    return (
                                                        <div
                                                            key={m.id}
                                                            className="flex items-center gap-4 p-4 rounded-none border transition-all bg-white border-gray-200 hover:shadow-md"
                                                        >
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-gray-400 font-semibold text-sm w-6">{index + 1}</div>
                                                                <div className="cursor-move">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400">
                                                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="relative w-16 h-16 bg-gray-200 rounded-none overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                    No Image
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 mb-1">{m.name}</h4>
                                                                <p className="text-xs text-gray-600 mb-1">/products?material={m.id}</p>
                                                                <p className="text-xs text-blue-600 cursor-pointer hover:underline"
                                                                    onClick={() => {
                                                                        setActiveTab("products");
                                                                        localStorage.setItem("adminActiveTab", "products");
                                                                        setFilterCategory(m.id);
                                                                        router.push(`/admin?tab=products`);
                                                                    }}
                                                                >
                                                                    View {productCount} products →
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-gray-400">Drag to reorder</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveFacetTab("materials");
                                                                        setEditingFacet(m);
                                                                        setFacetFormData({
                                                                            name: m.name,
                                                                            hex: "",
                                                                            state: "",
                                                                            country: "",
                                                                            image_url: ""
                                                                        });
                                                                        setFacetImageFile(null);
                                                                        setFacetImagePreview("");
                                                                        setIsFacetModalOpen(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMaterial(m.id, m.name)}
                                                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 5: Cities */}
                                    <div className="border border-gray-200 rounded-none p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Cities</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">{cities.length} items</span>
                                                <button
                                                    onClick={() => {
                                                        setActiveFacetTab("cities");
                                                        setEditingFacet(null);
                                                        setFacetFormData({ name: "", hex: "", state: "", country: "", image_url: "" });
                                                        setFacetImageFile(null);
                                                        setFacetImagePreview("");
                                                        setIsFacetModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {cities.length === 0 ? (
                                                <div className="text-center py-8 bg-gray-50 rounded-none border border-dashed border-gray-300">
                                                    <p className="text-sm text-gray-500">No items</p>
                                                </div>
                                            ) : (
                                                cities.map((city, index) => {
                                                    const productCount = facetProductCounts.get(`city_${city.id}`) || 0;

                                                    return (
                                                        <div
                                                            key={city.id}
                                                            className="flex items-center gap-4 p-4 rounded-none border transition-all bg-white border-gray-200 hover:shadow-md"
                                                        >
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-gray-400 font-semibold text-sm w-6">{index + 1}</div>
                                                                <div className="cursor-move">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400">
                                                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="relative w-16 h-16 bg-gray-200 rounded-none overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                    No Image
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 mb-1">{city.name}</h4>
                                                                {city.state && (
                                                                    <p className="text-xs text-gray-600 mb-1">{city.state}</p>
                                                                )}
                                                                <p className="text-xs text-gray-600 mb-1">/products?city={city.id}</p>
                                                                <p className="text-xs text-blue-600 cursor-pointer hover:underline"
                                                                    onClick={() => {
                                                                        setActiveTab("products");
                                                                        localStorage.setItem("adminActiveTab", "products");
                                                                        setFilterCategory(city.id);
                                                                        router.push(`/admin?tab=products`);
                                                                    }}
                                                                >
                                                                    View {productCount} products →
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-gray-400">Drag to reorder</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveFacetTab("cities");
                                                                        setEditingFacet(city);
                                                                        setFacetFormData({
                                                                            name: city.name,
                                                                            hex: "",
                                                                            state: city.state || "",
                                                                            country: city.country || "",
                                                                            image_url: ""
                                                                        });
                                                                        setFacetImageFile(null);
                                                                        setFacetImagePreview("");
                                                                        setIsFacetModalOpen(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCity(city.id, city.name)}
                                                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-none hover:bg-red-700 transition-colors text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "contact" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-900">Contact Requests</h1>
                                    <span className="text-sm text-gray-500">{contactRequests.length} messages</span>
                                </div>

                                <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email/Phone</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {contactRequests.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                        No messages found
                                                    </td>
                                                </tr>
                                            ) : (
                                                contactRequests.map((req) => (
                                                    <tr key={req.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(req.created_at).toLocaleDateString()}
                                                            <div className="text-xs text-gray-400">{new Date(req.created_at).toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{req.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{req.email}</div>
                                                            <div className="text-sm text-gray-500">{req.phone || "-"}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-900 line-clamp-2">{req.message}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium capitalize ${req.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {req.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "reports" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-900">User Reports</h1>
                                    <span className="text-sm text-gray-500">{reports.length} reports</span>
                                </div>

                                <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported User</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reports.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                        No reports found
                                                    </td>
                                                </tr>
                                            ) : (
                                                reports.map((report) => (
                                                    <tr key={report.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(report.created_at).toLocaleDateString()}
                                                            <div className="text-xs text-gray-400">{new Date(report.created_at).toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{report.reporter?.name || "Unknown"}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{report.reporter_user_id?.substring(0, 8)}...</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{report.reported?.name || "Unknown"}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{report.reported_user_id?.substring(0, 8)}...</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 bg-red-50 text-red-700 text-[11px] font-medium border border-red-100 uppercase tracking-wide">
                                                                {report.reason}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-900 max-w-xs truncate" title={report.details}>
                                                                {report.details || <span className="text-gray-400 italic">No details provided</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium capitalize ${report.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {report.status}
                                                                </span>
                                                                <button
                                                                    onClick={() => router.push(`/chat?id=${report.chat_id}`)}
                                                                    className="text-[10px] text-black underline uppercase tracking-tighter hover:text-gray-600"
                                                                >
                                                                    View Chat
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            </main >
        </div >
    );
}

export function AdminLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-none animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading admin panel...</p>
            </div>
        </div>
    );
}

export default function AdminClient() {
    const searchParams = useSearchParams();
    return <AdminContent searchParams={searchParams} />;
}

