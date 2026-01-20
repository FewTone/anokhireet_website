
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
    created_at: string;
    views?: number;
    wishlist_count?: number;
    inquiries_count?: number;
    db_id?: number;
    status?: string; // approved, draft, rejected
    admin_note?: string;
}

export default function MyProductsView() {
    const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

    const [totalInquiries, setTotalInquiries] = useState<number>(0);
    const [totalViews, setTotalViews] = useState<number>(0);
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

    // Add Product Modal State
    const router = useRouter();
    const searchParams = useSearchParams();

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
                // Fetch analytics for these products
                const productIds = productsToSet.map(p => p.product_id || p.id);
                const dbIds = productsToSet.map(p => p.id);

                const { data: viewsData } = await supabase
                    .from("product_views")
                    .select("product_id")
                    .in("product_id", productIds);

                const { data: viewsDataById } = await supabase
                    .from("product_views")
                    .select("product_id")
                    .in("product_id", dbIds.map(String));

                const { data: wishlistData } = await supabase
                    .from("wishlist")
                    .select("product_id")
                    .in("product_id", dbIds);

                const { data: inquiriesData } = await supabase
                    .from("inquiries")
                    .select("product_id")
                    .in("product_id", dbIds);

                // Map counts to products
                const updatedProducts = productsToSet.map((p: any) => {
                    const pIdStr = String(p.product_id || p.id);
                    const dbIdStr = String(p.id);

                    const viewsCount1 = viewsData?.filter(v => v.product_id === pIdStr).length || 0;
                    const viewsCount2 = viewsDataById?.filter(v => v.product_id === dbIdStr).length || 0;
                    const views = Math.max(viewsCount1, viewsCount2);

                    const wishlistCount = wishlistData?.filter(w => w.product_id === p.id).length || 0;
                    const inquiriesCount = inquiriesData?.filter(i => String(i.product_id) === String(p.id)).length || 0;

                    return {
                        ...p,
                        views: views,
                        wishlist_count: wishlistCount,
                        inquiries_count: inquiriesCount,
                        db_id: p.id,
                        status: p.status || 'approved' // Default to approved for old products
                    };
                });

                setMyProducts(updatedProducts);

                // Calculate totals
                const totalV = updatedProducts.reduce((sum, p) => sum + (p.views || 0), 0);
                const totalL = updatedProducts.reduce((sum, p) => sum + (p.wishlist_count || 0), 0);
                const totalI = updatedProducts.reduce((sum, p) => sum + (p.inquiries_count || 0), 0);
                setTotalViews(totalV);
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
        // Check for existing drafts in the loaded products
        const hasDraft = myProducts.some(p => p.status === 'draft');
        
        if (hasDraft) {
            setPopup({
                isOpen: true,
                message: "You can only have 1 active draft product at a time.",
                type: "error",
                title: "Draft Limit Reached"
            });
            return;
        }
        
        router.push('/user/add-product');
    };

    return (
        <div className="w-full px-1 md:px-0">
            <div className="mb-4 flex justify-between items-center hidden md:flex">
                <h2 className="text-2xl font-semibold text-gray-900 uppercase tracking-wide">Product Performance</h2>
                <button
                    onClick={handleAddProduct}
                    className="bg-black text-white px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    + Add Product
                </button>
            </div>

            {/* Mobile Add Product Button */}
            <div className="md:hidden mb-4">
                <button
                    onClick={handleAddProduct}
                    className="w-full bg-black text-white px-4 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    Add Product
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 md:mb-8">
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center">
                    <span className="text-xl md:text-2xl font-normal text-gray-900 mb-0.5">{myProducts.length}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Products</span>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center">
                    <span className="text-xl md:text-2xl font-normal text-gray-900 mb-0.5">{totalViews.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Views</span>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center">
                    <span className="text-xl md:text-2xl font-normal text-gray-900 mb-0.5">{totalLikes.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Likes</span>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-3 flex flex-col items-center justify-center col-span-2 md:col-span-1">
                    <span className="text-xl md:text-2xl font-normal text-gray-900 mb-0.5">{totalInquiries.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Inquiry</span>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-6 items-center p-4 border-b border-gray-100">
                            <div className="w-48 h-32 bg-gray-100 animate-pulse"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-6 w-1/3 bg-gray-100 animate-pulse"></div>
                                <div className="h-4 w-1/4 bg-gray-100 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
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
                <div className="w-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-10 gap-4 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <div className="col-span-10 md:col-span-4 px-4">Product</div>
                        <div className="col-span-2 text-center hidden md:block">Views</div>
                        <div className="col-span-2 text-center hidden md:block">Likes</div>
                        <div className="col-span-2 text-center hidden md:block">Inquiry</div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-0">
                        {myProducts.map((product) => (
                            <div key={product.id} className="group relative grid grid-cols-10 gap-4 items-center border-b border-gray-100 last:border-0 -mx-4 px-4 py-2">
                                {/* Product Info */}
                                <div className="col-span-10 md:col-span-4 flex gap-3 items-center">
                                    <div className="relative w-12 h-[60px] md:w-16 md:h-20 flex-shrink-0 overflow-hidden bg-gray-100 shadow-sm transition-all">
                                        {/* Status Badge */}
                                        {product.status === 'draft' && (
                                            <div className="absolute top-0 right-0 left-0 bg-yellow-400 text-white text-[9px] font-bold py-0.5 text-center z-10 uppercase tracking-wider">PENDING</div>
                                        )}
                                        {product.status === 'rejected' && (
                                            <div className="absolute top-0 right-0 left-0 bg-red-500 text-white text-[9px] font-bold py-0.5 text-center z-10 uppercase tracking-wider">REJECTED</div>
                                        )}
                                        {(!product.status || product.status === 'approved') && (
                                            <div className="absolute top-0 right-0 left-0 bg-green-500 text-white text-[9px] font-bold py-0.5 text-center z-10 uppercase tracking-wider">LIVE</div>
                                        )}

                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center min-w-0">
                                        <h3 className="font-medium text-xs md:text-sm text-gray-900 mb-0.5 leading-snug transition-colors truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-medium mb-0.5">
                                            #{product.product_id || product.id}
                                        </p>
                                        <span className="text-xs font-semibold text-gray-900 mb-0.5 uppercase">
                                            RENT ₹{typeof product.price === 'string' ? Number(product.price).toLocaleString() : product.price}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-[10px] font-medium ml-auto whitespace-nowrap">
                                        {new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>

                                {/* Stats - Views */}
                                <div className="col-span-2 flex flex-col items-center justify-center">
                                    <span className="md:hidden text-[10px] text-gray-400 uppercase font-semibold mb-1">Views</span>
                                    <span className="text-sm text-gray-700">{product.views?.toLocaleString() || 0}</span>
                                </div>

                                {/* Stats - Likes */}
                                <div className="col-span-2 flex flex-col items-center justify-center">
                                    <span className="md:hidden text-[10px] text-gray-400 uppercase font-semibold mb-1">Likes</span>
                                    <span className="text-sm text-gray-700">{product.wishlist_count?.toLocaleString() || 0}</span>
                                </div>

                                {/* Stats - Inquiry */}
                                <div className="col-span-2 flex flex-col items-center justify-center">
                                    <span className="md:hidden text-[10px] text-gray-400 uppercase font-semibold mb-1">Inquiry</span>
                                    <span className="text-sm text-gray-700">{product.inquiries_count?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Product Modal - Removed, using /user/add-product page */}
            <Popup
                isOpen={popup.isOpen}
                onClose={() => setPopup({ ...popup, isOpen: false })}
                message={popup.message}
                type={popup.type}
                title={popup.title}
            />
        </div>
    );
}

