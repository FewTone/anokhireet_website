"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

interface Product {
    id: string | number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
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

    // Filter states
    const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

    // Filter options data
    const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [occasions, setOccasions] = useState<Array<{ id: string; name: string }>>([]);
    const [colors, setColors] = useState<Array<{ id: string; name: string; hex?: string }>>([]);
    const [materials, setMaterials] = useState<Array<{ id: string; name: string }>>([]);
    const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);

    // Filter sections collapse state
    const [filterSections, setFilterSections] = useState<FilterSection[]>([
        { id: "sort", title: "SORT", isOpen: true },
        { id: "product_type", title: "PRODUCT TYPE", isOpen: false },
        { id: "occasion", title: "OCCASION", isOpen: false },
        { id: "color", title: "COLOR", isOpen: false },
        { id: "material", title: "MATERIAL", isOpen: false },
        { id: "city", title: "AVAILABLE CITY", isOpen: false },
        { id: "price", title: "RENTAL PRICE", isOpen: true },
    ]);

    // Category tags (can be made dynamic later)
    const categoryTags = ["ALL", "NEW", "FORMAL", "BLACK", "LUXE", "PLUS SIZE", "SLIM", "LINEN", "KOREAN", "CHINOS", "GURKHA", "BEIGE", "RELAXED", "BAGGY", "DENIM"];
    const [activeTag, setActiveTag] = useState("ALL");

    // Load filter options and products
    useEffect(() => {
        loadFilterOptions();
        loadProducts();
    }, []);

    // Check URL params for auto-filtering (runs after filter options are loaded)
    useEffect(() => {
        const productTypeParam = searchParams.get("product_type");
        const occasionParam = searchParams.get("occasion");

        if (productTypeParam && productTypes.length > 0) {
            const type = productTypes.find(pt => pt.id === productTypeParam);
            if (type && !selectedProductTypes.includes(productTypeParam)) {
                setSelectedProductTypes([productTypeParam]);
                setCategoryName(type.name.toUpperCase());
            }
        } else if (productTypeParam && selectedProductTypes.length === 0) {
            // Wait for product types to load
            supabase
                .from("product_types")
                .select("id, name")
                .eq("id", productTypeParam)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setSelectedProductTypes([data.id]);
                        setCategoryName(data.name.toUpperCase());
                    }
                });
        }

        if (occasionParam && occasions.length > 0) {
            const occasion = occasions.find(oc => oc.id === occasionParam);
            if (occasion && !selectedOccasions.includes(occasionParam)) {
                setSelectedOccasions([occasionParam]);
                setCategoryName(occasion.name.toUpperCase());
            }
        } else if (occasionParam && selectedOccasions.length === 0) {
            // Wait for occasions to load
            supabase
                .from("occasions")
                .select("id, name")
                .eq("id", occasionParam)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setSelectedOccasions([data.id]);
                        setCategoryName(data.name.toUpperCase());
                    }
                });
        }
    }, [searchParams, productTypes, occasions]);

    // Filter products when filters or products change
    useEffect(() => {
        if (!loading && products.length >= 0) {
            applyFilters();
        }
    }, [products, selectedProductTypes, selectedOccasions, selectedColors, selectedMaterials, selectedCities, priceRange, sortBy, loading]);

    const loadFilterOptions = async () => {
        try {
            const [productTypesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                supabase.from("product_types").select("id, name").order("display_order", { ascending: true }),
                supabase.from("occasions").select("id, name").order("display_order", { ascending: true }),
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
                    };
                });

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

    const applyFilters = async () => {
        if (products.length === 0) {
            setFilteredProducts([]);
            return;
        }

        try {
            let filteredProductIds: Set<string> | null = null;

            // Filter by Product Types
            if (selectedProductTypes.length > 0) {
                const { data: typeProducts } = await supabase
                    .from("product_product_types")
                    .select("product_id")
                    .in("type_id", selectedProductTypes);

                if (typeProducts && typeProducts.length > 0) {
                    const ids = new Set(typeProducts.map((tp: any) => String(tp.product_id)));
                    filteredProductIds = ids;
                } else {
                    setFilteredProducts([]);
                    return;
                }
            }

            // Filter by Occasions (intersect with existing)
            if (selectedOccasions.length > 0) {
                const { data: occasionProducts } = await supabase
                    .from("product_occasions")
                    .select("product_id")
                    .in("occasion_id", selectedOccasions);

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
            if (selectedColors.length > 0) {
                const { data: colorProducts } = await supabase
                    .from("product_colors")
                    .select("product_id")
                    .in("color_id", selectedColors);

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
            if (selectedMaterials.length > 0) {
                const { data: materialProducts } = await supabase
                    .from("product_materials")
                    .select("product_id")
                    .in("material_id", selectedMaterials);

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
            if (selectedCities.length > 0) {
                const { data: cityProducts } = await supabase
                    .from("product_cities")
                    .select("product_id")
                    .in("city_id", selectedCities);

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
                return price >= priceRange[0] && price <= priceRange[1];
            });

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
                return sorted.reverse(); // Already sorted by newest in loadProducts
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
                setSelectedProductTypes(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'occasion':
                setSelectedOccasions(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'color':
                setSelectedColors(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'material':
                setSelectedMaterials(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
            case 'city':
                setSelectedCities(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
                break;
        }
    };

    const clearAllFilters = () => {
        setSelectedProductTypes([]);
        setSelectedOccasions([]);
        setSelectedColors([]);
        setSelectedMaterials([]);
        setSelectedCities([]);
        setPriceRange([0, 5000]);
        setActiveTag("ALL");
        router.push('/products');
    };

    const getFilterCount = () => {
        let count = 0;
        if (selectedProductTypes.length > 0) count += selectedProductTypes.length;
        if (selectedOccasions.length > 0) count += selectedOccasions.length;
        if (selectedColors.length > 0) count += selectedColors.length;
        if (selectedMaterials.length > 0) count += selectedMaterials.length;
        if (selectedCities.length > 0) count += selectedCities.length;
        if (priceRange[0] > 0 || priceRange[1] < 5000) count += 1;
        return count;
    };

    const updatePriceRange = (index: number, value: number) => {
        setPriceRange(prev => {
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
                                        <div className="mt-2">
                                            <div className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                                                {[
                                                    { value: "newest", label: "Newest First" },
                                                    { value: "price_low", label: "Price: Low to High" },
                                                    { value: "price_high", label: "Price: High to Low" },
                                                ].map((option, index) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setSortBy(option.value);
                                                            setFilteredProducts(sortProducts(filteredProducts, option.value));
                                                        }}
                                                        className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 transition-colors ${
                                                            sortBy === option.value
                                                                ? "bg-blue-400 text-white"
                                                                : "text-white hover:bg-gray-600"
                                                        } ${index !== 0 ? 'border-t border-gray-600' : ''}`}
                                                    >
                                                        <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                                                            {sortBy === option.value && (
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span>{option.label}</span>
                                                    </button>
                                                ))}
                                            </div>
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
                                                        checked={selectedProductTypes.includes(type.id)}
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
                                                        checked={selectedOccasions.includes(occasion.id)}
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
                                                        checked={selectedColors.includes(color.id)}
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
                                                        checked={selectedMaterials.includes(material.id)}
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
                                                        checked={selectedCities.includes(city.id)}
                                                        onChange={() => toggleFilter('city', city.id)}
                                                        className="w-4 h-4 border-gray-300 rounded"
                                                    />
                                                    <span className="text-sm">{city.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* RENTAL PRICE */}
                                <div className="border-b border-gray-200 pb-3 mb-3">
                                    <button
                                        onClick={() => toggleFilterSection("price")}
                                        className="w-full flex items-center justify-between text-sm font-medium"
                                    >
                                        <span>RENTAL PRICE</span>
                                        <span>{filterSections.find(s => s.id === "price")?.isOpen ? "−" : "+"}</span>
                                    </button>
                                    {filterSections.find(s => s.id === "price")?.isOpen && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs mb-4">
                                                <span>₹{priceRange[0]}</span>
                                                <span>₹{priceRange[1]}</span>
                                            </div>
                                            
                                            {/* Min Price Input */}
                                            <div className="mb-3">
                                                <label className="text-xs text-gray-600 mb-1 block">Min Price</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={priceRange[1]}
                                                    step="50"
                                                    value={priceRange[0]}
                                                    onChange={(e) => {
                                                        const minValue = Math.min(Math.max(0, Number(e.target.value)), priceRange[1]);
                                                        setPriceRange([minValue, priceRange[1]]);
                                                    }}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                />
                                            </div>
                                            
                                            {/* Max Price Input */}
                                            <div className="mb-4">
                                                <label className="text-xs text-gray-600 mb-1 block">Max Price</label>
                                                <input
                                                    type="number"
                                                    min={priceRange[0]}
                                                    max="5000"
                                                    step="50"
                                                    value={priceRange[1]}
                                                    onChange={(e) => {
                                                        const maxValue = Math.max(Math.min(5000, Number(e.target.value)), priceRange[0]);
                                                        setPriceRange([priceRange[0], maxValue]);
                                                    }}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                />
                                            </div>
                                            
                                            {/* Dual Range Slider */}
                                            <div className="relative h-8">
                                                {/* Background track */}
                                                <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-lg transform -translate-y-1/2"></div>
                                                
                                                {/* Active range track */}
                                                <div
                                                    className="absolute top-1/2 h-1.5 bg-black rounded-lg transform -translate-y-1/2"
                                                    style={{
                                                        left: `${(priceRange[0] / 5000) * 100}%`,
                                                        width: `${((priceRange[1] - priceRange[0]) / 5000) * 100}%`
                                                    }}
                                                ></div>
                                                
                                                {/* Min price slider */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="5000"
                                                    step="50"
                                                    value={priceRange[0]}
                                                    onChange={(e) => {
                                                        const minValue = Math.min(Number(e.target.value), priceRange[1]);
                                                        setPriceRange([minValue, priceRange[1]]);
                                                    }}
                                                    className="absolute top-1/2 left-0 right-0 w-full h-0 appearance-none cursor-pointer transform -translate-y-1/2 z-10"
                                                    style={{ background: 'transparent' }}
                                                />
                                                
                                                {/* Max price slider */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="5000"
                                                    step="50"
                                                    value={priceRange[1]}
                                                    onChange={(e) => {
                                                        const maxValue = Math.max(Number(e.target.value), priceRange[0]);
                                                        setPriceRange([priceRange[0], maxValue]);
                                                    }}
                                                    className="absolute top-1/2 left-0 right-0 w-full h-0 appearance-none cursor-pointer transform -translate-y-1/2 z-10"
                                                    style={{ background: 'transparent' }}
                                                />
                                                
                                                <style jsx>{`
                                                    input[type="range"]::-webkit-slider-thumb {
                                                        appearance: none;
                                                        width: 16px;
                                                        height: 16px;
                                                        background: #000;
                                                        border-radius: 50%;
                                                        cursor: pointer;
                                                        position: relative;
                                                        z-index: 20;
                                                    }
                                                    input[type="range"]::-moz-range-thumb {
                                                        width: 16px;
                                                        height: 16px;
                                                        background: #000;
                                                        border-radius: 50%;
                                                        cursor: pointer;
                                                        border: none;
                                                        position: relative;
                                                        z-index: 20;
                                                    }
                                                    input[type="range"]::-webkit-slider-runnable-track {
                                                        background: transparent;
                                                        height: 0;
                                                    }
                                                    input[type="range"]::-moz-range-track {
                                                        background: transparent;
                                                        height: 0;
                                                    }
                                                `}</style>
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
                                        onClick={applyFilters}
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
                                <h1 className="text-3xl font-bold mb-4">{categoryName || "ALL PRODUCTS"}</h1>
                                
                                {/* Category Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
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

                                {/* Product Count */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-gray-600">
                                        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                                    </span>
                                </div>
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
        </>
    );
}

