"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName, getUserInitials } from "@/lib/utils";

interface Product {
    id: number | string;
    productId?: string;
    name: string;
    price: string;
    image: string;
    images?: string[];
    category?: string;
    original_price?: number | string;
    owner_user_id?: string;
    description?: string;
    product_types?: string[];
    occasions?: string[];
    colors?: string[];
    materials?: string[];
    cities?: string[];
    ownerName?: string;
    ownerAvatar?: string;
    db_id?: string;
}

interface Facet {
    id: string;
    name: string;
}

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = params?.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (searchParams?.get("edit") === "true") {
            setIsEditing(true);
        }
    }, [searchParams]);

    // Form States
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [description, setDescription] = useState("");

    // Facet Selection States
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);

    // Available Facets Data
    const [availableCities, setAvailableCities] = useState<Facet[]>([]);
    const [availableColors, setAvailableColors] = useState<Facet[]>([]);
    const [availableMaterials, setAvailableMaterials] = useState<Facet[]>([]);
    const [availableOccasions, setAvailableOccasions] = useState<Facet[]>([]);
    const [availableProductTypes, setAvailableProductTypes] = useState<Facet[]>([]);


    // Gallery State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Accordions State: Matches PDP default state (false, false, false - but user wanted editable usually Details open)
    // Actually PDP Accordions.tsx defaults all to false. But in previous messages I saw "Details" open. I'll stick to a default.
    const [expandedSections, setExpandedSections] = useState({
        availability: false,
        details: false,
        occasion: false
    });

    const [views, setViews] = useState(0);
    const [impressions, setImpressions] = useState(0);
    const [likes, setLikes] = useState(0);
    const [inquiries, setInquiries] = useState(0);

    useEffect(() => {
        if (productId) {
            fetchProduct();
            fetchFacets();
        }
    }, [productId]);

    const fetchFacets = async () => {
        try {
            const [typesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                supabase.from("product_types").select("id, name").order("name"),
                supabase.from("occasions").select("id, name").order("name"),
                supabase.from("colors").select("id, name").order("name"),
                supabase.from("materials").select("id, name").order("name"),
                supabase.from("cities").select("id, name").order("name")
            ]);

            if (typesRes.data) setAvailableProductTypes(typesRes.data);
            if (occasionsRes.data) setAvailableOccasions(occasionsRes.data);
            if (colorsRes.data) setAvailableColors(colorsRes.data);
            if (materialsRes.data) setAvailableMaterials(materialsRes.data);
            if (citiesRes.data) setAvailableCities(citiesRes.data);

        } catch (error) {
            console.error("Error fetching facets:", error);
        }
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", productId)
                .single();

            if (error) throw error;

            if (data) {
                // Determine owner name/avatar
                let ownerNameData = "";
                let ownerAvatarData = "";

                if (data.owner_user_id) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('name, avatar_url')
                        .eq('id', data.owner_user_id)
                        .single();

                    if (userData) {
                        ownerNameData = userData.name;
                        ownerAvatarData = userData.avatar_url;
                    }
                } else if ((data as any).users) {
                    ownerNameData = (data as any).users?.name;
                    ownerAvatarData = (data as any).users?.avatar_url;
                }

                // Fetch Product Relations (Facets)
                const [productTypesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                    supabase.from("product_product_types").select("type_id").eq("product_id", data.id),
                    supabase.from("product_occasions").select("occasion_id").eq("product_id", data.id),
                    supabase.from("product_colors").select("color_id").eq("product_id", data.id),
                    supabase.from("product_materials").select("material_id").eq("product_id", data.id),
                    supabase.from("product_cities").select("city_id").eq("product_id", data.id),
                ]);

                const getIds = (res: any, col: string) => res.data?.map((r: any) => r[col]).filter(Boolean) || [];

                const typeIds = getIds(productTypesRes, "type_id");
                const occasionIds = getIds(occasionsRes, "occasion_id");
                const colorIds = getIds(colorsRes, "color_id");
                const materialIds = getIds(materialsRes, "material_id");
                const cityIds = getIds(citiesRes, "city_id");

                // Fetch Names for these IDs
                const [typesData, occasionsData, colorsData, materialsData, citiesData] = await Promise.all([
                    typeIds.length ? supabase.from("product_types").select("name").in("id", typeIds) : { data: [] },
                    occasionIds.length ? supabase.from("occasions").select("name").in("id", occasionIds) : { data: [] },
                    colorIds.length ? supabase.from("colors").select("name, hex").in("id", colorIds) : { data: [] },
                    materialIds.length ? supabase.from("materials").select("name").in("id", materialIds) : { data: [] },
                    cityIds.length ? supabase.from("cities").select("name").in("id", cityIds) : { data: [] },
                ]);

                // Fetch Analytics (Impressions, Views, Likes, Inquiries)
                const [viewsRes, wishlistRes, inquiriesRes] = await Promise.all([
                    supabase.from("product_views").select("view_type").eq("product_id", data.id),
                    supabase.from("wishlist").select("id", { count: 'exact', head: true }).eq("product_id", data.id),
                    supabase.from("inquiries").select("id", { count: 'exact', head: true }).eq("product_id", data.id),
                ]);

                const productViews = viewsRes.data || [];
                const vCount = productViews.filter(v => v.view_type === 'page_view').length;
                const impCount = productViews.filter(v => v.view_type === 'impression').length;
                const likesCount = wishlistRes.count || 0;
                const inqsCount = inquiriesRes.count || 0;

                setViews(vCount);
                setImpressions(impCount);
                setLikes(likesCount);
                setInquiries(inqsCount);

                const getNames = (res: any) => res.data?.map((r: any) => r.name) || [];
                const getColorObjs = (res: any) => res.data?.map((r: any) => ({ name: r.name, hex: r.hex })) || [];

                const loadedTypes = getNames(typesData);
                const loadedOccasions = getNames(occasionsData);
                const loadedMaterials = getNames(materialsData);
                const loadedCities = getNames(citiesData);
                const loadedColors = getColorObjs(colorsData);
                const loadedColorNames = loadedColors.map((c: any) => c.name);

                const productData = {
                    ...data,
                    ownerName: ownerNameData ? formatUserDisplayName(ownerNameData) : "User",
                    ownerAvatar: ownerAvatarData,
                    db_id: data.id,
                    product_types: loadedTypes,
                    occasions: loadedOccasions,
                    materials: loadedMaterials,
                    cities: loadedCities,
                    colors: loadedColors
                };

                setProduct(productData);

                // Initialize Form
                setName(data.name || "");
                setPrice(data.price || "");
                setOriginalPrice(data.original_price || "");
                setDescription(data.description || "");

                // Initialize Facet Selections
                setSelectedCities(loadedCities);
                setSelectedColors(loadedColorNames);
                setSelectedMaterials(loadedMaterials);
                setSelectedOccasions(loadedOccasions);
                setSelectedProductTypes(loadedTypes);

                // Initialize Gallery
                if (data.images && data.images.length > 0) {
                    setSelectedImage(data.images[0]);
                } else if (data.image) {
                    setSelectedImage(data.image);
                }
            }
        } catch (error) {
            console.error("Error fetching product:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            setSaving(true);

            // 1. Update Product Details
            const { error } = await supabase
                .from("products")
                .update({
                    name,
                    price,
                    original_price: originalPrice,
                    description,
                    updated_at: new Date().toISOString()
                })
                .eq("id", productId);

            if (error) throw error;

            // 2. Update Relations
            const updateRelation = async (tableName: string, colId: string, selectedNames: string[], availableItems: Facet[]) => {
                const prodId = product?.db_id || productId;
                await supabase.from(tableName).delete().eq("product_id", prodId);
                if (selectedNames.length > 0) {
                    const idsToInsert = selectedNames
                        .map(name => availableItems.find(i => i.name === name)?.id)
                        .filter(id => id !== undefined);

                    if (idsToInsert.length > 0) {
                        await supabase.from(tableName).insert(
                            idsToInsert.map(id => ({
                                product_id: prodId,
                                [colId]: id
                            }))
                        );
                    }
                }
            };

            await Promise.all([
                updateRelation("product_cities", "city_id", selectedCities, availableCities),
                updateRelation("product_colors", "color_id", selectedColors, availableColors),
                updateRelation("product_materials", "material_id", selectedMaterials, availableMaterials),
                updateRelation("product_occasions", "occasion_id", selectedOccasions, availableOccasions),
                updateRelation("product_product_types", "type_id", selectedProductTypes, availableProductTypes),
            ]);

            alert("Product updated successfully!");

            if (product) {
                setProduct({
                    ...product,
                    name,
                    price,
                    original_price: originalPrice,
                    description,
                    cities: selectedCities,
                    colors: selectedColors,
                    materials: selectedMaterials,
                    occasions: selectedOccasions,
                    product_types: selectedProductTypes
                });
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Failed to update product.");
        } finally {
            setSaving(false);
        }
    };

    // Helper for Emoji assignment
    const getEmoji = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('party')) return '🎉';
        if (n.includes('wedding') || n.includes('marriage')) return '💍';
        if (n.includes('casual')) return '☕';
        if (n.includes('formal')) return '👔';
        if (n.includes('ethnic') || n.includes('traditional')) return '🪔';
        if (n.includes('festival') || n.includes('navratri') || n.includes('diwali')) return '✨';
        if (n.includes('winter')) return '❄️';
        if (n.includes('summer')) return '☀️';
        if (n.includes('vacation') || n.includes('holiday')) return '🏖️';
        if (n.includes('work') || n.includes('office')) return '💼';
        if (n.includes('date')) return '🍷';
        if (n.includes('gym') || n.includes('sport')) return '💪';
        return '🏷️';
    };

    const FacetSelector = ({
        label,
        selected,
        options,
        onChange,
        searchable = false,
        variant = 'default'
    }: {
        label?: string,
        selected: string[],
        options: Facet[],
        onChange: (newSelected: string[]) => void,
        searchable?: boolean,
        variant?: 'default' | 'card' | 'emoji' | 'minimal' | 'checkbox-list'
    }) => {
        const [searchTerm, setSearchTerm] = useState("");

        const filteredOptions = options.filter(option => {
            if (variant === 'checkbox-list') {
                if (searchable && searchTerm.trim() !== "") {
                    return option.name.toLowerCase().includes(searchTerm.toLowerCase());
                }
                return true;
            }

            if (!searchable) return true;
            if (selected.includes(option.name)) return true;
            if (searchTerm.trim() !== "") {
                return option.name.toLowerCase().includes(searchTerm.toLowerCase());
            }
            return false;
        });

        if (variant === 'checkbox-list') {
            return (
                <div className="mb-6">
                    {label && <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">{label}</label>}

                    {/* Selected Pills */}
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {selected.map(item => (
                                <button
                                    key={item}
                                    onClick={() => onChange(selected.filter(s => s !== item))}
                                    className="px-3 py-1 text-xs bg-black text-white border border-black rounded-full flex items-center gap-1 hover:bg-gray-800 transition-colors"
                                >
                                    {item}
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search (Conditional for this variant) */}
                    {searchable && (
                        <div className="relative mb-3">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={`Search ${label || "options"}...`}
                                className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:border-black focus:outline-none placeholder-gray-400"
                            />
                            <svg className="absolute right-2 top-2.5 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
                        </div>
                    )}

                    {/* Checkbox List */}
                    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-gray-50/30">
                        {filteredOptions.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {filteredOptions.map((option) => {
                                    const isSelected = selected.includes(option.name);
                                    return (
                                        <div
                                            key={option.id}
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => {
                                                if (isSelected) {
                                                    onChange(selected.filter(s => s !== option.name));
                                                } else {
                                                    onChange([...selected, option.name]);
                                                }
                                            }}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-black border-black text-white' : 'bg-white border-gray-300'}`}>
                                                {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                            <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{option.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500 italic">No options found</div>
                        )}
                    </div>
                </div>
            );
        }

        // Dynamic classes based on variant
        const containerClass = variant === 'card'
            ? "grid grid-cols-2 gap-3 max-h-60 overflow-y-auto"
            : "flex flex-wrap gap-2 max-h-48 overflow-y-auto";

        const getItemClass = (isSelected: boolean) => {
            const base = "transition-all duration-200 flex items-center justify-center gap-2";

            if (variant === 'card') {
                return `${base} p-4 border rounded-lg text-sm font-medium ${isSelected
                    ? "bg-black text-white border-black shadow-md"
                    : "bg-white text-gray-900 border-gray-200 hover:border-black hover:shadow-sm"
                    }`;
            }
            if (variant === 'emoji') {
                return `${base} px-4 py-2 border rounded-full text-sm ${isSelected
                    ? "bg-rose-50 text-rose-900 border-rose-200 font-medium"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`;
            }
            if (variant === 'minimal') {
                return `${base} px-2.5 py-1 text-xs border rounded-sm uppercase tracking-wider font-medium ${isSelected
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
                    }`;
            }
            // default
            return `${base} px-3 py-1 text-xs border rounded-full ${isSelected
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`;
        };

        return (
            <div className="mb-6">
                {label && <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">{label}</label>}
                {searchable && (
                    <div className="relative mb-3">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`Search ${label || "options"}...`}
                            className="w-full pl-3 pr-8 py-2 text-sm border-b border-gray-200 bg-transparent focus:border-black focus:outline-none placeholder-gray-400"
                        />
                        <svg className="absolute right-2 top-2.5 text-gray-300 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
                    </div>
                )}

                <div className={containerClass}>
                    {filteredOptions.map((option) => {
                        const isSelected = selected.includes(option.name);
                        return (
                            <button
                                key={option.id}
                                onClick={() => {
                                    if (isSelected) {
                                        onChange(selected.filter(s => s !== option.name));
                                    } else {
                                        onChange([...selected, option.name]);
                                    }
                                }}
                                className={getItemClass(isSelected)}
                            >
                                {variant === 'emoji' && <span className="text-lg leading-none">{getEmoji(option.name)}</span>}
                                <span>{option.name}</span>
                                {isSelected && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                    {filteredOptions.length === 0 && (
                        <p className="text-xs text-gray-500 italic py-2 col-span-full text-center">No matches found</p>
                    )}
                </div>
            </div>
        );
    };


    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollPosition = e.currentTarget.scrollLeft;
        const width = e.currentTarget.offsetWidth;
        const index = Math.round(scrollPosition / width);
        setActiveImageIndex(index);
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const formatPrice = (priceVal: string | number | undefined) => {
        if (!priceVal) return '';
        const val = priceVal.toString().replace(/[^0-9.]/g, '');
        const number = parseFloat(val);
        return isNaN(number) ? val : `₹${number.toLocaleString('en-IN')}`;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

    return (
        <div className="bg-white min-h-screen pb-12">
            <Navbar />

            {/* MATCHING PDP LAYOUT STRUCTURE */}
            {/* Original PDP: <main className="min-h-screen pt-0 pb-24 md:pb-12"><div className="max-w-[1400px] mx-auto px-0 md:px-4"><div className="grid ... gap-8 lg:gap-6"> */}
            <main className="min-h-screen pt-0 pb-24 md:pb-12">
                <div className="max-w-[1400px] mx-auto px-0 md:px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">

                        {/* LEFT COLUMN: Gallery (Identical to ProductGallery structure) */}
                        <div className="lg:col-span-7">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Mobile Carousel */}
                                <div className="md:hidden w-full relative">
                                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                                        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center pointer-events-auto bg-white rounded-full z-30 shadow-sm">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                                        </button>
                                    </div>
                                    <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[4/5] w-full bg-gray-100 relative" onScroll={handleScroll}>
                                        {images.map((img, index) => (
                                            <div key={index} className="w-full flex-shrink-0 snap-center snap-always relative" style={{ scrollSnapStop: 'always' }}>
                                                <Image src={img} alt={`${name} - View ${index + 1}`} fill className="object-cover" sizes="100vw" priority={index === 0} unoptimized />
                                            </div>
                                        ))}
                                        {images.length === 0 && <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                                    </div>
                                    {images.length > 1 && (
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
                                            {images.map((_, index) => (
                                                <div key={index} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${index === activeImageIndex ? 'bg-black w-4' : 'bg-white/70 backdrop-blur-sm'}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Gallery */}
                                <div className="hidden md:flex flex-1 w-full flex-col gap-4">
                                    {/* BREADCRUMB */}
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 mt-8">
                                        <Link href="/" className="hover:text-black transition-colors">Home</Link>
                                        <span>/</span>
                                        <Link href="/user?view=my-products" className="hover:text-black transition-colors">My Products</Link>
                                        <span>/</span>
                                        <span className="text-gray-900 font-medium truncate max-w-xs">Edit Page</span>
                                    </div>

                                    <div className="flex gap-6 justify-end items-start px-4">
                                        {/* Thumbnails */}
                                        <div className="flex flex-col gap-3 w-20 flex-shrink-0 pt-2">
                                            {images.map((img, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImage(img)}
                                                    className={`relative w-full aspect-[4/5] border-2 transition-all overflow-hidden bg-gray-50 ${selectedImage === img ? "border-black" : "border-gray-300 hover:border-gray-500"}`}
                                                >
                                                    <Image src={img} alt={`Thumb ${index + 1}`} fill className="object-cover" sizes="80px" unoptimized />
                                                </button>
                                            ))}
                                        </div>
                                        {/* Main Image */}
                                        <div className="relative w-full max-w-[500px] aspect-[4/5] bg-gray-100">
                                            {selectedImage ? (
                                                <Image src={selectedImage} alt={name} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 500px" priority unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">No Image</div>
                                            )}
                                        </div>
                                        {/* Spacer to match ProductGallery layout */}
                                        <div className="flex flex-col gap-3 pt-4 w-10"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Info & Actions */}
                        {/* KEY FIX: Added mt-0 lg:mt-24 to match PDP placement */}
                        <div className="lg:col-span-5 px-4 md:px-0 mt-0 lg:mt-24">
                            <div className="">
                                {/* PRODUCT INFO SECTION */}
                                <div className="bg-white space-y-6">
                                    <div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full text-2xl font-semibold mb-1 uppercase tracking-wide bg-transparent border-b border-gray-300 focus:border-black outline-none py-1 placeholder-gray-400"
                                                placeholder="PRODUCT NAME"
                                            />
                                        ) : (
                                            <h2 className="text-2xl font-semibold mb-1 uppercase tracking-wide">{name}</h2>
                                        )}
                                        <p className="text-sm text-gray-500 mb-4">Product ID: {product.productId || product.id}</p>

                                        {/* Pricing Information */}
                                        <div className="mb-6 space-y-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-md font-semibold text-gray-900 uppercase tracking-wider">RENT</span>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={price}
                                                        onChange={(e) => setPrice(e.target.value)}
                                                        className="w-full max-w-[150px] text-md font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-black outline-none py-0"
                                                        placeholder="Amount"
                                                    />
                                                ) : (
                                                    <span className="text-md font-semibold text-gray-900">
                                                        {formatPrice(price)}
                                                    </span>
                                                )}
                                            </div>

                                            {originalPrice && (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-normal text-gray-900 uppercase tracking-wider">MRP</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={originalPrice}
                                                            onChange={(e) => setOriginalPrice(e.target.value)}
                                                            className="w-full max-w-[150px] text-sm font-normal text-gray-900 bg-transparent border-b border-gray-300 focus:border-black outline-none py-0"
                                                            placeholder="Amount"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-normal text-gray-900">
                                                            {formatPrice(originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* PRODUCT PERFORMANCE ANALYTICS */}
                                        <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 gap-y-6 gap-x-8">
                                            <div className="flex flex-col items-center gap-1.5 text-center">
                                                <span className="text-[10px] font-normal text-gray-500 uppercase tracking-[0.2em]">Impressions</span>
                                                <span className="text-xl font-medium text-gray-900 leading-none">{impressions.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5 text-center">
                                                <span className="text-[10px] font-normal text-gray-500 uppercase tracking-[0.2em]">Page Views</span>
                                                <span className="text-xl font-medium text-gray-900 leading-none">{views.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5 text-center">
                                                <span className="text-[10px] font-normal text-gray-500 uppercase tracking-[0.2em]">Likes</span>
                                                <span className="text-xl font-medium text-gray-900 leading-none">{likes.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5 text-center">
                                                <span className="text-[10px] font-normal text-gray-500 uppercase tracking-[0.2em]">Inquiries</span>
                                                <span className="text-xl font-medium text-gray-900 leading-none">{inquiries.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Bar - MATCHING PDP ProductInfo logic for 'Your Product' button placement */}
                                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1001] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none md:static md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-none md:z-auto md:mt-4 grid grid-cols-2 gap-0 md:gap-3">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        // Reset
                                                        if (product) {
                                                            setName(product.name);
                                                            setPrice(product.price);
                                                            setOriginalPrice(String(product.original_price || ""));
                                                            setDescription(product.description || "");
                                                            setSelectedCities(product.cities?.map((c: any) => typeof c === 'string' ? c : c.name) || []);
                                                            setSelectedColors(product.colors?.map((c: any) => typeof c === 'string' ? c : c.name) || []);
                                                            setSelectedMaterials(product.materials?.map((c: any) => typeof c === 'string' ? c : c.name) || []);
                                                            setSelectedOccasions(product.occasions?.map((c: any) => typeof c === 'string' ? c : c.name) || []);
                                                            setSelectedProductTypes(product.product_types?.map((c: any) => typeof c === 'string' ? c : c.name) || []);
                                                        }
                                                    }}
                                                    className="bg-white text-black border border-gray-200 font-semibold py-4 px-4 hover:bg-gray-50 transition-all text-center uppercase tracking-wider text-sm md:text-base"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleUpdate}
                                                    disabled={saving}
                                                    className="bg-black text-white font-semibold py-4 px-4 hover:opacity-90 transition-opacity text-center uppercase tracking-wider text-sm md:text-base disabled:opacity-50"
                                                >
                                                    {saving ? "Updating..." : "Update Product"}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                // MATCHING "Your Product" box style from PDP but active
                                                // PDP: w-full bg-gray-100 text-gray-500 font-semibold py-4 px-6 ... border md:rounded-none
                                                className="col-span-2 w-full bg-black text-white font-semibold py-4 px-6 hover:opacity-90 transition-opacity text-center uppercase tracking-wider text-sm md:text-base md:rounded-none"
                                            >
                                                Edit Product
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Product Details Section Container - Matches PDP surrounding div */}
                                <div className="space-y-4 border-t border-gray-200 pt-6">

                                    {/* OWNER INFO SECTION - EXACT MATCH PDP */}
                                    <div className="flex items-center gap-3 mb-4 w-fit relative z-10 pointer-events-none">
                                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-base font-medium tracking-wide overflow-hidden border border-gray-200 relative">
                                            {product.ownerAvatar ? (
                                                <Image src={product.ownerAvatar} alt="Owner" fill className="object-cover" unoptimized />
                                            ) : (
                                                getUserInitials(product.ownerName || "User")
                                            )}
                                        </div>
                                        <div className="text-lg font-medium text-gray-900 underline-offset-4">
                                            {product.ownerName || "Unknown User"}
                                        </div>
                                    </div>

                                    {/* Product Information Accordion - Exact Match PDP */}
                                    <div className="space-y-0 border-t border-gray-200 pt-2">

                                        {/* ACCORDIONS content inline for editability */}
                                        <div className="max-w-2xl">
                                            {/* Availability Section */}
                                            <div className="border-b border-gray-100">
                                                <button onClick={() => toggleSection('availability')} className="w-full flex items-center justify-between py-4 text-left group">
                                                    <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Availability</span>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.availability ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                                                </button>
                                                <div className={`grid transition-all duration-300 ease-in-out ${expandedSections.availability ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0'}`}>
                                                    <div className="overflow-hidden">
                                                        {isEditing ? (
                                                            <FacetSelector selected={selectedCities} options={availableCities} onChange={setSelectedCities} searchable={true} label="Cities" />
                                                        ) : (
                                                            product.cities && product.cities.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                                                    {product.cities.map((city: any, i: number) => (
                                                                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{typeof city === 'string' ? city : city.name}</span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-500 italic">Availability information not specified</p>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Product Details Section */}
                                            <div className="border-b border-gray-100">
                                                <button onClick={() => toggleSection('details')} className="w-full flex items-center justify-between py-4 text-left group">
                                                    <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Product Details</span>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.details ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                                                </button>
                                                <div className={`grid transition-all duration-300 ease-in-out ${expandedSections.details ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0'}`}>
                                                    <div className="overflow-hidden">
                                                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                                                            {isEditing ? (
                                                                <>
                                                                    <div className="mb-4">
                                                                        <label className="block text-xs font-medium text-gray-900 mb-2">Description</label>
                                                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full p-2 border border-gray-300 rounded focus:border-black outline-none resize-none bg-white text-sm" placeholder="Enter product detailed description..." />
                                                                    </div>
                                                                    <FacetSelector label="Color" selected={selectedColors} options={availableColors} onChange={setSelectedColors} searchable={true} variant="checkbox-list" />
                                                                    <FacetSelector label="Type" selected={selectedProductTypes} options={availableProductTypes} onChange={setSelectedProductTypes} variant="checkbox-list" />
                                                                    <FacetSelector label="Material" selected={selectedMaterials} options={availableMaterials} onChange={setSelectedMaterials} variant="checkbox-list" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p className="whitespace-pre-line">{description || "No description available."}</p>
                                                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                                                        {/* Type removed as per request to match PDP image/structure */}

                                                                        {product.colors && product.colors.length > 0 && (
                                                                            <div>
                                                                                <span className="font-medium text-gray-900 block mb-2">Color</span>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {product.colors.map((c: any, i: number) => {
                                                                                        const colorName = typeof c === 'string' ? c : c.name;
                                                                                        // Try to find hex if available in object, or fallback to name/black
                                                                                        const colorValue = typeof c === 'object' && c.hex ? c.hex : colorName;

                                                                                        return (
                                                                                            <div
                                                                                                key={i}
                                                                                                title={colorName}
                                                                                                className="w-5 h-5 rounded-none border border-gray-200 shadow-sm relative group"
                                                                                                style={{ backgroundColor: colorValue || '#000' }}
                                                                                            >
                                                                                                <span className="sr-only">{colorName}</span>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {product.materials && product.materials.length > 0 && (
                                                                            <div className="col-span-2"><span className="font-medium text-gray-900 block mb-1">Material</span><p>{product.materials.map((m: any) => typeof m === 'string' ? m : m.name).join(", ")}</p></div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Occasion Section */}
                                            <div className="border-b border-gray-100">
                                                <button onClick={() => toggleSection('occasion')} className="w-full flex items-center justify-between py-4 text-left group">
                                                    <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Occasion</span>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.occasion ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                                                </button>
                                                <div className={`grid transition-all duration-300 ease-in-out ${expandedSections.occasion ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0'}`}>
                                                    <div className="overflow-hidden">
                                                        {isEditing ? (
                                                            <FacetSelector selected={selectedOccasions} options={availableOccasions} onChange={setSelectedOccasions} variant="checkbox-list" />
                                                        ) : (
                                                            product.occasions && product.occasions.length > 0 ? (
                                                                <div className="text-sm text-gray-600"><p>{product.occasions.map((o: any) => typeof o === 'string' ? o : o.name).join(", ")}</p></div>
                                                            ) : (
                                                                <p className="text-sm text-gray-500 italic">No occasion specified</p>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="pt-2"></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
