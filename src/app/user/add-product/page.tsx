"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { generateCustomProductId } from "@/lib/utils";

// Helper to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Convert image to WebP format with optimized quality and optional resizing
const convertToWebP = (file: File, quality: number = 0.75, maxWidth?: number, maxHeight?: number): Promise<{ blob: Blob; size: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");

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

// Convert image to WebP with aggressive optimization
const convertToWebPOptimized = async (file: File): Promise<{ blob: Blob; size: number }> => {
    const originalSize = file.size;
    let bestBlob: Blob | null = null;
    let bestSize = originalSize;

    const shouldResize = originalSize > 1024 * 1024; // 1MB
    const maxDimension = shouldResize ? 1920 : undefined;

    const qualityLevels = [0.7, 0.6, 0.5, 0.4, 0.3, 0.25];

    for (const quality of qualityLevels) {
        try {
            const { blob, size } = await convertToWebP(file, quality, maxDimension, maxDimension);
            if (size < bestSize) {
                bestBlob = blob;
                bestSize = size;
            }
            if (size < originalSize * 0.7) {
                break;
            }
        } catch (error) {
            continue;
        }
    }

    if (bestSize >= originalSize && !shouldResize) {
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

    if (!bestBlob || bestSize >= originalSize) {
        const { blob } = await convertToWebP(file, 0.25, 1920, 1920);
        return { blob, size: blob.size };
    }

    return { blob: bestBlob, size: bestSize };
};

export default function AddProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userCustomId, setUserCustomId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Form Data
    const [userProductFormData, setUserProductFormData] = useState({
        name: "",
        price: "",
        originalPrice: "",
        description: "",
        productTypes: [] as string[],
        occasions: [] as string[],
        colors: [] as string[],
        materials: [] as string[],
        cities: [] as string[],
    });

    // Available Facets (loaded from DB)
    const [availableProductTypes, setAvailableProductTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [availableOccasions, setAvailableOccasions] = useState<Array<{ id: string; name: string }>>([]);
    const [availableColors, setAvailableColors] = useState<Array<{ id: string; name: string }>>([]);
    const [availableMaterials, setAvailableMaterials] = useState<Array<{ id: string; name: string }>>([]);
    const [availableCities, setAvailableCities] = useState<Array<{ id: string; name: string }>>([]);

    // Image State
    const [userProductImageFiles, setUserProductImageFiles] = useState<File[]>([]);
    const [userProductImagePreviews, setUserProductImagePreviews] = useState<string[]>([]);
    const [imageSizeInfo, setImageSizeInfo] = useState<Array<{ original: number; converted: number; name: string }>>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadUser();
        loadAllFacets();
    }, []);

    const loadUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: userData } = await supabase
                .from("users")
                .select("id, custom_id")
                .or(`id.eq.${session.user.id},auth_user_id.eq.${session.user.id}`)
                .maybeSingle();

            if (userData) {
                setUserId(userData.id);
                setUserCustomId(userData.custom_id);

                if (!userData.custom_id) {
                    alert("Please complete your profile (Select State) to generate your User ID before adding products.");
                    router.push("/user?view=profile");
                    return;
                }
            } else {
                console.error("User profile not found");
                // Optionally handle case where profile doesn't exist yet
            }
            setLoading(false);
        } else {
            router.push("/profile");
        }
    };

    const loadAllFacets = async () => {
        try {
            const [productTypesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                supabase.from("product_types").select("id, name").order("name", { ascending: true }),
                supabase.from("occasions").select("id, name").order("name", { ascending: true }),
                supabase.from("colors").select("id, name").order("name", { ascending: true }),
                supabase.from("materials").select("id, name").order("name", { ascending: true }),
                supabase.from("cities").select("id, name").order("name", { ascending: true })
            ]);

            if (productTypesRes.data) setAvailableProductTypes(productTypesRes.data);
            if (occasionsRes.data) setAvailableOccasions(occasionsRes.data);
            if (colorsRes.data) setAvailableColors(colorsRes.data);
            if (materialsRes.data) setAvailableMaterials(materialsRes.data);
            if (citiesRes.data) setAvailableCities(citiesRes.data);
        } catch (error) {
            console.error("Error loading facets:", error);
            setError("Failed to load categories. Please try again.");
        }
    };

    const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                setError("Please select only image files");
                e.target.value = "";
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError(`Image "${file.name}" is too large (max 10MB)`);
                e.target.value = "";
                return;
            }
        }
        setError("");

        const processPromises = files.map(async (file) => {
            const originalSize = file.size;
            try {
                const { blob, size: convertedSize } = await convertToWebPOptimized(file);

                const preview = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });

                const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                    type: "image/webp",
                });

                return {
                    file: convertedFile,
                    preview,
                    sizeInfo: { original: originalSize, converted: convertedSize, name: file.name },
                };
            } catch (error) {
                console.error("Error converting image:", error);
                const preview = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                return {
                    file,
                    preview,
                    sizeInfo: { original: originalSize, converted: originalSize, name: file.name },
                };
            }
        });

        const processed = await Promise.all(processPromises);

        const newFiles = processed.map(p => p.file);
        const newPreviews = processed.map(p => p.preview);
        const newSizeInfo = processed.map(p => p.sizeInfo);

        setUserProductImageFiles(prev => [...prev, ...newFiles]);
        setUserProductImagePreviews(prev => {
            const allPreviews = [...prev, ...newPreviews];
            if (prev.length === 0 && allPreviews.length > 0) {
                setPrimaryImageIndex(0);
            }
            return allPreviews;
        });
        setImageSizeInfo(prev => [...prev, ...newSizeInfo]);
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        const newFiles = userProductImageFiles.filter((_, i) => i !== index);
        const newPreviews = userProductImagePreviews.filter((_, i) => i !== index);
        const newSizeInfo = imageSizeInfo.filter((_, i) => i !== index);

        setUserProductImageFiles(newFiles);
        setUserProductImagePreviews(newPreviews);
        setImageSizeInfo(newSizeInfo);

        if (primaryImageIndex === index) {
            setPrimaryImageIndex(0);
        } else if (primaryImageIndex > index) {
            setPrimaryImageIndex(prev => prev - 1);
        }
    };

    const uploadImageToSupabase = async (file: File): Promise<string> => {
        if (!userId) throw new Error("User ID not found");

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileName = `user-products/${userId}/${timestamp}-${randomStr}.webp`;

        const { data, error } = await supabase.storage
            .from("product-images")
            .upload(fileName, file, { contentType: "image/webp", upsert: false });

        if (error) {
            console.warn("Upload to product-images failed, trying products bucket", error);
            const { data: data2, error: error2 } = await supabase.storage
                .from("products")
                .upload(fileName, file, { contentType: "image/webp", upsert: false });

            if (error2) throw error2;

            const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(fileName);
            return publicUrlData.publicUrl;
        }

        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!userId) {
            setError("User session inactive. Please login again.");
            return;
        }

        // Final validation
        if (userProductImageFiles.length === 0) {
            setError("Please upload at least one image.");
            return;
        }

        const totalFacets = userProductFormData.productTypes.length +
            userProductFormData.occasions.length +
            userProductFormData.colors.length +
            userProductFormData.materials.length +
            userProductFormData.cities.length;

        if (totalFacets === 0) {
            setError("Please select at least one category/filter in Step 2.");
            return;
        }

        setIsUploadingImage(true);

        try {
            // 0. Check for existing drafts or pending listings
            const { count, error: countError } = await supabase
                .from("products")
                .select("*", { count: 'exact', head: true })
                .eq("owner_user_id", userId)
                .in("status", ["draft", "pending"]);

            if (countError) throw countError;

            if (count && count >= 1) {
                setError("You already have an active draft or pending listing. Please wait for approval or delete your existing draft.");
                setIsUploadingImage(false);
                return;
            }

            // 1.5 Get Product Count for ID generation
            if (!userCustomId) {
                setError("User ID not found. Please update your profile.");
                setIsUploadingImage(false);
                return;
            }

            const { count: productCount, error: countError2 } = await supabase
                .from("products")
                .select("*", { count: 'exact', head: true })
                .eq("owner_user_id", userId);

            if (countError2) throw countError2;

            const customProductId = generateCustomProductId(userCustomId, productCount || 0);

            // 1. Upload Images
            const uploadedImageUrls: string[] = [];
            for (const file of userProductImageFiles) {
                const url = await uploadImageToSupabase(file);
                uploadedImageUrls.push(url);
            }

            let validPrimaryIndex = primaryImageIndex;
            if (validPrimaryIndex < 0 || validPrimaryIndex >= uploadedImageUrls.length) {
                validPrimaryIndex = 0;
            }

            const primaryImageUrl = uploadedImageUrls[validPrimaryIndex];
            // Keep the internal product_id as unique string, but also store custom_id
            const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            // 2. Insert Product
            const originalPriceVal = userProductFormData.originalPrice ? parseFloat(userProductFormData.originalPrice) : null;

            console.log("Inserting product with owner:", userId, "CustomID:", customProductId);

            const { data: insertedProduct, error: insertError } = await supabase
                .from("products")
                .insert({
                    product_id: productId,
                    custom_id: customProductId,
                    name: userProductFormData.name,
                    title: userProductFormData.name,
                    price: userProductFormData.price,
                    original_price: originalPriceVal,
                    description: userProductFormData.description,
                    image: primaryImageUrl,
                    images: uploadedImageUrls,
                    primary_image_index: validPrimaryIndex,
                    owner_user_id: userId,
                    status: 'draft',
                    is_active: false
                })
                .select()
                .single();

            if (insertError) {
                console.error("Product insert error:", insertError);
                throw insertError;
            }

            // 3. Insert Facets
            const facetPromises: Promise<any>[] = [];

            // Helper to get IDs and insert
            const addFacets = (selectedNames: string[], availableList: any[], tableName: string, columnIdName: string) => {
                if (selectedNames.length > 0) {
                    const ids = selectedNames
                        .map(name => availableList.find(item => item.name === name)?.id)
                        .filter(id => id !== undefined);

                    if (ids.length > 0) {
                        facetPromises.push(
                            supabase.from(tableName).insert(
                                ids.map(id => ({
                                    product_id: insertedProduct.id,
                                    [columnIdName]: id
                                }))
                            ) as unknown as Promise<any>
                        );
                    }
                }
            };

            addFacets(userProductFormData.productTypes, availableProductTypes, "product_product_types", "type_id");
            addFacets(userProductFormData.occasions, availableOccasions, "product_occasions", "occasion_id");
            addFacets(userProductFormData.colors, availableColors, "product_colors", "color_id");
            addFacets(userProductFormData.materials, availableMaterials, "product_materials", "material_id");
            addFacets(userProductFormData.cities, availableCities, "product_cities", "city_id");

            await Promise.all(facetPromises);

            // Success & Redirect
            router.push("/user?view=my-products");

        } catch (err: any) {
            console.error("Full error object:", JSON.stringify(err, null, 2));
            console.error("Error details:", err);
            setError(err.message || err.error_description || (typeof err === 'object' ? JSON.stringify(err) : "Failed to create product."));
        } finally {
            setIsUploadingImage(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
            <div className="hidden md:block sticky top-0 z-50">
                <Navbar />
            </div>
            <div className="md:hidden sticky top-0 z-50">
                <MobileHeader title="Add Product" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
                <div className="bg-white rounded-none shadow-lg overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-xl font-semibold text-gray-900 uppercase tracking-wide">Add New Product</h3>
                        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-white">
                        <div className="flex items-center justify-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= 1 ? 'bg-black border-black text-white' : 'bg-gray-100 border-gray-300 text-gray-400'} text-xs font-bold`}>1</div>
                            <div className={`w-12 h-0.5 mx-2 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= 2 ? 'bg-black border-black text-white' : 'bg-gray-100 border-gray-300 text-gray-400'} text-xs font-bold`}>2</div>
                        </div>
                        <div className="flex justify-center gap-10 mt-1">
                            <span className={`text-xs ${currentStep >= 1 ? 'text-black font-semibold' : 'text-gray-400'}`}>Details</span>
                            <span className={`text-xs ${currentStep >= 2 ? 'text-black font-semibold' : 'text-gray-400'}`}>Filters</span>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-none text-sm mb-4 border border-red-100 flex items-center">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                {error}
                            </div>
                        )}

                        <form className="space-y-6">
                            {currentStep === 1 ? (
                                <>
                                    {/* Step 1: Basic Details & Images */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-none p-6">
                                        <label className="block text-sm font-semibold text-gray-800 mb-3">Upload Product Images *</label>
                                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-none bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all cursor-pointer group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-12 h-12 mb-3 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-gray-400">Multiple images allowed</p>
                                            </div>
                                            <input type="file" multiple accept="image/*" onChange={handleMultipleImagesChange} className="hidden" />
                                        </label>

                                        {/* Image Previews */}
                                        {userProductImagePreviews.length > 0 && (
                                            <div className="mt-4">
                                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                                                    {userProductImagePreviews.map((preview, index) => (
                                                        <div key={index} className="relative group aspect-square shadow-sm">
                                                            <button type="button" onClick={() => setPrimaryImageIndex(index)} className={`w-full h-full relative border-2 ${primaryImageIndex === index ? 'border-black' : 'border-transparent'}`}>
                                                                <Image src={preview} alt="" fill className="object-cover" unoptimized />
                                                                {primaryImageIndex === index && <div className="absolute top-1 right-1 w-4 h-4 bg-black rounded-full text-[10px] flex items-center justify-center text-white">✓</div>}
                                                            </button>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 font-medium">Select the main image to display on the card.</p>


                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                        <input type="text" value={userProductFormData.name} onChange={(e) => setUserProductFormData({ ...userProductFormData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black" required placeholder="e.g. Designer Saree" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rental Price *</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                                <input type="number" value={userProductFormData.price} onChange={(e) => setUserProductFormData({ ...userProductFormData, price: e.target.value })} className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" required placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Original Price *</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                                <input type="number" value={userProductFormData.originalPrice} onChange={(e) => setUserProductFormData({ ...userProductFormData, originalPrice: e.target.value })} className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" required placeholder="0.00" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea value={userProductFormData.description} onChange={(e) => setUserProductFormData({ ...userProductFormData, description: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black resize-none" placeholder="Details about condition, size, age of product, etc." />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Step 2: Facet Selection */}
                                    <div className="space-y-6">
                                        {[
                                            { label: "Product Type", list: availableProductTypes, key: 'productTypes' as const },
                                            { label: "Occasion", list: availableOccasions, key: 'occasions' as const },
                                            { label: "Color", list: availableColors, key: 'colors' as const },
                                            { label: "Material", list: availableMaterials, key: 'materials' as const },
                                            { label: "City", list: availableCities, key: 'cities' as const }
                                        ].map((section) => (
                                            <div key={section.key}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">{section.label}</label>
                                                </div>
                                                <div className="w-full border border-gray-300 rounded-none min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                                    {section.list.length === 0 ? (
                                                        <p className="text-sm text-gray-500 text-center py-4">No options available.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {section.list.map((item) => {
                                                                const isSelected = userProductFormData[section.key].includes(item.name);
                                                                return (
                                                                    <label
                                                                        key={item.id}
                                                                        className={`flex items-center gap-2 p-2 rounded-none cursor-pointer transition-colors ${isSelected
                                                                            ? "bg-blue-50 border border-blue-200"
                                                                            : "hover:bg-gray-50 border border-transparent"
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={(e) => {
                                                                                const current = userProductFormData[section.key];
                                                                                if (e.target.checked) {
                                                                                    setUserProductFormData({ ...userProductFormData, [section.key]: [...current, item.name] });
                                                                                } else {
                                                                                    setUserProductFormData({ ...userProductFormData, [section.key]: current.filter(n => n !== item.name) });
                                                                                }
                                                                            }}
                                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-none focus:ring-blue-500"
                                                                        />
                                                                        <span className="text-sm text-gray-700">{item.name}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="flex gap-4 pt-6 mt-8 border-t border-gray-100">
                                {currentStep === 2 ? (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-900 font-semibold rounded-none hover:bg-gray-50 transition-colors uppercase tracking-wider text-sm"
                                    >
                                        Back
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-900 font-semibold rounded-none hover:bg-gray-50 transition-colors uppercase tracking-wider text-sm"
                                    >
                                        Cancel
                                    </button>
                                )}

                                {currentStep === 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!userProductFormData.name || !userProductFormData.price || !userProductFormData.originalPrice || userProductImageFiles.length === 0) {
                                                setError("Please fill in all required fields and upload an image.");
                                                return;
                                            }
                                            setError("");
                                            setCurrentStep(2);
                                        }}
                                        className="flex-1 px-6 py-3 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-opacity uppercase tracking-wider text-sm shadow-md"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(e) => handleSubmit(e)}
                                        disabled={isUploadingImage}
                                        className="flex-1 px-6 py-3 bg-black text-white font-semibold rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-md"
                                    >
                                        {isUploadingImage ? "Submitting..." : "Submit Draft"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="md:hidden">
                <BottomNav />
            </div>
            <div className="hidden md:block">
                <Footer />
            </div>
        </div>
    );
}
