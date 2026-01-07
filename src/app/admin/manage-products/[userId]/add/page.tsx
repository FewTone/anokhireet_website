"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import Popup from "@/components/Popup";
import { convertToWebPOptimized } from "@/lib/imageUtils";

interface User {
    id: string;
    name: string;
    phone: string;
    email: string | null;
}

export default function AddProductPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;
    
    const [user, setUser] = useState<User | null>(null);
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
    
    const [productFormData, setProductFormData] = useState({
        name: "",
        price: "",
        originalPrice: "",
        productTypes: [] as string[],
        occasions: [] as string[],
        colors: [] as string[],
        materials: [] as string[],
        cities: [] as string[],
    });
    const [availableProductTypes, setAvailableProductTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [availableOccasions, setAvailableOccasions] = useState<Array<{ id: string; name: string }>>([]);
    const [availableColors, setAvailableColors] = useState<Array<{ id: string; name: string }>>([]);
    const [availableMaterials, setAvailableMaterials] = useState<Array<{ id: string; name: string }>>([]);
    const [availableCities, setAvailableCities] = useState<Array<{ id: string; name: string }>>([]);
    const [productImages, setProductImages] = useState<string[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
    const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
    const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
    const [imageSizeInfo, setImageSizeInfo] = useState<Array<{ original: number; converted: number; name: string }>>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    useEffect(() => {
        if (userId) {
            loadUser();
            loadAllFacets();
        }
    }, [userId]);

    const loadUser = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("id, name, phone, email")
                .eq("id", userId)
                .single();

            if (error) throw error;
            if (data) setUser(data);
        } catch (error) {
            console.error("Error loading user:", error);
            showPopup("Failed to load user information", "error", "Error");
        } finally {
            setLoading(false);
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
        }
    };

    const showPopup = (message: string, type: "error" | "success" | "info" | "warning" = "info", title?: string) => {
        setPopup({ isOpen: true, message, type, title });
    };

    const closePopup = () => {
        setPopup({ ...popup, isOpen: false });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (popup.isOpen && popup.type === "error") {
            closePopup();
        }

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                showPopup("Please select only image files", "error", "Invalid File Type");
                e.target.value = "";
                return;
            }
            
            const maxSizeBytes = 5 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                showPopup(`Image "${file.name}" is too large (max 5MB)`, "error", "File Too Large");
                e.target.value = "";
                return;
            }
        }

        const processPromises = files.map(async (file) => {
            const originalSize = file.size;
            try {
                const converted = await convertToWebPOptimized(file);
                const convertedSize = converted.size;
                const convertedBlob = converted.blob;
                
                if (convertedSize < originalSize) {
                    const preview = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(convertedBlob);
                    });
                    // Convert blob to File for upload
                    const convertedFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, ".webp"), { type: "image/webp" });
                    return {
                        file: convertedFile,
                        preview,
                        sizeInfo: { original: originalSize, converted: convertedSize, name: file.name },
                    };
                } else {
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

        setProductImageFiles(prev => [...prev, ...newFiles]);
        setProductImagePreviews(prev => {
            const allPreviews = [...prev, ...newPreviews];
            if (productImages.length === 0 && prev.length === 0 && allPreviews.length > 0) {
                setPrimaryImageIndex(0);
            }
            return allPreviews;
        });
        setImageSizeInfo(prev => [...prev, ...newSizeInfo]);
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        const previewIndex = index - productImages.length;
        setProductImageFiles(prev => prev.filter((_, i) => i !== previewIndex));
        setProductImagePreviews(prev => prev.filter((_, i) => i !== previewIndex));
        setImageSizeInfo(prev => prev.filter((_, i) => i !== previewIndex));
        if (primaryImageIndex === index) {
            setPrimaryImageIndex(0);
        } else if (primaryImageIndex > index) {
            setPrimaryImageIndex(prev => prev - 1);
        }
    };

    const setPrimaryImage = (index: number) => {
        setPrimaryImageIndex(index);
    };

    const uploadImageToSupabase = async (file: File): Promise<string> => {
        const bucketName = "product-images";
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileName = `user-products/${userId}/${timestamp}-${randomStr}.webp`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                contentType: "image/webp",
                upsert: false,
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
            throw new Error("Failed to get public URL for uploaded image");
        }

        return urlData.publicUrl;
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // At least one facet must be selected (across all types)
        const totalFacetsSelected = 
            productFormData.productTypes.length +
            productFormData.occasions.length +
            productFormData.colors.length +
            productFormData.materials.length +
            productFormData.cities.length;
        
        if (totalFacetsSelected === 0) {
            showPopup("Please select at least one facet (product type, occasion, color, material, or city)", "warning", "Validation Error");
            return;
        }
        
        if (productImageFiles.length === 0) {
            showPopup("Please select at least one image file", "warning", "Validation Error");
            return;
        }

        setIsUploadingImage(true);
        try {
            const uploadedImageUrls: string[] = [];
            for (const file of productImageFiles) {
                try {
                    const url = await uploadImageToSupabase(file);
                    uploadedImageUrls.push(url);
                } catch (uploadError: any) {
                    setIsUploadingImage(false);
                    showPopup(`Image upload failed: ${uploadError.message}`, "error", "Image Upload Failed");
                    return;
                }
            }

            if (uploadedImageUrls.length === 0) {
                setIsUploadingImage(false);
                showPopup("At least one image is required.", "error", "Validation Error");
                return;
            }

            let validPrimaryIndex = primaryImageIndex;
            if (validPrimaryIndex < 0 || validPrimaryIndex >= uploadedImageUrls.length) {
                validPrimaryIndex = 0;
            }

            const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            const productData: any = {
                name: productFormData.name,
                price: productFormData.price,
                images: uploadedImageUrls,
                primary_image_index: validPrimaryIndex,
                product_id: productId,
                image: uploadedImageUrls[validPrimaryIndex],
            };

            if (productFormData.originalPrice && productFormData.originalPrice.trim() !== "") {
                const originalPriceNum = parseFloat(productFormData.originalPrice);
                if (!isNaN(originalPriceNum)) {
                    productData.original_price = originalPriceNum;
                }
            }

            // Verify admin session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session?.user) {
                throw new Error("No active session. Please log in as admin first.");
            }
            
            const { data: adminCheck, error: adminError } = await supabase
                .from("admins")
                .select("id, email, auth_user_id")
                .eq("auth_user_id", session.user.id)
                .maybeSingle();
            
            if (adminError || !adminCheck) {
                throw new Error("Permission denied. Only admins can create products.");
            }
            
            const insertData: any = {
                owner_user_id: userId,
                title: productData.name || "Untitled Product",
                name: productData.name || "Untitled Product",
                price: productData.price || "",
                price_per_day: productData.price ? parseFloat(productData.price) || null : null,
                image: productData.image || "",
                is_active: true,
            };
            
            const { data: insertedProduct, error: insertError } = await supabase
                .from("products")
                .insert(insertData)
                .select()
                .single();

            if (insertError) throw insertError;
            
            // Save facet associations to junction tables
            const facetPromises: Promise<any>[] = [];
            
            // Product Types
            if (productFormData.productTypes.length > 0) {
                const productTypeIds = productFormData.productTypes
                    .map(name => availableProductTypes.find(pt => pt.name === name)?.id)
                    .filter((id): id is string => id !== undefined);
                
                if (productTypeIds.length > 0) {
                    facetPromises.push(
                        supabase.from("product_product_types").insert(
                            productTypeIds.map(typeId => ({
                                product_id: insertedProduct.id,
                                type_id: typeId
                            }))
                        )
                    );
                }
            }
            
            // Occasions
            if (productFormData.occasions.length > 0) {
                const occasionIds = productFormData.occasions
                    .map(name => availableOccasions.find(oc => oc.name === name)?.id)
                    .filter((id): id is string => id !== undefined);
                
                if (occasionIds.length > 0) {
                    facetPromises.push(
                        supabase.from("product_occasions").insert(
                            occasionIds.map(occasionId => ({
                                product_id: insertedProduct.id,
                                occasion_id: occasionId
                            }))
                        )
                    );
                }
            }
            
            // Colors
            if (productFormData.colors.length > 0) {
                const colorIds = productFormData.colors
                    .map(name => availableColors.find(c => c.name === name)?.id)
                    .filter((id): id is string => id !== undefined);
                
                if (colorIds.length > 0) {
                    facetPromises.push(
                        supabase.from("product_colors").insert(
                            colorIds.map(colorId => ({
                                product_id: insertedProduct.id,
                                color_id: colorId
                            }))
                        )
                    );
                }
            }
            
            // Materials
            if (productFormData.materials.length > 0) {
                const materialIds = productFormData.materials
                    .map(name => availableMaterials.find(m => m.name === name)?.id)
                    .filter((id): id is string => id !== undefined);
                
                if (materialIds.length > 0) {
                    facetPromises.push(
                        supabase.from("product_materials").insert(
                            materialIds.map(materialId => ({
                                product_id: insertedProduct.id,
                                material_id: materialId
                            }))
                        )
                    );
                }
            }
            
            // Cities
            if (productFormData.cities.length > 0) {
                const cityIds = productFormData.cities
                    .map(name => availableCities.find(c => c.name === name)?.id)
                    .filter((id): id is string => id !== undefined);
                
                if (cityIds.length > 0) {
                    facetPromises.push(
                        supabase.from("product_cities").insert(
                            cityIds.map(cityId => ({
                                product_id: insertedProduct.id,
                                city_id: cityId
                            }))
                        )
                    );
                }
            }
            
            // Execute all facet insertions
            const facetResults = await Promise.all(facetPromises);
            const facetErrors = facetResults.filter(r => r.error).map(r => r.error);
            if (facetErrors.length > 0) {
                console.error("Some facet associations failed:", facetErrors);
            }
            
            showPopup("Product added successfully!", "success");
            
            // Redirect back to manage products page after a short delay
            setTimeout(() => {
                router.push(`/admin/manage-products/${userId}`);
            }, 1500);
            
        } catch (error: any) {
            showPopup(error.message || "Failed to save product", "error", "Error");
            console.error("Error saving product:", error);
        } finally {
            setIsUploadingImage(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
                            {user && (
                                <p className="text-sm text-gray-600 mt-1">For: {user.name} ({user.phone})</p>
                            )}
                        </div>
                        <button
                            onClick={() => router.push(`/admin/manage-products/${userId}`)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 1 ? 'bg-black border-black text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                <span className="font-semibold">1</span>
                            </div>
                            <div className={`w-24 h-1 mx-2 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 2 ? 'bg-black border-black text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                <span className="font-semibold">2</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-4 gap-16">
                        <div className="text-center">
                            <p className={`text-sm font-medium ${currentStep >= 1 ? 'text-black' : 'text-gray-400'}`}>Product Details</p>
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-medium ${currentStep >= 2 ? 'text-black' : 'text-gray-400'}`}>Facet Selection</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {currentStep === 1 ? (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            // Validate step 1
                            if (!productFormData.name.trim()) {
                                showPopup("Please enter a product name", "warning", "Validation Error");
                                return;
                            }
                            if (!productFormData.price.trim()) {
                                showPopup("Please enter a rental price", "warning", "Validation Error");
                                return;
                            }
                            if (!productFormData.originalPrice.trim()) {
                                showPopup("Please enter an original price", "warning", "Validation Error");
                                return;
                            }
                            if (productImageFiles.length === 0) {
                                showPopup("Please upload at least one product image", "warning", "Validation Error");
                                return;
                            }
                            // Move to step 2
                            setCurrentStep(2);
                        }} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={productFormData.name}
                                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="Enter product name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rental Price *
                            </label>
                            <input
                                type="text"
                                required
                                value={productFormData.price}
                                onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="e.g., ₹999"
                            />
                            <p className="text-xs text-gray-500 mt-1">The rental price for this outfit (required)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Original Price of Outfit *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={productFormData.originalPrice}
                                onChange={(e) => setProductFormData({ ...productFormData, originalPrice: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="e.g., 1299"
                            />
                            <p className="text-xs text-gray-500 mt-1">Original purchase price of the outfit (required)</p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                Upload Product Images *
                            </label>
                            <label
                                htmlFor="product-images-input"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">Multiple images supported (PNG, JPG, WEBP)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleMultipleImagesChange}
                                    className="hidden"
                                    id="product-images-input"
                                />
                            </label>
                            {imageSizeInfo.length > 0 && (
                                <div className="mt-3 border border-gray-200 rounded-lg bg-white">
                                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                        <h4 className="text-xs font-semibold text-gray-700 uppercase">Size Optimization</h4>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {imageSizeInfo.map((info, index) => {
                                            const isOptimized = info.converted < info.original;
                                            const reduction = isOptimized ? ((1 - info.converted / info.original) * 100).toFixed(1) : null;
                                            return (
                                                <div key={index} className="px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-xs font-medium text-gray-900 truncate max-w-[200px]">
                                                            {info.name}
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-500">{formatFileSize(info.original)}</span>
                                                            {isOptimized ? (
                                                                <>
                                                                    <span className="text-xs text-gray-400">→</span>
                                                                    <span className="text-xs font-semibold text-green-600">
                                                                        {formatFileSize(info.converted)}
                                                                    </span>
                                                                    <span className="text-xs text-blue-600 font-medium">-{reduction}%</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-gray-500 italic">(using original - optimization not beneficial)</span>
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

                        {productImagePreviews.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Product Images ({productImagePreviews.length})
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {productImagePreviews.map((preview, index) => (
                                        <div key={`preview-${index}`} className="relative group">
                                            <button
                                                type="button"
                                                onClick={() => setPrimaryImage(index)}
                                                className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all"
                                            >
                                                <Image
                                                    src={preview}
                                                    alt={`New image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className={`${primaryImageIndex === index ? 'bg-red-500' : 'bg-white/80'} rounded-full p-1.5 shadow-md`}>
                                                        <svg 
                                                            className={`w-5 h-5 ${primaryImageIndex === index ? 'text-white fill-white' : 'text-gray-400'}`} 
                                                            fill={primaryImageIndex === index ? "currentColor" : "none"} 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div
                                                    role="button"
                                                    aria-label="Remove image"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeImage(index);
                                                    }}
                                                    className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Click an image to set it as primary (shown on home page).
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.push(`/admin/manage-products/${userId}`)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-black text-white font-medium rounded hover:opacity-90 transition-opacity"
                            >
                                Next: Select Facets
                            </button>
                        </div>
                    </form>
                    ) : (
                        <form onSubmit={handleSaveProduct} className="space-y-6">
                            {/* Step 1 Summary */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Details Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Product Name</p>
                                        <p className="text-sm font-medium text-gray-900">{productFormData.name || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Rental Price</p>
                                        <p className="text-sm font-medium text-gray-900">{productFormData.price || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Original Price</p>
                                        <p className="text-sm font-medium text-gray-900">{productFormData.originalPrice || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Images</p>
                                        <p className="text-sm font-medium text-gray-900">{productImagePreviews.length} image{productImagePreviews.length !== 1 ? 's' : ''} uploaded</p>
                                    </div>
                                </div>
                                {productImagePreviews.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 mb-2">Preview Images</p>
                                        <div className="flex gap-2 overflow-x-auto">
                                            {productImagePreviews.slice(0, 3).map((preview, index) => (
                                                <div key={index} className="relative w-16 h-16 rounded border border-gray-300 overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ))}
                                            {productImagePreviews.length > 3 && (
                                                <div className="flex items-center justify-center w-16 h-16 rounded border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium">
                                                    +{productImagePreviews.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Facet Selection Sections */}
                            <div className="space-y-6">
                                {/* Product Types */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Type
                                    </label>
                                    <div className="w-full border border-gray-300 rounded-md min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableProductTypes.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No product types available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableProductTypes.map((pt) => {
                                                    const isSelected = productFormData.productTypes.includes(pt.name);
                                                    return (
                                                        <label
                                                            key={pt.id}
                                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-50 border border-blue-200"
                                                                    : "hover:bg-gray-50 border border-transparent"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            productTypes: [...productFormData.productTypes, pt.name],
                                                                        });
                                                                    } else {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            productTypes: productFormData.productTypes.filter((t) => t !== pt.name),
                                                                        });
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{pt.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Occasions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Occasion
                                    </label>
                                    <div className="w-full border border-gray-300 rounded-md min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableOccasions.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No occasions available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableOccasions.map((oc) => {
                                                    const isSelected = productFormData.occasions.includes(oc.name);
                                                    return (
                                                        <label
                                                            key={oc.id}
                                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-50 border border-blue-200"
                                                                    : "hover:bg-gray-50 border border-transparent"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            occasions: [...productFormData.occasions, oc.name],
                                                                        });
                                                                    } else {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            occasions: productFormData.occasions.filter((o) => o !== oc.name),
                                                                        });
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{oc.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Colors */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Color
                                    </label>
                                    <div className="w-full border border-gray-300 rounded-md min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableColors.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No colors available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableColors.map((c) => {
                                                    const isSelected = productFormData.colors.includes(c.name);
                                                    return (
                                                        <label
                                                            key={c.id}
                                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-50 border border-blue-200"
                                                                    : "hover:bg-gray-50 border border-transparent"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            colors: [...productFormData.colors, c.name],
                                                                        });
                                                                    } else {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            colors: productFormData.colors.filter((col) => col !== c.name),
                                                                        });
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{c.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Materials */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Material
                                    </label>
                                    <div className="w-full border border-gray-300 rounded-md min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableMaterials.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No materials available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableMaterials.map((m) => {
                                                    const isSelected = productFormData.materials.includes(m.name);
                                                    return (
                                                        <label
                                                            key={m.id}
                                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-50 border border-blue-200"
                                                                    : "hover:bg-gray-50 border border-transparent"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            materials: [...productFormData.materials, m.name],
                                                                        });
                                                                    } else {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            materials: productFormData.materials.filter((mat) => mat !== m.name),
                                                                        });
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{m.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cities */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <div className="w-full border border-gray-300 rounded-md min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableCities.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No cities available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableCities.map((city) => {
                                                    const isSelected = productFormData.cities.includes(city.name);
                                                    return (
                                                        <label
                                                            key={city.id}
                                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-50 border border-blue-200"
                                                                    : "hover:bg-gray-50 border border-transparent"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            cities: [...productFormData.cities, city.name],
                                                                        });
                                                                    } else {
                                                                        setProductFormData({
                                                                            ...productFormData,
                                                                            cities: productFormData.cities.filter((ci) => ci !== city.name),
                                                                        });
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{city.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Select facets for this product. At least one facet must be selected.</p>

                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploadingImage}
                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploadingImage ? "Uploading..." : "Create Product"}
                                </button>
                            </div>
                        </form>
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
        </div>
    );
}

