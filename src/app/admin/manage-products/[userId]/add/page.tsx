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
        category: [] as string[],
    });
    const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
    const [productImages, setProductImages] = useState<string[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
    const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
    const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
    const [imageSizeInfo, setImageSizeInfo] = useState<Array<{ original: number; converted: number; name: string }>>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        if (userId) {
            loadUser();
            loadCategories();
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

    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name")
                .order("name", { ascending: true });
            
            if (error) throw error;
            if (data) {
                setAvailableCategories(data);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    const showPopup = (message: string, type: "error" | "success" | "info" | "warning" = "info", title?: string) => {
        setPopup({ isOpen: true, message, type, title });
    };

    const closePopup = () => {
        setPopup({ ...popup, isOpen: false });
    };

    const handleAddNewCategory = async () => {
        if (!newCategoryName.trim()) {
            showPopup("Please enter a category name", "warning", "Validation Error");
            return;
        }

        if (availableCategories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            showPopup("This category already exists", "warning", "Duplicate Category");
            return;
        }

        try {
            const maxOrder = availableCategories.length > 0 
                ? Math.max(...availableCategories.map(c => 0)) 
                : -1;

            const { data, error } = await supabase
                .from("categories")
                .insert([{
                    name: newCategoryName.trim(),
                    image_url: "",
                    link_url: `/${newCategoryName.trim().toLowerCase().replace(/\s+/g, '-')}`,
                    display_order: maxOrder + 1,
                    is_featured: false
                }])
                .select()
                .single();

            if (error) throw error;

            setAvailableCategories([...availableCategories, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
            
            setProductFormData({
                ...productFormData,
                category: [...productFormData.category, data.name]
            });

            setNewCategoryName("");
            setShowAddCategoryInput(false);
            showPopup("Category added and selected!", "success");
        } catch (error: any) {
            showPopup(error.message || "Failed to add category", "error", "Error");
            console.error("Error adding category:", error);
        }
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
                
                if (convertedSize < originalSize) {
                    const preview = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(converted);
                    });
                    return {
                        file: converted,
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
        
        if (!productFormData.category || productFormData.category.length === 0) {
            showPopup("Please select at least one category", "warning", "Validation Error");
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
                category: productFormData.category,
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
            
            const selectedCategoryIds: string[] = [];
            
            if (Array.isArray(productData.category) && productData.category.length > 0) {
                productData.category.forEach((categoryName: string) => {
                    const categoryMatch = availableCategories.find(cat => cat.name === categoryName);
                    if (categoryMatch) {
                        selectedCategoryIds.push(categoryMatch.id);
                    }
                });
                
                if (selectedCategoryIds.length > 0) {
                    insertData.category_id = selectedCategoryIds[0];
                }
            }
            
            const { data: insertedProduct, error: insertError } = await supabase
                .from("products")
                .insert(insertData)
                .select()
                .single();

            if (insertError) throw insertError;
            
            if (selectedCategoryIds.length > 0) {
                const categoryAssociations = selectedCategoryIds.map(categoryId => ({
                    product_id: insertedProduct.id,
                    category_id: categoryId
                }));
                
                const { error: categoryError } = await supabase
                    .from("product_categories")
                    .insert(categoryAssociations);
                
                if (categoryError) {
                    console.error("Error associating categories:", categoryError);
                }
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

                {/* Form */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={handleSaveProduct} className="space-y-6">
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
                                Original Price of Outfit (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={productFormData.originalPrice}
                                onChange={(e) => setProductFormData({ ...productFormData, originalPrice: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="e.g., 1299"
                            />
                            <p className="text-xs text-gray-500 mt-1">Original purchase price of the outfit (optional)</p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Category *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddCategoryInput(!showAddCategoryInput);
                                        if (showAddCategoryInput) {
                                            setNewCategoryName("");
                                        }
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {showAddCategoryInput ? "Cancel" : "Add New Category"}
                                </button>
                            </div>

                            {showAddCategoryInput && (
                                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddNewCategory();
                                                }
                                            }}
                                            placeholder="Enter new category name"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddNewCategory}
                                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="w-full border border-gray-300 rounded-md min-h-[120px] max-h-[200px] overflow-y-auto p-2 bg-white">
                                {availableCategories.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No categories available. Click "Add New Category" above to create one.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {availableCategories.map((cat) => {
                                            const isSelected = productFormData.category.includes(cat.name);
                                            return (
                                                <label
                                                    key={cat.id}
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
                                                                    category: [...productFormData.category, cat.name],
                                                                });
                                                            } else {
                                                                setProductFormData({
                                                                    ...productFormData,
                                                                    category: productFormData.category.filter((c) => c !== cat.name),
                                                                });
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{cat.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {productFormData.category.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {productFormData.category.map((cat, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                                        >
                                            {cat}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProductFormData({
                                                        ...productFormData,
                                                        category: productFormData.category.filter((c) => c !== cat),
                                                    });
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Select one or more categories for this product (required)</p>
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
                                type="submit"
                                disabled={isUploadingImage}
                                className="flex-1 px-4 py-2 bg-black text-white font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploadingImage ? "Uploading..." : "Add Product"}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push(`/admin/manage-products/${userId}`)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
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

