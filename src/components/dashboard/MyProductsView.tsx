
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { supabase } from "@/lib/supabase";
import Popup from "@/components/Popup";
import { useRouter, useSearchParams } from "next/navigation";

interface UserProduct {
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string;
    product_id?: string;
    custom_id?: string;
    created_at: string;
    views?: number;
    impressions?: number;
    wishlist_count?: number;

    inquiries_count?: number;
    db_id?: number;
    status?: string; // approved, draft, rejected
    admin_note?: string;
    is_active?: boolean;
}

export default function MyProductsView() {
    const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

    const [totalInquiries, setTotalInquiries] = useState<number>(0);
    const [totalViews, setTotalViews] = useState<number>(0);
    const [totalImpressions, setTotalImpressions] = useState<number>(0);
    const [totalLikes, setTotalLikes] = useState<number>(0);


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

    const [deactivateConfirmProduct, setDeactivateConfirmProduct] = useState<UserProduct | null>(null);
    const [reactivateConfirmProduct, setReactivateConfirmProduct] = useState<UserProduct | null>(null);
    const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<UserProduct | null>(null);
    const [submitConfirmProduct, setSubmitConfirmProduct] = useState<UserProduct | null>(null);

    // Add Product Modal State
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | number | null>(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn("Loading timeout - setting loading to false");
                setLoading(false);
            }
        }, 10000);

        loadUserAndProducts().catch((error) => {
            console.error("Error in loadUserAndProducts:", error);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUserAndProducts().catch((error) => {
                    console.error("Error in loadUserAndProducts (auth change):", error);
                    setLoading(false);
                });
            } else {
                setUserId(null);
                setUserName("");
                setMyProducts([]);
                setLoading(false);
            }
        });

        // Open modal if param exists
        // Redirect if param exists
        if (searchParams.get('addProduct') === 'true') {
            router.push('/user/add-product');
        }

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [searchParams, router]);

    // Close Actions menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-action-container]')) {
                return;
            }
            setActiveActionMenuId(null);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const loadUserAndProducts = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                console.log("❌ No Supabase Auth session found");
                setLoading(false);
                return;
            }

            const authUserId = session.user.id;
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, name, auth_user_id")
                .or(`id.eq.${authUserId},auth_user_id.eq.${authUserId}`)
                .maybeSingle();

            if (userError || !userData) {
                console.error("❌ User not found in users table:", userError);
                setLoading(false);
                return;
            }

            const actualUserId = userData.id;
            setUserId(actualUserId);
            setUserName(userData.name || "");

            // Sync guest history to account history immediately on dashboard load
            const anonId = localStorage.getItem('anokhi_viewer_id');
            if (anonId) {
                await supabase.rpc('sync_user_history', {
                    p_user_id: actualUserId,
                    p_anonymous_id: anonId
                });
            }

            loadProducts(actualUserId);
            loadInquiryStats(actualUserId);
        } catch (error) {
            console.error("Error loading user:", error);
            setLoading(false);
        }
    };

    const loadProducts = async (uid: string) => {
        try {
            setLoading(true);

            // Fetch products
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("owner_user_id", uid)
                .order("created_at", { ascending: false });

            let productsToSet = data || [];

            if (error) {
                // Try alternative query
                const { data: altData, error: altError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("owner_user_id", String(uid))
                    .order("created_at", { ascending: false });

                if (!altError && altData) {
                    productsToSet = altData;
                } else {
                    console.error("❌ Error loading products:", error);
                    setMyProducts([]);
                    setLoading(false);
                    return;
                }
            }

            if (productsToSet.length > 0) {
                // Fetch analytics for these products using database IDs (UUIDs)
                const dbIds = productsToSet.map(p => p.id);

                const { data: viewsData } = await supabase
                    .from("product_views")
                    .select("product_id, view_type")
                    .in("product_id", dbIds);


                const { data: wishlistData } = await supabase
                    .from("wishlist")
                    .select("product_id")
                    .in("product_id", dbIds);

                const { data: inquiriesData } = await supabase
                    .from("inquiries")
                    .select("product_id")
                    .in("product_id", dbIds);

                // Map counts and sort
                const updatedProducts = productsToSet.map((p: any) => {
                    const dbIdStr = String(p.id);

                    const productViews = viewsData?.filter(v => String(v.product_id) === dbIdStr) || [];
                    const viewsCount = productViews.filter(v => v.view_type === 'page_view').length;
                    const impressionsCount = productViews.filter(v => v.view_type === 'impression').length;
                    const wishlistCount = wishlistData?.filter(w => String(w.product_id) === dbIdStr).length || 0;
                    const inquiriesCount = inquiriesData?.filter(i => String(i.product_id) === dbIdStr).length || 0;


                    return {
                        ...p,
                        views: viewsCount,
                        impressions: impressionsCount,
                        wishlist_count: wishlistCount,
                        inquiries_count: inquiriesCount,

                        db_id: p.id,
                        status: p.status || 'approved'
                    };
                });

                // Custom sorting: Draft > Pending Deactivation > Approved (Live) > Rejected/Inactive (Deactivated)
                const sortedProducts = [...updatedProducts].sort((a, b) => {
                    const getStatusPriority = (product: any) => {
                        if (product.status === 'draft') return 1;
                        if (product.status === 'pending') return 2;
                        if (product.status === 'pending_reactivation') return 3;
                        if (product.status === 'pending_deactivation') return 4;
                        if (product.status === 'approved' && product.is_active) return 5;
                        return 6; // Deactivated/Rejected/Other
                    };

                    const priorityA = getStatusPriority(a);
                    const priorityB = getStatusPriority(b);

                    if (priorityA !== priorityB) {
                        return priorityA - priorityB;
                    }

                    // Within same priority, sort by created_at desc
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                setMyProducts(sortedProducts);

                // Calculate totals
                const totalV = updatedProducts.reduce((sum, p) => sum + (p.views || 0), 0);
                const totalImp = updatedProducts.reduce((sum, p) => sum + (p.impressions || 0), 0);
                const totalL = updatedProducts.reduce((sum, p) => sum + (p.wishlist_count || 0), 0);
                const totalI = updatedProducts.reduce((sum, p) => sum + (p.inquiries_count || 0), 0);
                setTotalViews(totalV);
                setTotalImpressions(totalImp);
                setTotalLikes(totalL);
                setTotalInquiries(totalI);

            } else {
                setMyProducts([]);
            }
        } catch (error) {
            console.error("❌ Error loading products:", error);
            setMyProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadInquiryStats = async (uid: string) => {
        try {
            const { count, error } = await supabase
                .from("inquiries")
                .select("*", { count: 'exact', head: true })
                .eq("owner_user_id", uid);

            if (error) throw error;
            setTotalInquiries(count || 0);
        } catch (error) {
            console.error("Error loading inquiry stats:", error);
        }
    };

    const handleAddProduct = () => {
        // Check for existing drafts or pending listings
        const existingRequest = myProducts.find(p => p.status === 'draft' || p.status === 'pending');

        if (existingRequest) {
            const isPending = existingRequest.status === 'pending';
            setPopup({
                isOpen: true,
                message: isPending
                    ? "You already have a pending submission. Please wait for admin approval."
                    : "You already have an active draft. Please submit or delete it.",
                type: "error",
                title: isPending ? "Submission Pending" : "Draft Limit Reached"
            });
            return;
        }

        router.push('/user/add-product');
    };

    const toggleProductStatus = async (product: UserProduct) => {
        if (!userId) return;

        // If product is already pending, do nothing
        if (product.status === 'pending_deactivation') return;

        // If active (Live), we request deactivation (change status to pending_deactivation)
        // If inactive (Rejected/Deactivated), we activate (change status to approved, is_active=true) (Only if user wants to reactivate?)
        // User said: "user cant able deactivate user send request to admin"
        // He didn't say about Activating. But previously he said "Deactivated".
        // Let's assume if it's Live -> Request Deactivation.
        // If it's Deactivated (status=rejected/approved+false), maybe Request Activation?
        // For now, let's focus on "Request Deactivation".

        if (product.status === 'approved' && product.is_active) {
            setDeactivateConfirmProduct(product);
        } else if (((product.status === 'approved' && !product.is_active) || product.status === 'rejected')) {
            setReactivateConfirmProduct(product);
        }
    };

    const confirmDeactivation = async () => {
        if (!deactivateConfirmProduct || !userId) return;

        const product = deactivateConfirmProduct;

        // Optimistic update
        const updatedProducts = myProducts.map(p =>
            p.id === product.id ? { ...p, is_active: false } : p
        );
        const originalProducts = [...myProducts];
        setMyProducts(updatedProducts);
        setDeactivateConfirmProduct(null);

        try {
            const { error } = await supabase
                .from("products")
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq("id", product.id)
                .eq("owner_user_id", userId);

            if (error) throw error;

            setPopup({
                isOpen: true,
                message: "Product deactivated.",
                type: "success",
                title: "Deactivated"
            });
        } catch (error: any) {
            console.error("Error updating status:", error);
            setMyProducts(originalProducts); // Revert
            setPopup({
                isOpen: true,
                message: "Failed to deactivate. Please try again.",
                type: "error",
                title: "Error"
            });
        }
    };

    const confirmReactivation = async () => {
        if (!reactivateConfirmProduct || !userId) return;

        const product = reactivateConfirmProduct;

        // Optimistic update
        const updatedProducts = myProducts.map(p =>
            p.id === product.id ? { ...p, status: 'approved', is_active: true } : p
        );
        const originalProducts = [...myProducts];
        setMyProducts(updatedProducts);
        setReactivateConfirmProduct(null);

        try {
            const { error } = await supabase
                .from("products")
                .update({
                    status: 'approved',
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq("id", product.id)
                .eq("owner_user_id", userId);

            if (error) throw error;

            setPopup({
                isOpen: true,
                message: "Product is now live!",
                type: "success",
                title: "Product Reactivated"
            });
        } catch (error: any) {
            console.error("Error updating status:", error);
            setMyProducts(originalProducts); // Revert
            setPopup({
                isOpen: true,
                message: "Failed to send request. Please try again.",
                type: "error",
                title: "Error"
            });
        }
    };

    const confirmDeleteDraft = async () => {
        if (!deleteConfirmProduct || !userId) return;

        const product = deleteConfirmProduct;

        // Optimistic update
        const updatedProducts = myProducts.filter(p => p.id !== product.id);
        const originalProducts = [...myProducts];
        setMyProducts(updatedProducts);
        setDeleteConfirmProduct(null);

        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", product.id)
                .eq("owner_user_id", userId);

            if (error) throw error;

            setPopup({
                isOpen: true,
                message: "Draft product deleted successfully.",
                type: "success",
                title: "Deleted"
            });
        } catch (error: any) {
            console.error("Error deleting draft:", error);
            setMyProducts(originalProducts); // Revert
            setPopup({
                isOpen: true,
                message: "Failed to delete draft. Please try again.",
                type: "error",
            });
        }
    };

    const confirmSubmitDraft = async () => {
        if (!submitConfirmProduct || !userId) return;

        const product = submitConfirmProduct;

        // Optimistic update
        const updatedProducts = myProducts.map(p =>
            p.id === product.id ? { ...p, status: 'pending' } : p
        );
        const originalProducts = [...myProducts];
        setMyProducts(updatedProducts);
        setSubmitConfirmProduct(null);

        try {
            const { error } = await supabase
                .from("products")
                .update({ status: 'pending', updated_at: new Date().toISOString() })
                .eq("id", product.id)
                .eq("owner_user_id", userId);

            if (error) throw error;

            setPopup({
                isOpen: true,
                message: "Listing request sent to admin.",
                type: "success",
                title: "Request Sent"
            });
        } catch (error: any) {
            console.error("Error submitting product:", error);
            setMyProducts(originalProducts); // Revert
            setPopup({
                isOpen: true,
                message: "Failed to send request. Please try again.",
                type: "error",
                title: "Error"
            });
        }
    };

    const withdrawRequest = async (product: UserProduct) => {
        if (!userId) return;

        let newStatus = 'draft';
        if (product.status === 'pending_deactivation') {
            newStatus = 'approved'; // Revert to approved (active)
        } else if (product.status === 'pending_reactivation') {
            newStatus = 'approved'; // Revert to approved (inactive)
        } else if (product.status === 'pending') {
            newStatus = 'draft';
        }

        // Optimistic update
        const updatedProducts = myProducts.map(p =>
            p.id === product.id ? { ...p, status: newStatus } : p
        );
        const originalProducts = [...myProducts];
        setMyProducts(updatedProducts);
        setActiveActionMenuId(null);

        try {
            const { error } = await supabase
                .from("products")
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", product.id)
                .eq("owner_user_id", userId);

            if (error) throw error;

            setPopup({
                isOpen: true,
                message: "Request withdrawn.",
                type: "success",
                title: "Success"
            });
        } catch (error: any) {
            console.error("Error withdrawing request:", error);
            setMyProducts(originalProducts); // Revert
            setPopup({
                isOpen: true,
                message: "Failed to withdraw request.",
                type: "error",
                title: "Error"
            });
        }
    };

    return (
        <div className="w-full px-1 md:px-0">
            <div className="relative mb-3 md:mb-4 flex items-center justify-center min-h-[40px]">
                <h2 className="text-[16px] leading-[24px] font-semibold text-center uppercase tracking-normal" style={{ fontFamily: 'Inter, sans-serif' }}>MY PRODUCTS</h2>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block">
                    <button
                        onClick={handleAddProduct}
                        className="bg-black text-white px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    >
                        Add Product
                    </button>
                </div>
            </div>

            {/* Mobile Add Product Button */}
            <div className="md:hidden mb-4 flex justify-center">
                <button
                    onClick={handleAddProduct}
                    className="w-auto bg-black text-white px-8 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    Add Product
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 md:mb-8 text-center w-full">
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center">
                    <span className="text-2xl font-medium text-black mb-0.5">{myProducts.length}</span>
                    <span className="text-xs uppercase tracking-wider font-normal text-black">Products</span>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center">
                    <span className="text-2xl font-medium text-black mb-0.5">{totalImpressions.toLocaleString()}</span>
                    <span className="text-xs uppercase tracking-wider font-normal text-black">Impressions</span>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center">
                    <span className="text-2xl font-medium text-black mb-0.5">{totalViews.toLocaleString()}</span>
                    <span className="text-xs uppercase tracking-wider font-normal text-black">Views</span>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center">
                    <span className="text-2xl font-medium text-black mb-0.5">{totalLikes.toLocaleString()}</span>
                    <span className="text-xs uppercase tracking-wider font-normal text-black">Likes</span>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center col-span-2 md:col-span-1">
                    <span className="text-2xl font-medium text-black mb-0.5">{totalInquiries.toLocaleString()}</span>
                    <span className="text-xs uppercase tracking-wider font-normal text-black">Inquiry</span>
                </div>
            </div>


            {loading ? (
                <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[1200px] px-4">
                        {/* Skeleton Header matching real header spans: 3, 1, 2, 1, 1, 1, 1, 2 = 12 */}
                        <div className="grid grid-cols-12 gap-12 pb-2 border-b border-gray-200 mb-2">
                            <div className="col-span-3 h-4 bg-gray-50 animate-pulse"></div>
                            <div className="col-span-1 h-4 bg-gray-50 animate-pulse"></div>
                            <div className="col-span-2 h-4 bg-gray-50 animate-pulse"></div>
                            <div className="col-span-1 h-4 bg-gray-50 animate-pulse"></div>
                            <div className="col-span-1 h-4 bg-gray-50 animate-pulse"></div>
                            <div className="col-span-1 h-4 bg-gray-50 animate-pulse"></div>
                            <div className="col-span-1 h-4 bg-gray-50 animate-pulse"></div>
                            <div className="col-span-2 h-4 bg-gray-50 animate-pulse"></div>
                        </div>
                        <div className="space-y-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-12 gap-12 items-center border-b border-gray-100 py-3">
                                    <div className="col-span-3 flex gap-4 items-center">
                                        <div className="w-16 h-20 bg-gray-50 animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-gray-50 animate-pulse"></div>
                                            <div className="h-3 w-1/2 bg-gray-50 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex justify-center"><div className="h-4 w-8 bg-gray-50 animate-pulse"></div></div>
                                    <div className="col-span-2 flex justify-center"><div className="h-4 w-16 bg-gray-50 animate-pulse"></div></div>
                                    <div className="col-span-1 flex justify-center"><div className="h-4 w-8 bg-gray-50 animate-pulse"></div></div>
                                    <div className="col-span-1 flex justify-center"><div className="h-4 w-8 bg-gray-50 animate-pulse"></div></div>
                                    <div className="col-span-1 flex justify-center"><div className="h-4 w-8 bg-gray-50 animate-pulse"></div></div>
                                    <div className="col-span-1 flex justify-center"><div className="h-4 w-8 bg-gray-50 animate-pulse"></div></div>
                                    <div className="col-span-2 flex justify-center"><div className="h-8 w-24 bg-gray-50 animate-pulse"></div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : !userId ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">Please log in to view your products.</p>
                </div>
            ) : myProducts.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 bg-gray-50/30">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 uppercase tracking-wide">No products yet</h3>
                    <p className="text-gray-500 mb-6 text-sm">Start by adding your first product.</p>
                    <button
                        onClick={handleAddProduct}
                        className="bg-black text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    >
                        Add Product
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block w-full overflow-x-auto pb-4 custom-scrollbar">
                        <div className="min-w-[1200px] px-4">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-12 pb-2 border-b border-gray-200 text-sm font-normal text-gray-500 uppercase tracking-wide mb-2">
                                <div className="col-span-12 md:col-span-3 text-left">Products</div>
                                <div className="col-span-1 text-center">Date</div>
                                <div className="col-span-2 text-center">Status</div>
                                <div className="col-span-1 text-center">Impressions</div>
                                <div className="col-span-1 text-center">Views</div>
                                <div className="col-span-1 text-center">Likes</div>
                                <div className="col-span-1 text-center">Inquiry</div>
                                <div className="col-span-2 text-center">Actions</div>

                            </div>

                            {/* Features List */}
                            <div className="space-y-0">
                                {myProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="group relative grid grid-cols-12 gap-12 items-center border-b border-gray-100 last:border-0 py-3"
                                    >
                                        {/* Product Info - ONLY THIS COLUMN IS CLICKABLE */}
                                        <div
                                            onClick={() => window.open(`/user/edit-product/${product.id}`, '_blank')}
                                            className="col-span-12 md:col-span-3 flex gap-4 items-center cursor-pointer group/item"
                                        >
                                            <div className="relative w-14 h-[70px] md:w-16 md:h-20 flex-shrink-0 overflow-hidden bg-gray-100 shadow-sm transition-all border border-gray-100">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <h3 className="font-normal text-sm text-gray-900 mb-0.5 leading-snug truncate group-hover/item:underline">
                                                    {product.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 font-normal mb-0.5">
                                                    ID: <span className="text-black font-normal">{product.custom_id || product.product_id || <span className="text-gray-400 italic">Pending</span>}</span>
                                                </p>
                                                <span className="text-sm font-normal text-gray-900 uppercase tracking-tight">
                                                    ₹ {typeof product.price === 'string' ? Number(product.price).toLocaleString('en-IN') : product.price}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Product Create Date */}
                                        <div className="col-span-12 md:col-span-1 flex flex-col items-center justify-center">
                                            <p className="text-sm text-gray-600 font-normal whitespace-nowrap">
                                                {new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>


                                        {/* Status Section */}
                                        <div className="col-span-12 md:col-span-2 flex flex-col items-center justify-center">
                                            <div className="flex flex-col items-center gap-1.5 w-full">
                                                {product.status === 'draft' && (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-100 uppercase tracking-wider">DRAFT</span>
                                                )}
                                                {product.status === 'pending' && (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-900 text-amber-50 uppercase tracking-wider">REVIEWING</span>
                                                )}
                                                {product.status === 'pending_deactivation' && (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-900 text-orange-50 uppercase tracking-wider">DEACTIVATING</span>
                                                )}
                                                {product.status === 'pending_reactivation' && (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 text-emerald-50 uppercase tracking-wider">REACTIVATING</span>
                                                )}
                                                {product.status === 'approved' && product.is_active && (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-900 text-green-50 uppercase tracking-wider">LIVE</span>
                                                )}
                                                {((product.status === 'approved' && !product.is_active) || product.status === 'rejected') && (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-900 text-red-50 uppercase tracking-wider">DEACTIVATED</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats - Impressions */}
                                        <div className="col-span-12 md:col-span-1 flex flex-col items-center justify-center">
                                            <span className="text-sm text-gray-900 font-normal">{product.impressions?.toLocaleString() || 0}</span>
                                        </div>

                                        {/* Stats - Views */}
                                        <div className="col-span-12 md:col-span-1 flex flex-col items-center justify-center">
                                            <span className="text-sm text-gray-900 font-normal">{product.views?.toLocaleString() || 0}</span>
                                        </div>


                                        {/* Stats - Likes */}
                                        <div className="col-span-12 md:col-span-1 flex flex-col items-center justify-center">
                                            <span className="text-sm text-gray-900 font-normal">{product.wishlist_count?.toLocaleString() || 0}</span>
                                        </div>

                                        {/* Stats - Inquiry */}
                                        <div className="col-span-12 md:col-span-1 flex flex-col items-center justify-center">
                                            <span className="text-sm text-gray-900 font-normal">{product.inquiries_count?.toLocaleString() || 0}</span>
                                        </div>

                                        <div className="col-span-12 md:col-span-2 flex flex-col items-center justify-center px-4 relative" data-action-container="true">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveActionMenuId(activeActionMenuId === product.id ? null : product.id);
                                                }}
                                                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-sm"
                                            >
                                                Actions
                                            </button>

                                            {activeActionMenuId === product.id && (
                                                <div className={`absolute ${index >= myProducts.length - 2 ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'} right-0 w-48 bg-white border border-gray-100 shadow-xl z-[100] p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100`}>
                                                    {(product.status === 'approved' && product.is_active) ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleProductStatus(product);
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            >
                                                                Deactivate
                                                            </button>
                                                        </>
                                                    ) : (product.status === 'pending_deactivation' || product.status === 'pending_reactivation') ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    withdrawRequest(product);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-orange-600 hover:bg-orange-50"
                                                            >
                                                                Withdraw Request
                                                            </button>
                                                        </>
                                                    ) : product.status === 'pending' ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    withdrawRequest(product);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Withdraw Request
                                                            </button>
                                                        </>
                                                    ) : product.status === 'draft' ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSubmitConfirmProduct(product);
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Submit for Review
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirmProduct(product);
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-red-600 hover:bg-red-50"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    ) : (((product.status === 'approved' && !product.is_active) || product.status === 'rejected')) ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleProductStatus(product);
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-emerald-600 hover:bg-emerald-50"
                                                            >
                                                                Make Live
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-400 cursor-default">
                                                                No Actions
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 px-4 pb-20">
                        {myProducts.map((product) => (
                            <div key={product.id} className="border border-gray-200 bg-white p-3 shadow-sm rounded-sm">
                                <div className="flex gap-3 mb-3">
                                    {/* Image */}
                                    <div
                                        onClick={() => window.open(`/user/edit-product/${product.id}`, '_blank')}
                                        className="relative w-20 h-24 bg-gray-100 flex-shrink-0 cursor-pointer border border-gray-100"
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div onClick={() => window.open(`/user/edit-product/${product.id}`, '_blank')} className="cursor-pointer">
                                            <h3 className="font-medium text-sm text-gray-900 leading-tight mb-1 truncate pr-6">{product.name}</h3>
                                            <p className="text-xs text-gray-500 font-mono mb-1">ID: {product.custom_id || product.product_id || <span className="text-gray-400 italic">Pending</span>}</p>
                                            <p className="text-sm font-semibold text-gray-900">₹ {typeof product.price === 'string' ? Number(product.price).toLocaleString('en-IN') : product.price}</p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mt-1">
                                            {product.status === 'draft' && (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-100 uppercase tracking-wider">DRAFT</span>
                                            )}
                                            {product.status === 'pending' && (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900 text-amber-50 uppercase tracking-wider">REVIEWING</span>
                                            )}
                                            {product.status === 'pending_deactivation' && (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-900 text-orange-50 uppercase tracking-wider">DEACTIVATING</span>
                                            )}
                                            {product.status === 'pending_reactivation' && (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 text-emerald-50 uppercase tracking-wider">REACTIVATING</span>
                                            )}
                                            {product.status === 'approved' && product.is_active && (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900 text-green-50 uppercase tracking-wider">LIVE</span>
                                            )}
                                            {((product.status === 'approved' && !product.is_active) || product.status === 'rejected') && (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900 text-red-50 uppercase tracking-wider">DEACTIVATED</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="relative" data-action-container>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionMenuId(activeActionMenuId === product.id ? null : product.id);
                                            }}
                                            className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="12" cy="5" r="1"></circle>
                                                <circle cx="12" cy="19" r="1"></circle>
                                            </svg>
                                        </button>

                                        {/* Mobile Dropdown */}
                                        {activeActionMenuId === product.id && (
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 shadow-xl z-[50] rounded-sm py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                {(product.status === 'approved' && product.is_active) ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-900 hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleProductStatus(product);
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-red-600 hover:bg-red-50"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    </>
                                                ) : (product.status === 'pending_deactivation' || product.status === 'pending_reactivation') ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-900 hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                withdrawRequest(product);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-orange-600 hover:bg-orange-50"
                                                        >
                                                            Withdraw Status
                                                        </button>
                                                    </>
                                                ) : product.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-900 hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                withdrawRequest(product);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-50"
                                                        >
                                                            Withdraw Listing
                                                        </button>
                                                    </>
                                                ) : (
                                                    // Draft or Rejected/Deactivated
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/user/edit-product/${product.id}`, '_blank');
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-900 hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        {product.status === 'draft' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSubmitConfirmProduct(product);
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-900 hover:bg-gray-50"
                                                            >
                                                                Submit for Review
                                                            </button>
                                                        )}
                                                        {((product.status === 'approved' && !product.is_active) || product.status === 'rejected') && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleProductStatus(product); // Reactivate logic
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-green-600 hover:bg-green-50"
                                                            >
                                                                Reactivate
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteConfirmProduct(product);
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-red-600 hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Views</p>
                                        <p className="text-sm font-medium text-gray-900">{product.views || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Imps</p>
                                        <p className="text-sm font-medium text-gray-900">{product.impressions || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Likes</p>
                                        <p className="text-sm font-medium text-gray-900">{product.wishlist_count || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Inquiry</p>
                                        <p className="text-sm font-medium text-gray-900">{product.inquiries_count || 0}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )
            }

            {/* Modals & Popups */}
            <Popup
                isOpen={popup.isOpen}
                onClose={() => setPopup({ ...popup, isOpen: false })}
                message={popup.message}
                type={popup.type}
                title={popup.title}
            />

            {/* Draft Delete Confirmation Modal */}
            {
                deleteConfirmProduct && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[4000] p-4">
                        <div className="bg-white rounded-none border border-gray-100 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-50 rounded-none border border-blue-100">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2 uppercase tracking-wide">
                                    Delete Product
                                </h3>
                                <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                                    Are you sure you want to delete <strong className="text-gray-900">{deleteConfirmProduct.name}</strong>?
                                </p>
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => setDeleteConfirmProduct(null)}
                                        className="flex-1 px-4 py-3 bg-white text-gray-900 font-bold rounded-none hover:bg-gray-50 transition-colors uppercase tracking-wider text-xs border border-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteDraft}
                                        className="flex-1 px-4 py-3 bg-black text-white font-bold rounded-none hover:bg-gray-800 transition-colors shadow-none hover:shadow-lg uppercase tracking-wider text-xs"
                                    >
                                        Confirm Delete
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    This action is permanent and cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Submission Confirmation Modal */}
            {
                submitConfirmProduct && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[4000] p-4">
                        <div className="bg-white rounded-none border border-gray-100 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-50 rounded-none border border-blue-100">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2 uppercase tracking-wide">
                                    Ready to Submit
                                </h3>
                                <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                                    <strong className="text-gray-900">{submitConfirmProduct.name}</strong> for review?
                                </p>
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => setSubmitConfirmProduct(null)}
                                        className="flex-1 px-4 py-3 bg-white text-gray-900 font-bold rounded-none hover:bg-gray-50 transition-colors uppercase tracking-wider text-xs border border-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmSubmitDraft}
                                        className="flex-1 px-4 py-3 bg-black text-white font-bold rounded-none hover:bg-gray-800 transition-colors shadow-none hover:shadow-lg uppercase tracking-wider text-xs"
                                    >
                                        Submit for Review
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    You won't be able to edit it until it's approved.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Deactivation Confirmation Modal */}
            {
                deactivateConfirmProduct && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[4000] p-4">
                        <div className="bg-white rounded-none border border-gray-100 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-50 rounded-none border border-blue-100">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2 uppercase tracking-wide">
                                    Deactivate Product
                                </h3>
                                <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                                    Deactivate <strong className="text-gray-900">{deactivateConfirmProduct.name}</strong>?
                                </p>
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => setDeactivateConfirmProduct(null)}
                                        className="flex-1 px-4 py-3 bg-white text-gray-900 font-bold rounded-none hover:bg-gray-50 transition-colors uppercase tracking-wider text-xs border border-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeactivation}
                                        className="flex-1 px-4 py-3 bg-black text-white font-bold rounded-none hover:bg-gray-800 transition-colors shadow-none hover:shadow-lg uppercase tracking-wider text-xs"
                                    >
                                        Deactivate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    This will hide the product from the marketplace.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reactivation Confirmation Modal */}
            {
                reactivateConfirmProduct && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[4000] p-4">
                        <div className="bg-white rounded-none border border-gray-100 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-50 rounded-none border border-blue-100">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2 uppercase tracking-wide">
                                    Reactivate Product
                                </h3>
                                <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                                    Make <strong className="text-gray-900">{reactivateConfirmProduct.name}</strong> live again?
                                </p>
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => setReactivateConfirmProduct(null)}
                                        className="flex-1 px-4 py-3 bg-white text-gray-900 font-bold rounded-none hover:bg-gray-50 transition-colors uppercase tracking-wider text-xs border border-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmReactivation}
                                        className="flex-1 px-4 py-3 bg-black text-white font-bold rounded-none hover:bg-gray-800 transition-colors shadow-none hover:shadow-lg uppercase tracking-wider text-xs"
                                    >
                                        Make Live
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    A request will be sent to the admin for approval.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
