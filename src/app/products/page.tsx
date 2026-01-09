"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
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
    
    // Removed aliases - use applied states directly throughout the code
    
    const [maxPrice, setMaxPrice] = useState<number>(5000); // Dynamic max price from products
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load to prevent URL updates
    const [searchQuery, setSearchQuery] = useState<string>(""); // Search query for product ID or name

    // Filter options data
    const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string; image_url?: string | null }>>([]);
    const [occasions, setOccasions] = useState<Array<{ id: string; name: string; image_url?: string | null }>>([]);
    const [colors, setColors] = useState<Array<{ id: string; name: string; hex?: string }>>([]);
    const [materials, setMaterials] = useState<Array<{ id: string; name: string }>>([]);
    const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
    const [showCategories, setShowCategories] = useState(true); // Show categories section by default

    // Filter sections collapse state
    const [filterSections, setFilterSections] = useState<FilterSection[]>([
        { id: "sort", title: "SORT", isOpen: true },
        { id: "product_type", title: "PRODUCT TYPE", isOpen: false },
        { id: "occasion", title: "OCCASION", isOpen: false },
        { id: "color", title: "COLOR", isOpen: false },
        { id: "material", title: "MATERIAL", isOpen: false },
        { id: "city", title: "AVAILABLE CITY", isOpen: false },
        { id: "price", title: "PRICE", isOpen: true },
    ]);

    // Category tags (can be made dynamic later)
    const categoryTags = ["ALL", "NEW", "FORMAL", "BLACK", "LUXE", "PLUS SIZE", "SLIM", "LINEN", "KOREAN", "CHINOS", "GURKHA", "BEIGE", "RELAXED", "BAGGY", "DENIM"];
    const [activeTag, setActiveTag] = useState("ALL");

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
        const newUrl = params.toString() ? `/products?${params.toString()}` : '/products';
        const currentUrl = window.location.pathname + window.location.search;
        
        // Only update URL if it's different from current URL
        if (newUrl !== currentUrl) {
            router.replace(newUrl);
        }
    }, [appliedProductTypes, appliedOccasions, appliedColors, appliedMaterials, appliedCities, appliedPriceRange, sortBy, searchQuery, maxPrice, router]);

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

        if (productTypeParam && productTypes.length > 0) {
            const type = productTypes.find(pt => pt.id === productTypeParam);
            // Only update if different from current state
            if (type && !appliedProductTypes.includes(productTypeParam)) {
                setPendingProductTypes([productTypeParam]);
                setAppliedProductTypes([productTypeParam]);
                // Don't set categoryName - always show "PRODUCTS"
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
                        // Don't set categoryName - always show "PRODUCTS"
                    }
                });
        }

        if (occasionParam && occasions.length > 0) {
            const occasion = occasions.find(oc => oc.id === occasionParam);
            // Only update if different from current state
            if (occasion && !appliedOccasions.includes(occasionParam)) {
                setPendingOccasions([occasionParam]);
                setAppliedOccasions([occasionParam]);
                // Don't set categoryName - always show "PRODUCTS"
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
                        // Don't set categoryName - always show "PRODUCTS"
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
    }, [products, appliedProductTypes, appliedOccasions, appliedColors, appliedMaterials, appliedCities, appliedPriceRange, sortBy, searchQuery, loading, maxPrice, isInitialLoad, updateURLParams]);

    const loadFilterOptions = async () => {
        try {
            const [productTypesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                supabase.from("product_types").select("id, name, image_url").order("display_order", { ascending: true }),
                supabase.from("occasions").select("id, name, image_url").order("display_order", { ascending: true }),
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
            sections.map(section =>
                section.id === sectionId ? { ...section, isOpen: !section.isOpen } : section
            )
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
            <main className="min-h-screen pt-20 pb-12">
                <div className="max-w-[1400px] mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Sidebar - Filters */}
                        <aside className="w-full lg:w-64 flex-shrink-0">
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
                                    {filterSections.find(s => s.id === "sort")?.isOpen && (
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
                                    )}
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
                                    {filterSections.find(s => s.id === "product_type")?.isOpen && (
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
                                    )}
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
                                    {filterSections.find(s => s.id === "occasion")?.isOpen && (
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
                                    )}
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
                                    {filterSections.find(s => s.id === "color")?.isOpen && (
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
                                    )}
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
                                    {filterSections.find(s => s.id === "material")?.isOpen && (
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
                                    )}
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
                                            <div className="relative h-8 mb-2">
                                                {/* Background track (gray) */}
                                                <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded transform -translate-y-1/2"></div>
                                                
                                                {/* Active range track (thick black line between thumbs) */}
                                                <div
                                                    className="absolute top-1/2 h-2 bg-black rounded transform -translate-y-1/2"
                                                    style={{
                                                        left: `${(pendingPriceRange[0] / maxPrice) * 100}%`,
                                                        width: `${((pendingPriceRange[1] - pendingPriceRange[0]) / maxPrice) * 100}%`
                                                    }}
                                                ></div>
                                                
                                                {/* Min price slider */}
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
                                                    className="absolute top-1/2 left-0 right-0 w-full h-0 appearance-none cursor-pointer transform -translate-y-1/2 z-10 min-slider"
                                                />
                                                
                                                {/* Max price slider */}
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
                                                    className="absolute top-1/2 left-0 right-0 w-full h-0 appearance-none cursor-pointer transform -translate-y-1/2 z-10 max-slider"
                                                />
                                                
                                                <style jsx>{`
                                                    .min-slider::-webkit-slider-thumb,
                                                    .max-slider::-webkit-slider-thumb {
                                                        appearance: none;
                                                        width: 16px;
                                                        height: 16px;
                                                        background: #4b5563;
                                                        border-radius: 50%;
                                                        cursor: pointer;
                                                        position: relative;
                                                        z-index: 20;
                                                    }
                                                    .min-slider::-moz-range-thumb,
                                                    .max-slider::-moz-range-thumb {
                                                        width: 16px;
                                                        height: 16px;
                                                        background: #4b5563;
                                                        border-radius: 50%;
                                                        cursor: pointer;
                                                        border: none;
                                                        position: relative;
                                                        z-index: 20;
                                                    }
                                                    .min-slider::-webkit-slider-runnable-track,
                                                    .max-slider::-webkit-slider-runnable-track {
                                                        background: transparent;
                                                        height: 0;
                                                    }
                                                    .min-slider::-moz-range-track,
                                                    .max-slider::-moz-range-track {
                                                        background: transparent;
                                                        height: 0;
                                                    }
                                                `}</style>
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
                                <h1 className="text-3xl font-bold mb-4">PRODUCTS</h1>
                                
                                {/* Horizontal Category Tags - Mobile */}
                                <div className="flex md:hidden justify-start flex-nowrap overflow-x-auto gap-2 mb-6 px-4 -mx-4 scrollbar-hide pb-2">
                                    {["ALL", "ACCESSORIES", "TRENDING", "SALE", "PLUS SIZE"].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                if (tag === "ALL") {
                                                    clearCategoryFilter();
                                                } else {
                                                    setActiveTag(tag);
                                                }
                                            }}
                                            className={`px-4 py-1.5 text-xs border border-black whitespace-nowrap transition-all ${
                                                (activeTag === tag || (tag === "ALL" && activeTag === "ALL" && !categoryName))
                                                    ? "bg-black text-white"
                                                    : "bg-white hover:bg-gray-50"
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                {/* Desktop Category Tags */}
                                <div className="hidden md:flex flex-wrap gap-2 mb-4">
                                    {categoryTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setActiveTag(tag)}
                                            className={`px-4 py-1.5 text-xs border border-black whitespace-nowrap transition-all ${
                                                activeTag === tag
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
                                        <div className="space-y-2">
                                            {/* BESTSELLERS - Show all products sorted by popularity/newest */}
                                            <button
                                                onClick={() => {
                                                    clearCategoryFilter();
                                                    setActiveTag("ALL");
                                                }}
                                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-left flex-1">BESTSELLERS</span>
                                            </button>

                                            {/* NEW - Show newest products */}
                                            <button
                                                onClick={() => {
                                                    clearCategoryFilter();
                                                    setActiveTag("NEW");
                                                    setSortBy("newest");
                                                }}
                                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                                                        <span className="text-white font-bold text-lg">N</span>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-left flex-1">NEW</span>
                                            </button>

                                            {/* Product Types from Database */}
                                            {productTypes.slice(0, 8).map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => handleCategoryClick('product_type', type.id, type.name)}
                                                    className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                                        {type.image_url ? (
                                                            <Image
                                                                src={type.image_url}
                                                                alt={type.name}
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
                                                    <span className="font-bold text-left flex-1">{type.name.toUpperCase()}</span>
                                                </button>
                                            ))}

                                            {/* Occasions from Database */}
                                            {occasions.slice(0, 3).map((occasion) => (
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

                                {/* Selected Category Header */}
                                {categoryName && (
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold">{categoryName.toUpperCase()}</h2>
                                            <button
                                                onClick={clearCategoryFilter}
                                                className="text-sm text-gray-600 hover:text-black mt-1"
                                            >
                                                Clear filter
                                            </button>
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Product Count - When no category selected */}
                                {!categoryName && (
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-gray-600">
                                        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                                    </span>
                                </div>
                                )}
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
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {filteredProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <BottomNav />
        </>
    );
}

