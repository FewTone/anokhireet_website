
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { supabase } from "@/lib/supabase";
import AddProductModal from "./AddProductModal";

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
    const [listingCredits, setListingCredits] = useState<number>(0);
    const [totalInquiries, setTotalInquiries] = useState<number>(0);
    const [totalViews, setTotalViews] = useState<number>(0);
    const [totalLikes, setTotalLikes] = useState<number>(0);

    // Modal state
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);

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
                setListingCredits(0);
                setMyProducts([]);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
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
                .select("id, name, auth_user_id, listing_credits")
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
            setListingCredits(userData.listing_credits || 0);

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

    const handleProductAdded = () => {
        if (userId) {
            loadUserAndProducts(); // Reload everything (credits + products)
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold mb-2">
                        {userName ? `${userName}'s Products` : "My Products"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Manage your listed products and check their performance.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="text-right px-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Credits</p>
                        <p className="text-lg font-black text-gray-900 leading-none">{listingCredits}</p>
                    </div>
                    <button
                        onClick={() => setIsAddProductOpen(true)}
                        disabled={listingCredits <= 0}
                        className={`px-5 py-2.5 rounded-md font-bold text-sm shadow-sm transition-all flex items-center gap-2 ${listingCredits > 0
                            ? "bg-black text-white hover:bg-gray-800 hover:shadow-md active:scale-95"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        title={listingCredits <= 0 ? "You need listing credits to add products. Refer friends to earn credits!" : "Add a new product"}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Product
                    </button>
                </div>
            </div>

            {/* Analytics Section */}
            {userId && !loading && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Products</h3>
                        <p className="text-2xl font-bold text-gray-900">{myProducts.length}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Interest</h3>
                        <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Views</h3>
                        <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Likes</h3>
                        <p className="text-2xl font-bold text-gray-900">{totalLikes}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <h3 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Inquiries</h3>
                        <p className="text-2xl font-bold text-gray-900">{totalInquiries}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            ) : !userId ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">Please log in to view your products.</p>
                </div>
            ) : myProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="mb-4 text-gray-400">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <p className="text-gray-500 text-lg mb-2">You don't have any products yet.</p>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto">
                        Refer friends to earn credits and start listing your products on the platform.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {myProducts.map((product) => (
                        <div key={product.id} className="relative group">
                            {/* Status Badge */}
                            <div className="absolute top-2 left-2 z-10">
                                {product.status === 'draft' && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-md border border-yellow-200 shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                        Pending
                                    </span>
                                )}
                                {product.status === 'rejected' && (
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-md border border-red-200 shadow-sm">
                                        Rejected
                                    </span>
                                )}
                                {/* Approved products typically don't show a badge to keep UI clean, or maybe a subtle one? */}
                            </div>

                            <ProductCard
                                product={{
                                    id: parseInt(product.id) || 0,
                                    productId: product.product_id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.image,
                                }}
                            />
                            {/* Detailed Analytics Overlay/Footer */}
                            <div className="mt-2 grid grid-cols-4 gap-1 bg-gray-50 rounded-md border border-gray-100 p-2 text-xs text-center text-gray-600">
                                <div className="flex flex-col items-center justify-center p-1" title="Interest">
                                    <div className="flex items-center gap-1 mb-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                                    </div>
                                    <span className="font-semibold">{product.views || 0}</span>
                                    <span className="text-[9px] text-gray-400">Intrst</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200" title="Views">
                                    <div className="flex items-center gap-1 mb-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </div>
                                    <span className="font-semibold">{product.views || 0}</span>
                                    <span className="text-[9px] text-gray-400">Views</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200" title="Likes">
                                    <div className="flex items-center gap-1 mb-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    </div>
                                    <span className="font-semibold">{product.wishlist_count || 0}</span>
                                    <span className="text-[9px] text-gray-400">Likes</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200" title="Inquiries">
                                    <div className="flex items-center gap-1 mb-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    </div>
                                    <span className="font-semibold">{product.inquiries_count || 0}</span>
                                    <span className="text-[9px] text-gray-400">Msgs</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AddProductModal
                isOpen={isAddProductOpen}
                onClose={() => setIsAddProductOpen(false)}
                userId={userId || ""}
                listingCredits={listingCredits}
                onSuccess={handleProductAdded}
            />
        </div>
    );
}

