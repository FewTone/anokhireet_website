"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import MobileFilterSheet from "@/components/MobileFilterSheet";
import { supabase } from "@/lib/supabase";

interface Product {
    id: string | number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
    original_price?: number | string;
    created_at?: string; // Add created_at to preserve sorting
    owner_user_id?: string;
}

interface FilterSection {
    id: string;
    title: string;
    isOpen: boolean;
}

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("newest");

    // Pending filter states (what user selects but hasn't applied yet)
    const [pendingProductTypes, setPendingProductTypes] = useState<string[]>([]);
    const [pendingOccasions, setPendingOccasions] = useState<string[]>([]);
    const [pendingColors, setPendingColors] = useState<string[]>([]);
    const [pendingMaterials, setPendingMaterials] = useState<string[]>([]);
    const [pendingCities, setPendingCities] = useState<string[]>([]);
    const [pendingPriceRange, setPendingPriceRange] = useState<[number, number]>([0, 5000]);

    // Applied filter states (actually used for filtering)
    const [appliedProductTypes, setAppliedProductTypes] = useState<string[]>([]);
    const [appliedOccasions, setAppliedOccasions] = useState<string[]>([]);
    const [appliedColors, setAppliedColors] = useState<string[]>([]);
    const [appliedMaterials, setAppliedMaterials] = useState<string[]>([]);
    const [appliedCities, setAppliedCities] = useState<string[]>([]);
    const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, 5000]);
    const [appliedOwnerId, setAppliedOwnerId] = useState<string>("");

    // Removed aliases - use applied states directly throughout the code

    const [maxPrice, setMaxPrice] = useState<number>(5000); // Dynamic max price from products
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load to prevent URL updates
    const [searchQuery, setSearchQuery] = useState<string>(""); // Search query for product ID or name

    // Filter options data
    const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string; image_url?: string | null; is_featured?: boolean }>>([]);
    const [occasions, setOccasions] = useState<Array<{ id: string; name: string; image_url?: string | null; is_featured?: boolean }>>([]);
    const [colors, setColors] = useState<Array<{ id: string; name: string; hex?: string }>>([]);
    const [materials, setMaterials] = useState<Array<{ id: string; name: string }>>([]);
    const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
    const [showCategories, setShowCategories] = useState(true); // Show categories section by default

    // Filter sections collapse state
    const [filterSections, setFilterSections] = useState<FilterSection[]>([
        { id: "sort", title: "SORT", isOpen: false },
        { id: "product_type", title: "PRODUCT TYPE", isOpen: false },
        { id: "occasion", title: "OCCASION", isOpen: false },
        { id: "color", title: "COLOR", isOpen: false },
        { id: "material", title: "MATERIAL", isOpen: false },
        { id: "city", title: "AVAILABLE CITY", isOpen: false },
        { id: "price", title: "PRICE", isOpen: true },
    ]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Category tags (can be made dynamic later)
    const categoryTags = ["ALL", "NEW", "FORMAL", "BLACK", "LUXE", "PLUS SIZE", "SLIM", "LINEN", "KOREAN", "CHINOS", "GURKHA", "BEIGE", "RELAXED", "BAGGY", "DENIM"];
    const [activeTag, setActiveTag] = useState("ALL");
    const [viewMode, setViewMode] = useState<'grid' | 'grid3'>('grid'); // 'grid' = 2 cols, 'grid3' = 3 cols

    // Load filter options and products
    useEffect(() => {
        loadFilterOptions();
        loadProducts();
    }, []);

    // Update URL params when applied filters change
    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (appliedProductTypes.length > 0) {
            params.set("product_type", appliedProductTypes[0]); // Single product type for URL
        }
        if (appliedOccasions.length > 0) {
            params.set("occasion", appliedOccasions[0]); // Single occasion for URL
        }
        if (appliedColors.length > 0) {
            params.set("colors", appliedColors.join(","));
        }
        if (appliedMaterials.length > 0) {
            params.set("materials", appliedMaterials.join(","));
        }
        if (appliedCities.length > 0) {
            params.set("cities", appliedCities.join(","));
        }
        // Only include price in URL if it's not the default range
        const defaultMax = maxPrice || 5000;
        if (appliedPriceRange[0] > 0 || appliedPriceRange[1] < defaultMax) {
            params.set("price_min", appliedPriceRange[0].toString());
            params.set("price_max", appliedPriceRange[1].toString());
        }
        if (sortBy !== "newest") {
            params.set("sort", sortBy);
        }
        // Add search query to URL if it exists
        if (searchQuery.trim()) {
            params.set("search", searchQuery.trim());
        }
        if (appliedOwnerId) {
            params.set("owner_id", appliedOwnerId);
        }
        const newUrl = params.toString() ? `/products?${params.toString()}` : '/products';
        const currentUrl = window.location.pathname + window.location.search;

        // Only update URL if it's different from current URL
        if (newUrl !== currentUrl) {
            router.replace(newUrl);
        }
    }, [appliedProductTypes, appliedOccasions, appliedColors, appliedMaterials, appliedCities, appliedPriceRange, sortBy, searchQuery, appliedOwnerId, maxPrice, router]);

    // Check URL params for auto-filtering (runs after filter options are loaded)
    useEffect(() => {
        const productTypeParam = searchParams.get("product_type");
        const occasionParam = searchParams.get("occasion");
        const colorsParam = searchParams.get("colors");
        const materialsParam = searchParams.get("materials");
        const citiesParam = searchParams.get("cities");
        const priceMinParam = searchParams.get("price_min");
        const priceMaxParam = searchParams.get("price_max");
        const sortParam = searchParams.get("sort");
        const ownerIdParam = searchParams.get("owner_id");

        if (productTypeParam && productTypes.length > 0) {
            const type = productTypes.find(pt => pt.id === productTypeParam);
            // Only update if different from current state
            if (type && !appliedProductTypes.includes(productTypeParam)) {
                setPendingProductTypes([productTypeParam]);
                setAppliedProductTypes([productTypeParam]);
                setShowCategories(false); // Hide categories list to show filtered results
            }
        } else if (productTypeParam && appliedProductTypes.length === 0) {
            // Wait for product types to load
            supabase
                .from("product_types")
                .select("id, name")
                .eq("id", productTypeParam)
                .single()
                .then(({ data, error }) => {
                    if (data) {
                        setPendingProductTypes([data.id]);
                        setAppliedProductTypes([data.id]);
                        setShowCategories(false); // Hide categories list to show filtered results
                    }
                });
        }

        if (occasionParam && occasions.length > 0) {
            const occasion = occasions.find(oc => oc.id === occasionParam);
            // Only update if different from current state
            if (occasion && !appliedOccasions.includes(occasionParam)) {
                setPendingOccasions([occasionParam]);
                setAppliedOccasions([occasionParam]);
                setShowCategories(false); // Hide categories list to show filtered results
            }
        } else if (occasionParam && appliedOccasions.length === 0) {
            // Wait for occasions to load
            supabase
                .from("occasions")
                .select("id, name")
                .eq("id", occasionParam)
                .single()
                .then(({ data, error }) => {
                    if (data) {
                        setPendingOccasions([data.id]);
                        setAppliedOccasions([data.id]);
                        setShowCategories(false); // Hide categories list to show filtered results
                    }
                });
        }

        // Read colors from URL
        if (colorsParam) {
            const colorIds = colorsParam.split(',').filter(id => id);
            if (colorIds.length > 0) {
                // Only update if different from current state
                const colorIdsSorted = [...colorIds].sort().join(',');
                const appliedColorsSorted = [...appliedColors].sort().join(',');
                if (colorIdsSorted !== appliedColorsSorted) {
                    setPendingColors(colorIds);
                    setAppliedColors(colorIds);
                }
            }
        }

        // Read materials from URL
        if (materialsParam) {
            const materialIds = materialsParam.split(',').filter(id => id);
            if (materialIds.length > 0) {
                // Only update if different from current state
                const materialIdsSorted = [...materialIds].sort().join(',');
                const appliedMaterialsSorted = [...appliedMaterials].sort().join(',');
                if (materialIdsSorted !== appliedMaterialsSorted) {
                    setPendingMaterials(materialIds);
                    setAppliedMaterials(materialIds);
                }
            }
        }

        // Read cities from URL
        if (citiesParam) {
            const cityIds = citiesParam.split(',').filter(id => id);
            if (cityIds.length > 0) {
                // Only update if different from current state
                const cityIdsSorted = [...cityIds].sort().join(',');
                const appliedCitiesSorted = [...appliedCities].sort().join(',');
                if (cityIdsSorted !== appliedCitiesSorted) {
                    setPendingCities(cityIds);
                    setAppliedCities(cityIds);
                }
            }
        }

        // Read price range from URL (only on initial load, before maxPrice is calculated)
        if ((priceMinParam || priceMaxParam) && appliedPriceRange[1] === 5000 && maxPrice === 5000) {
            const minPriceVal = priceMinParam ? parseInt(priceMinParam, 10) : 0;
            const maxPriceVal = priceMaxParam ? parseInt(priceMaxParam, 10) : undefined;
            if (!isNaN(minPriceVal) && (maxPriceVal === undefined || !isNaN(maxPriceVal))) {
                // If maxPrice is provided, use it; otherwise wait for maxPrice to be calculated
                if (maxPriceVal !== undefined) {
                    setPendingPriceRange([minPriceVal, maxPriceVal]);
                    setAppliedPriceRange([minPriceVal, maxPriceVal]);
                } else {
                    setPendingPriceRange([minPriceVal, appliedPriceRange[1]]);
                    setAppliedPriceRange([minPriceVal, appliedPriceRange[1]]);
                }
            }
        }

        // Read sort from URL
        if (sortParam && ['newest', 'oldest', 'price_low', 'price_high'].includes(sortParam)) {
            setSortBy(sortParam);
        }

        // Read search query from URL
        const searchParam = searchParams.get("search");
        if (searchParam !== null) {
            setSearchQuery(searchParam);
        } else {
            setSearchQuery("");
        }

        if (ownerIdParam) {
            setAppliedOwnerId(ownerIdParam);
        } else {
            setAppliedOwnerId("");
        }
    }, [searchParams, productTypes, occasions, maxPrice]);

    // Filter products when applied filters, products, sort, or search query change
    useEffect(() => {
        if (!loading && products.length >= 0) {
            applyFilters();
            // Only update URL after initial load to prevent loops
            if (!isInitialLoad) {
                updateURLParams(); // Update URL when filters change
            } else {
                setIsInitialLoad(false); // Mark initial load complete
            }
        }
    }, [products, appliedProductTypes, appliedOccasions, appliedColors, appliedMaterials, appliedCities, appliedPriceRange, sortBy, searchQuery, appliedOwnerId, loading, maxPrice, isInitialLoad, updateURLParams]);

    const loadFilterOptions = async () => {
        try {
            const [productTypesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                supabase.from("product_types").select("id, name, image_url, is_featured").order("display_order", { ascending: true }),
                supabase.from("occasions").select("id, name, image_url, is_featured").order("display_order", { ascending: true }),
                supabase.from("colors").select("id, name, hex").order("display_order", { ascending: true }),
                supabase.from("materials").select("id, name").order("display_order", { ascending: true }),
                supabase.from("cities").select("id, name").order("display_order", { ascending: true }),
            ]);

            if (productTypesRes.data) setProductTypes(productTypesRes.data);
            if (occasionsRes.data) setOccasions(occasionsRes.data);
            if (colorsRes.data) setColors(colorsRes.data);
            if (materialsRes.data) setMaterials(materialsRes.data);
            if (citiesRes.data) setCities(citiesRes.data);
        } catch (error) {
            console.error("Error loading filter options:", error);
        }
    };

    const handleCategoryClick = (categoryType: 'product_type' | 'occasion', categoryId: string, categoryName: string) => {
        setShowCategories(false); // Hide categories when one is selected
        if (categoryType === 'product_type') {
            setPendingProductTypes([categoryId]);
            setAppliedProductTypes([categoryId]);
            setCategoryName(categoryName);
        } else {
            setPendingOccasions([categoryId]);
            setAppliedOccasions([categoryId]);
            setCategoryName(categoryName);
        }
        // Apply filters immediately
        updateURLParams();
    };

    const clearCategoryFilter = () => {
        setShowCategories(true);
        setPendingProductTypes([]);
        setAppliedProductTypes([]);
        setPendingOccasions([]);
        setAppliedOccasions([]);
        setCategoryName("");
        setActiveTag("ALL");
        updateURLParams();
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            const { data: productsData, error } = await supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (productsData && productsData.length > 0) {
                const formattedProducts: Product[] = productsData.map((p: any, index: number) => {
                    let primaryImage = p.image || "";
                    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                        const primaryIndex = p.primary_image_index !== undefined && p.primary_image_index >= 0 && p.primary_image_index < p.images.length
                            ? p.primary_image_index
                            : 0;
                        primaryImage = p.images[primaryIndex] || p.images[0] || "";
                    }

                    return {
                        id: typeof p.id === 'string' ? p.id : `product-${Date.now()}-${index}`,
                        productId: p.product_id || p.id,
                        name: p.title || p.name,
                        price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                        image: primaryImage,
                        category: p.category || p.category_id,
                        original_price: p.original_price || undefined,
                        created_at: p.created_at, // Preserve created_at for sorting
                        owner_user_id: p.owner_user_id,
                    } as Product & { created_at?: string };
                });

                // Calculate max price from products and update priceRange if not set from URL
                const prices = formattedProducts
                    .map(p => parseFloat(p.price.replace(/[₹,]/g, '')) || 0)
                    .filter(p => p > 0);
                if (prices.length > 0) {
                    const calculatedMaxPrice = Math.max(...prices);
                    // Round up to nearest 1000 for a nice round number
                    let roundedMax = Math.ceil(calculatedMaxPrice / 1000) * 1000;
                    // If all products are under 5000, keep default at 5000
                    // If any product is above 5000, use the calculated max (minimum 5000)
                    const finalMaxPrice = Math.max(roundedMax, 5000);
                    setMaxPrice(finalMaxPrice);

                    const currentMaxPrice = appliedPriceRange[1];
                    // Only update priceRange if current max is default (5000) or if max product price is higher
                    if (currentMaxPrice === 5000 || finalMaxPrice > currentMaxPrice) {
                        setPendingPriceRange([0, finalMaxPrice]);
                        setAppliedPriceRange([0, finalMaxPrice]);
                    }
                }

                setProducts(formattedProducts);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Error loading products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Copy pending filters to applied and trigger filtering
    const handleApplyFilters = () => {
        setAppliedProductTypes([...pendingProductTypes]);
        setAppliedOccasions([...pendingOccasions]);
        setAppliedColors([...pendingColors]);
        setAppliedMaterials([...pendingMaterials]);
        setAppliedCities([...pendingCities]);
        setAppliedPriceRange([...pendingPriceRange]);
        // Filtering will happen automatically via useEffect
    };

    const applyFilters = async () => {
        if (products.length === 0) {
            setFilteredProducts([]);
            return;
        }

        try {
            let filteredProductIds: Set<string> | null = null;

            // Filter by Product Types
            if (appliedProductTypes.length > 0) {
                const { data: typeProducts, error: typeError } = await supabase
                    .from("product_product_types")
                    .select("product_id")
                    .in("type_id", appliedProductTypes);

                if (typeProducts && typeProducts.length > 0) {
                    const ids = new Set(typeProducts.map((tp: any) => String(tp.product_id)));
                    filteredProductIds = ids;
                } else {
                    setFilteredProducts([]);
                    return;
                }
            }

            // Filter by Occasions (intersect with existing)
            if (appliedOccasions.length > 0) {
                const { data: occasionProducts } = await supabase
                    .from("product_occasions")
                    .select("product_id")
                    .in("occasion_id", appliedOccasions);

                if (occasionProducts && occasionProducts.length > 0) {
                    const ids = new Set(occasionProducts.map((op: any) => String(op.product_id)));
                    if (filteredProductIds) {
                        filteredProductIds = new Set([...filteredProductIds].filter(id => ids.has(id)));
                        if (filteredProductIds.size === 0) {
                            setFilteredProducts([]);
                            return;
                        }
                    } else {
                        filteredProductIds = ids;
                    }
                } else {
                    setFilteredProducts([]);
                    return;
                }
            }

            // Filter by Colors (intersect with existing)
            if (appliedColors.length > 0) {
                const { data: colorProducts } = await supabase
                    .from("product_colors")
                    .select("product_id")
                    .in("color_id", appliedColors);

                if (colorProducts && colorProducts.length > 0) {
                    const ids = new Set(colorProducts.map((cp: any) => String(cp.product_id)));
                    if (filteredProductIds) {
                        filteredProductIds = new Set([...filteredProductIds].filter(id => ids.has(id)));
                        if (filteredProductIds.size === 0) {
                            setFilteredProducts([]);
                            return;
                        }
                    } else {
                        filteredProductIds = ids;
                    }
                } else {
                    setFilteredProducts([]);
                    return;
                }
            }

            // Filter by Materials (intersect with existing)
            if (appliedMaterials.length > 0) {
                const { data: materialProducts } = await supabase
                    .from("product_materials")
                    .select("product_id")
                    .in("material_id", appliedMaterials);

                if (materialProducts && materialProducts.length > 0) {
                    const ids = new Set(materialProducts.map((mp: any) => String(mp.product_id)));
                    if (filteredProductIds) {
                        filteredProductIds = new Set([...filteredProductIds].filter(id => ids.has(id)));
                        if (filteredProductIds.size === 0) {
                            setFilteredProducts([]);
                            return;
                        }
                    } else {
                        filteredProductIds = ids;
                    }
                } else {
                    setFilteredProducts([]);
                    return;
                }
            }

            // Filter by Cities (intersect with existing)
            if (appliedCities.length > 0) {
                const { data: cityProducts } = await supabase
                    .from("product_cities")
                    .select("product_id")
                    .in("city_id", appliedCities);

                if (cityProducts && cityProducts.length > 0) {
                    const ids = new Set(cityProducts.map((cp: any) => String(cp.product_id)));
                    if (filteredProductIds) {
                        filteredProductIds = new Set([...filteredProductIds].filter(id => ids.has(id)));
                        if (filteredProductIds.size === 0) {
                            setFilteredProducts([]);
                            return;
                        }
                    } else {
                        filteredProductIds = ids;
                    }
                } else {
                    setFilteredProducts([]);
                    return;
                }
            }

            // Apply filters to products
            let filtered = products;

            // If we have filtered IDs, use them
            if (filteredProductIds && filteredProductIds.size > 0) {
                filtered = filtered.filter(p => filteredProductIds!.has(String(p.id)));
            }

            // Filter by price range
            filtered = filtered.filter(p => {
                const price = parseFloat(p.price.replace(/[₹,]/g, '')) || 0;
                return price >= appliedPriceRange[0] && price <= appliedPriceRange[1];
            });

            // Filter by search query (product ID or name)
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                filtered = filtered.filter(p => {
                    const productId = (p.productId || String(p.id)).toLowerCase();
                    const productName = p.name.toLowerCase();
                    return productId.includes(query) || productName.includes(query);
                });
            }

            // Apply sorting
            filtered = sortProducts(filtered, sortBy);

            // Filter by Owner ID
            if (appliedOwnerId) {
                filtered = filtered.filter(p => p.owner_user_id === appliedOwnerId);
            }

            setFilteredProducts(filtered);
        } catch (error) {
            console.error("Error applying filters:", error);
            setFilteredProducts(products);
        }
    };

    const sortProducts = (productsToSort: Product[], sortOption: string): Product[] => {
        const sorted = [...productsToSort];
        switch (sortOption) {
            case "newest":
                // Products are loaded newest first (ascending: false), but after filtering we need to re-sort by created_at
                return sorted.sort((a, b) => {
                    const dateA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
                    const dateB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
                    return dateB - dateA; // Newest first
                });
            case "oldest":
                // Sort by created_at ascending for oldest first
                return sorted.sort((a, b) => {
                    const dateA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
                    const dateB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
                    return dateA - dateB; // Oldest first
                });
            case "price_low":
                return sorted.sort((a, b) => {
                    const priceA = parseFloat(a.price.replace(/[₹,]/g, '')) || 0;
                    const priceB = parseFloat(b.price.replace(/[₹,]/g, '')) || 0;
                    return priceA - priceB;
                });
            case "price_high":
                return sorted.sort((a, b) => {
                    const priceA = parseFloat(a.price.replace(/[₹,]/g, '')) || 0;
                    const priceB = parseFloat(b.price.replace(/[₹,]/g, '')) || 0;
                    return priceB - priceA;
                });
            default:
                return sorted;
        }
    };

    const toggleFilterSection = (sectionId: string) => {
        setFilterSections(sections =>
            sections.map(section => {
                if (section.id === sectionId) {
                    return { ...section, isOpen: !section.isOpen };
                } else {
                    // Close others when opening one
                    // If we are opening the clicked one (!section.isOpen would be true), then close others.
                    // Actually, the simpler logic is: if we match the ID, toggle. If we don't match, ALWAYS close if the matched one IS OPENING.
                    // But simpler: "Accordion" usually means only one open at a time.
                    // So if ID matches, toggle. If it doesn't match, set isOpen = false.
                    // However, if we are CLOSING the active one, we don't care about others (they are already closed).
                    return { ...section, isOpen: false };
                }
            })
        );
    };

    const toggleFilter = (filterType: 'productType' | 'occasion' | 'color' | 'material' | 'city', id: string) => {
        switch (filterType) {
            case 'productType':
                setPendingProductTypes(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'occasion':
                setPendingOccasions(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'color':
                setPendingColors(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'material':
                setPendingMaterials(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'city':
                setPendingCities(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
        }
    };

    const handleMobileApply = () => {
        handleApplyFilters();
        setIsFilterOpen(false);
        setShowCategories(false); // Switch to product view to see results
    };

    const handleMobileClear = () => {
        clearAllFilters();
        // setIsFilterOpen(false); // Keep open or close? Usually keep open on clear or just clear. Let's keep open to let user see it cleared.
    };

    const clearAllFilters = () => {
        setPendingProductTypes([]);
        setPendingOccasions([]);
        setPendingColors([]);
        setPendingMaterials([]);
        setPendingCities([]);
        setPendingPriceRange([0, maxPrice]);
        setAppliedProductTypes([]);
        setAppliedOccasions([]);
        setAppliedColors([]);
        setAppliedMaterials([]);
        setAppliedCities([]);
        setAppliedPriceRange([0, maxPrice]);
        setSortBy('newest');
        setActiveTag("ALL");
        router.push('/products');
    };

    const getFilterCount = () => {
        let count = 0;
        if (appliedProductTypes.length > 0) count += appliedProductTypes.length;
        if (appliedOccasions.length > 0) count += appliedOccasions.length;
        if (appliedColors.length > 0) count += appliedColors.length;
        if (appliedMaterials.length > 0) count += appliedMaterials.length;
        if (appliedCities.length > 0) count += appliedCities.length;
        return count;
    };

    const updatePriceRange = (index: number, value: number) => {
        setPendingPriceRange(prev => {
            const newRange: [number, number] = [...prev];
            newRange[index] = value;
            // Ensure min <= max
            if (index === 0 && newRange[0] > newRange[1]) newRange[0] = newRange[1];
            if (index === 1 && newRange[1] < newRange[0]) newRange[1] = newRange[0];
            return newRange;
        });
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-24 md:pt-20 pb-12">
                <div className="max-w-[1400px] mx-auto px-0 md:px-4">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Sidebar - Filters */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="sticky top-24 bg-white border border-gray-200 rounded-lg p-4">
                                <h2 className="text-lg font-bold mb-4">FILTERS</h2>

                                {/* SORT */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("sort")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>SORT</span>
                                        <span>{filterSections.find(s => s.id === "sort")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "sort")?.isOpen
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="mt-2 space-y-2">
                                                {[
                                                    { value: "newest", label: "Newest First" },
                                                    { value: "oldest", label: "Oldest First" },
                                                    { value: "price_low", label: "Price: Low to High" },
                                                    { value: "price_high", label: "Price: High to Low" },
                                                ].map((option) => (
                                                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="sort"
                                                            value={option.value}
                                                            checked={sortBy === option.value}
                                                            onChange={() => {
                                                                setSortBy(option.value);
                                                                setFilteredProducts(sortProducts(filteredProducts, option.value));
                                                            }}
                                                            className="w-4 h-4 border-gray-300 text-black focus:ring-black"
                                                        />
                                                        <span className="text-sm">{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PRODUCT TYPE */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("product_type")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>PRODUCT TYPE</span>
                                        <span>{filterSections.find(s => s.id === "product_type")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "product_type")?.isOpen
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                                {productTypes.map(type => (
                                                    <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={pendingProductTypes.includes(type.id)}
                                                            onChange={() => toggleFilter('productType', type.id)}
                                                            className="w-4 h-4 border-gray-300 rounded"
                                                        />
                                                        <span className="text-sm">{type.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* OCCASION */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("occasion")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>OCCASION</span>
                                        <span>{filterSections.find(s => s.id === "occasion")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "occasion")?.isOpen
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                                {occasions.map(occasion => (
                                                    <label key={occasion.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={pendingOccasions.includes(occasion.id)}
                                                            onChange={() => toggleFilter('occasion', occasion.id)}
                                                            className="w-4 h-4 border-gray-300 rounded"
                                                        />
                                                        <span className="text-sm">{occasion.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLOR */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("color")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>COLOR</span>
                                        <span>{filterSections.find(s => s.id === "color")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "color")?.isOpen
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                                {colors.map(color => (
                                                    <label key={color.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={pendingColors.includes(color.id)}
                                                            onChange={() => toggleFilter('color', color.id)}
                                                            className="w-4 h-4 border-gray-300 rounded"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            {color.hex && (
                                                                <div
                                                                    className="w-4 h-4 rounded border border-gray-300"
                                                                    style={{ backgroundColor: color.hex }}
                                                                />
                                                            )}
                                                            <span className="text-sm">{color.name}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MATERIAL */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("material")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>MATERIAL</span>
                                        <span>{filterSections.find(s => s.id === "material")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "material")?.isOpen
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                                {materials.map(material => (
                                                    <label key={material.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={pendingMaterials.includes(material.id)}
                                                            onChange={() => toggleFilter('material', material.id)}
                                                            className="w-4 h-4 border-gray-300 rounded"
                                                        />
                                                        <span className="text-sm">{material.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AVAILABLE CITY */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("city")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>AVAILABLE CITY</span>
                                        <span>{filterSections.find(s => s.id === "city")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    {filterSections.find(s => s.id === "city")?.isOpen && (
                                        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                            {cities.map(city => (
                                                <label key={city.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={pendingCities.includes(city.id)}
                                                        onChange={() => toggleFilter('city', city.id)}
                                                        className="w-4 h-4 border-gray-300 rounded"
                                                    />
                                                    <span className="text-sm">{city.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* PRICE */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("price")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>PRICE</span>
                                        <span>{filterSections.find(s => s.id === "price")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    {filterSections.find(s => s.id === "price")?.isOpen && (
                                        <div className="mt-4">
                                            {/* Dual Range Slider */}
                                            {/* Dual Range Slider - Ported from Mobile for Perfect Alignment */}
                                            <div className="relative h-8 mb-2">
                                                {/* Background track (gray) */}
                                                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-200 rounded transform -translate-y-1/2"></div>

                                                {/* Active range track (thick black line between thumbs) */}
                                                <div
                                                    className="absolute top-1/2 h-[2px] bg-black rounded transform -translate-y-1/2"
                                                    style={{
                                                        left: `${(pendingPriceRange[0] / maxPrice) * 100}%`,
                                                        width: `${((pendingPriceRange[1] - pendingPriceRange[0]) / maxPrice) * 100}%`
                                                    }}
                                                ></div>

                                                {/* Invisible Inputs for Interaction */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxPrice}
                                                    step={Math.ceil(maxPrice / 200)}
                                                    value={pendingPriceRange[0]}
                                                    onChange={(e) => {
                                                        const minValue = Math.min(Number(e.target.value), pendingPriceRange[1]);
                                                        setPendingPriceRange([minValue, pendingPriceRange[1]]);
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                                                />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxPrice}
                                                    step={Math.ceil(maxPrice / 200)}
                                                    value={pendingPriceRange[1]}
                                                    onChange={(e) => {
                                                        const maxValue = Math.max(Number(e.target.value), pendingPriceRange[0]);
                                                        setPendingPriceRange([pendingPriceRange[0], maxValue]);
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                                                />

                                                {/* Visual Thumbs - Premium Black Style */}
                                                <div
                                                    className="absolute w-4 h-4 bg-black border-2 border-white rounded-full shadow-sm top-1/2 -translate-y-1/2 pointer-events-none z-10"
                                                    style={{ left: `calc(${(pendingPriceRange[0] / maxPrice) * 100}% - 8px)` }}
                                                />
                                                <div
                                                    className="absolute w-4 h-4 bg-black border-2 border-white rounded-full shadow-sm top-1/2 -translate-y-1/2 pointer-events-none z-10"
                                                    style={{ left: `calc(${(pendingPriceRange[1] / maxPrice) * 100}% - 8px)` }}
                                                />
                                            </div>

                                            {/* Price labels below slider */}
                                            <div className="flex justify-between text-xs">
                                                <span>₹{pendingPriceRange[0]}</span>
                                                <span>₹{pendingPriceRange[1]}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Filter Buttons */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={clearAllFilters}
                                        className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        CLEAR
                                    </button>
                                    <button
                                        onClick={handleApplyFilters}
                                        className="flex-1 px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
                                    >
                                        APPLY ({filteredProducts.length})
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Category Header */}
                            <div className="mb-6">
                                <h1 className="hidden md:block text-3xl font-bold mb-4">PRODUCTS</h1>

                                {/* Mobile Filter & View Bar - Only show when NOT in category view */}
                                {!showCategories && (
                                    <div className="md:hidden flex items-center justify-between mb-4 px-1">
                                        {/* View Toggles */}
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                className={`p-1 ${viewMode === 'grid' ? 'opacity-100' : 'opacity-40'}`}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="8" height="8" rx="1"></rect>
                                                    <rect x="13" y="3" width="8" height="8" rx="1"></rect>
                                                    <rect x="3" y="13" width="8" height="8" rx="1"></rect>
                                                    <rect x="13" y="13" width="8" height="8" rx="1"></rect>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setViewMode('grid3')}
                                                className={`p-1 ${viewMode === 'grid3' ? 'opacity-100' : 'opacity-40'}`}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="2" width="6" height="6" rx="1"></rect>
                                                    <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                                                    <rect x="16" y="2" width="6" height="6" rx="1"></rect>
                                                    <rect x="2" y="9" width="6" height="6" rx="1"></rect>
                                                    <rect x="9" y="9" width="6" height="6" rx="1"></rect>
                                                    <rect x="16" y="9" width="6" height="6" rx="1"></rect>
                                                    <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                                                    <rect x="9" y="16" width="6" height="6" rx="1"></rect>
                                                    <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Filter Button */}
                                        <button
                                            onClick={() => setIsFilterOpen(true)}
                                            className="p-1"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="4" y1="21" x2="4" y2="14"></line>
                                                <line x1="4" y1="10" x2="4" y2="3"></line>
                                                <line x1="12" y1="21" x2="12" y2="12"></line>
                                                <line x1="12" y1="8" x2="12" y2="3"></line>
                                                <line x1="20" y1="21" x2="20" y2="16"></line>
                                                <line x1="20" y1="12" x2="20" y2="3"></line>
                                                <line x1="1" y1="14" x2="7" y2="14"></line>
                                                <line x1="9" y1="8" x2="15" y2="8"></line>
                                                <line x1="17" y1="16" x2="23" y2="16"></line>
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Desktop Category Tags */}
                                <div className="hidden md:flex flex-wrap gap-2 mb-4">
                                    {categoryTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setActiveTag(tag)}
                                            className={`px-4 py-1.5 text-xs border border-black whitespace-nowrap transition-all ${activeTag === tag
                                                ? "bg-black text-white"
                                                : "bg-white hover:bg-gray-50"
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                {/* Categories Section - Mobile View */}
                                {showCategories && (
                                    <div className="md:hidden mb-6">





                                        <div className="space-y-0">
                                            {/* FEATURED CATEGORIES */}
                                            {([...productTypes.filter(p => p.is_featured).map(p => ({ ...p, type: 'product_type' as const })), ...occasions.filter(o => o.is_featured).map(o => ({ ...o, type: 'occasion' as const }))].length > 0) && (
                                                <div>
                                                    {/* Title Removed */}
                                                    {/* ALL PRODUCTS Option */}
                                                    <button
                                                        onClick={() => {
                                                            clearCategoryFilter();
                                                            setShowCategories(false);
                                                        }}
                                                        className="w-full flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="relative w-[72px] h-[96px] flex-shrink-0 bg-black flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold text-center leading-tight px-1 uppercase tracking-widest">ALL</span>
                                                        </div>
                                                        <span className="font-bold text-[13px] uppercase tracking-widest text-left flex-1">ALL PRODUCTS</span>
                                                    </button>
                                                    <div className="space-y-0">
                                                        {[...productTypes.filter(p => p.is_featured).map(p => ({ ...p, type: 'product_type' as const })), ...occasions.filter(o => o.is_featured).map(o => ({ ...o, type: 'occasion' as const }))]
                                                            .sort((a, b) => a.name.localeCompare(b.name)) // Optional sort by name
                                                            .map((item) => (
                                                                <button
                                                                    key={`${item.type}-${item.id}`}
                                                                    onClick={() => handleCategoryClick(item.type, item.id, item.name)}
                                                                    className="w-full flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <div className="relative w-[72px] h-[96px] flex-shrink-0 overflow-hidden bg-gray-100">
                                                                        {item.image_url ? (
                                                                            <Image
                                                                                src={item.image_url}
                                                                                alt={item.name}
                                                                                fill
                                                                                className="object-cover"
                                                                                sizes="72px"
                                                                                unoptimized
                                                                                onError={(e) => {
                                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                                <svg className="w-8 h-8 opacity-50 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className="font-bold text-[13px] uppercase tracking-widest text-left flex-1">{item.name}</span>
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PRODUCT TYPES (Remaining) */}
                                            {productTypes.filter(p => !p.is_featured).length > 0 && (
                                                <div>
                                                    {/* Title Removed */}
                                                    <div className="space-y-0">
                                                        {productTypes.filter(p => !p.is_featured).map((type) => (
                                                            <button
                                                                key={type.id}
                                                                onClick={() => handleCategoryClick('product_type', type.id, type.name)}
                                                                className="w-full flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className="relative w-[72px] h-[96px] flex-shrink-0 overflow-hidden bg-gray-100">
                                                                    {type.image_url ? (
                                                                        <Image
                                                                            src={type.image_url}
                                                                            alt={type.name}
                                                                            fill
                                                                            className="object-cover"
                                                                            sizes="72px"
                                                                            unoptimized
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                            <svg className="w-8 h-8 opacity-50 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-bold text-[13px] uppercase tracking-widest text-left flex-1">{type.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* OCCASIONS (Remaining) */}
                                            {occasions.filter(o => !o.is_featured).length > 0 && (
                                                <div>
                                                    {/* Title Removed */}
                                                    <div className="space-y-2">
                                                        {occasions.filter(o => !o.is_featured).map((occasion) => (
                                                            <button
                                                                key={occasion.id}
                                                                onClick={() => handleCategoryClick('occasion', occasion.id, occasion.name)}
                                                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                                                    {occasion.image_url ? (
                                                                        <Image
                                                                            src={occasion.image_url}
                                                                            alt={occasion.name}
                                                                            fill
                                                                            className="object-cover"
                                                                            sizes="64px"
                                                                            unoptimized
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                                            <span className="text-gray-400 text-xs">No Image</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-bold text-left flex-1">{occasion.name.toUpperCase()}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Selected Category Header */}
                                {/* Selected Category Header Removed as per user request */}

                                {/* Product Count - When no category selected */}
                                {/* Product Count removed as per user request */}
                            </div>

                            {/* Products Grid */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading products...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="text-center py-16">
                                    <svg
                                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                    <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                                    <p className="text-gray-600">Try adjusting your filters</p>
                                    <button
                                        onClick={clearAllFilters}
                                        className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            ) : (
                                <div className={`${showCategories ? 'hidden md:grid' : 'grid'} ${viewMode === 'grid3' ? 'grid-cols-3 gap-1 md:gap-4' : 'grid-cols-2 gap-4 md:gap-6'} md:grid-cols-3 lg:grid-cols-4`}>
                                    {filteredProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            hideDetails={viewMode === 'grid3'}
                                            disableHover={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <BottomNav />
            <MobileFilterSheet
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filterSections={filterSections}
                toggleFilterSection={toggleFilterSection}
                productTypes={productTypes}
                occasions={occasions}
                colors={colors}
                materials={materials}
                cities={cities}
                maxPrice={maxPrice}
                pendingProductTypes={pendingProductTypes}
                pendingOccasions={pendingOccasions}
                pendingColors={pendingColors}
                pendingMaterials={pendingMaterials}
                pendingCities={pendingCities}
                pendingPriceRange={pendingPriceRange}
                sortBy={sortBy}
                toggleFilter={toggleFilter}
                setPendingPriceRange={setPendingPriceRange}
                setSortBy={setSortBy}
                onApply={handleMobileApply}
                onClear={handleMobileClear}
                appliedCount={getFilterCount()}
            />
        </>
    );
}

