"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import Popup from "@/components/Popup";
import { convertToWebPOptimized } from "@/lib/imageUtils";

interface UserProduct {
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string;
    images?: string[];
    primary_image_index?: number;
    original_price?: number | string;
    product_id?: string;
    category?: string | string[];
    created_at: string;
}

interface User {
    id: string;
    name: string;
    phone: string;
    email: string | null;
}

export default function ManageProductsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;
    
    const [user, setUser] = useState<User | null>(null);
    const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
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
    
    // Product edit modal state
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<UserProduct | null>(null);
    const [productFormData, setProductFormData] = useState({
        name: "",
        price: "",
        image: "",
        originalPrice: "",
        category: [] as string[],
    });
    // Facet data for display
    const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [occasions, setOccasions] = useState<Array<{ id: string; name: string }>>([]);
    const [colors, setColors] = useState<Array<{ id: string; name: string }>>([]);
    const [materials, setMaterials] = useState<Array<{ id: string; name: string }>>([]);
    const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
    const [productImages, setProductImages] = useState<string[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
    const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
    const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
    const [imageSizeInfo, setImageSizeInfo] = useState<Array<{ original: number; converted: number; name: string }>>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        if (userId) {
            loadUser();
            loadUserProducts();
            loadFacets();
            testSupabaseConnection();
        }
    }, [userId]);
    
    const testSupabaseConnection = async () => {
        try {
            console.log("🔍 Testing Supabase connection...");
            console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
            console.log("Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
            
            // Test basic connection
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log("Session test:", { session: !!session, sessionError });
            
            // Test products table access
            const { data: testData, error: testError, count } = await supabase
                .from("products")
                .select("*", { count: 'exact', head: true });
            
            console.log("Products table test:", { 
                count, 
                error: testError,
                canRead: !testError 
            });
            
            if (testError) {
                console.error("❌ Cannot access products table:", testError);
            } else {
                console.log("✅ Supabase connection working");
            }
        } catch (error) {
            console.error("❌ Supabase connection test failed:", error);
        }
    };


    // Reload products when window regains focus (after returning from edit modal)
    useEffect(() => {
        const handleFocus = () => {
            if (userId) {
                loadUserProducts();
            }
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [userId]);

    const showPopup = (message: string, type: "error" | "success" | "info" | "warning" = "info", title?: string) => {
        setPopup({ isOpen: true, message, type, title });
    };

    const closePopup = () => {
        setPopup({ ...popup, isOpen: false });
    };

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
        }
    };

    const loadFacets = async () => {
        try {
            const [productTypesResult, occasionsResult, colorsResult, materialsResult, citiesResult] = await Promise.all([
                supabase.from("product_types").select("id, name").order("name"),
                supabase.from("occasions").select("id, name").order("name"),
                supabase.from("colors").select("id, name").order("name"),
                supabase.from("materials").select("id, name").order("name"),
                supabase.from("cities").select("id, name").order("name")
            ]);

            if (productTypesResult.data) setProductTypes(productTypesResult.data);
            if (occasionsResult.data) setOccasions(occasionsResult.data);
            if (colorsResult.data) setColors(colorsResult.data);
            if (materialsResult.data) setMaterials(materialsResult.data);
            if (citiesResult.data) setCities(citiesResult.data);
        } catch (error) {
            console.error("Error loading facets:", error);
        }
    };

    const loadUserProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("owner_user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) {
                // Load all facet associations for these products
                const productIds = data.map(p => p.id);
                const [productTypesResult, occasionsResult, colorsResult, materialsResult, citiesResult] = await Promise.all([
                    supabase.from("product_product_types").select("product_id, type_id, product_types(name)").in("product_id", productIds),
                    supabase.from("product_occasions").select("product_id, occasion_id, occasions(name)").in("product_id", productIds),
                    supabase.from("product_colors").select("product_id, color_id, colors(name)").in("product_id", productIds),
                    supabase.from("product_materials").select("product_id, material_id, materials(name)").in("product_id", productIds),
                    supabase.from("product_cities").select("product_id, city_id, cities(name)").in("product_id", productIds)
                ]);

                // Create maps for each facet type
                const productTypesMap = new Map<string, string[]>();
                const occasionsMap = new Map<string, string[]>();
                const colorsMap = new Map<string, string[]>();
                const materialsMap = new Map<string, string[]>();
                const citiesMap = new Map<string, string[]>();

                productTypesResult.data?.forEach((assoc: any) => {
                    if (!productTypesMap.has(assoc.product_id)) productTypesMap.set(assoc.product_id, []);
                    if (assoc.product_types?.name) productTypesMap.get(assoc.product_id)?.push(assoc.product_types.name);
                });
                occasionsResult.data?.forEach((assoc: any) => {
                    if (!occasionsMap.has(assoc.product_id)) occasionsMap.set(assoc.product_id, []);
                    if (assoc.occasions?.name) occasionsMap.get(assoc.product_id)?.push(assoc.occasions.name);
                });
                colorsResult.data?.forEach((assoc: any) => {
                    if (!colorsMap.has(assoc.product_id)) colorsMap.set(assoc.product_id, []);
                    if (assoc.colors?.name) colorsMap.get(assoc.product_id)?.push(assoc.colors.name);
                });
                materialsResult.data?.forEach((assoc: any) => {
                    if (!materialsMap.has(assoc.product_id)) materialsMap.set(assoc.product_id, []);
                    if (assoc.materials?.name) materialsMap.get(assoc.product_id)?.push(assoc.materials.name);
                });
                citiesResult.data?.forEach((assoc: any) => {
                    if (!citiesMap.has(assoc.product_id)) citiesMap.set(assoc.product_id, []);
                    if (assoc.cities?.name) citiesMap.get(assoc.product_id)?.push(assoc.cities.name);
                });
                
                const mapped = data.map((p: any) => {
                    const facets = {
                        productTypes: productTypesMap.get(p.id) || [],
                        occasions: occasionsMap.get(p.id) || [],
                        colors: colorsMap.get(p.id) || [],
                        materials: materialsMap.get(p.id) || [],
                        cities: citiesMap.get(p.id) || []
                    };
                    
                    return {
                        id: p.id,
                        user_id: p.owner_user_id,
                        name: p.title || p.name,
                        price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                        image: p.image || "",
                        images: p.images || undefined,
                        primary_image_index: p.primary_image_index ?? undefined,
                        original_price: p.original_price ?? undefined,
                        product_id: p.product_id ?? undefined,
                        category: facets, // Store facets instead of categories
                        created_at: p.created_at,
                    } as UserProduct & { category: typeof facets };
                });
                
                setUserProducts(mapped);
            }
        } catch (error) {
            console.error("Error loading user products:", error);
            showPopup("Failed to load products", "error", "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;
            showPopup("Product deleted successfully!", "success");
            loadUserProducts();
        } catch (error: any) {
            showPopup(error.message || "Failed to delete product", "error", "Error");
            console.error("Error deleting product:", error);
        }
    };

    // Image handling functions
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

        // Clear any existing error popup when new files are selected
        if (popup.isOpen && popup.type === "error") {
            closePopup();
        }

        for (const file of files) {
            
            if (!file.type.startsWith("image/")) {
                showPopup("Please select only image files", "error", "Invalid File Type");
                e.target.value = "";
                return;
            }
            
            const maxSizeBytes = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSizeBytes) {
                showPopup(`Image "${file.name}" is too large (max 5MB). Actual size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`, "error", "File Too Large");
                e.target.value = "";
                return;
            }
        }

        const processPromises = files.map(async (file) => {
            const originalSize = file.size;
            try {
                const { blob, size: convertedSize } = await convertToWebPOptimized(file);
                
                const preview = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                
                // Only use optimized version if it's smaller than original
                if (convertedSize < originalSize) {
                const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                    type: "image/webp",
                });
                return {
                    file: convertedFile,
                    preview,
                    sizeInfo: { original: originalSize, converted: convertedSize, name: file.name },
                };
                } else {
                    // Use original file if optimization didn't help
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

    const removeImage = (index: number, isNew: boolean) => {
        if (isNew) {
            const previewIndex = index - productImages.length;
            setProductImageFiles(prev => prev.filter((_, i) => i !== previewIndex));
            setProductImagePreviews(prev => prev.filter((_, i) => i !== previewIndex));
            setImageSizeInfo(prev => prev.filter((_, i) => i !== previewIndex));
            if (primaryImageIndex === index) {
                setPrimaryImageIndex(0);
            } else if (primaryImageIndex > index) {
                setPrimaryImageIndex(prev => prev - 1);
            }
        } else {
            const newImages = productImages.filter((_, i) => i !== index);
            setProductImages(newImages);
            if (primaryImageIndex === index) {
                setPrimaryImageIndex(newImages.length > 0 ? 0 : (productImagePreviews.length > 0 ? 0 : 0));
            } else if (primaryImageIndex > index) {
                setPrimaryImageIndex(prev => prev - 1);
            }
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
        
        if (!editingProduct && productImageFiles.length === 0 && productImages.length === 0) {
            showPopup("Please select at least one image file", "warning", "Validation Error");
            return;
        }

        setIsUploadingImage(true);
        try {
            const uploadedImageUrls: string[] = [];
            if (productImageFiles.length > 0) {
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
            }

            let allImages: string[] = [];
            if (editingProduct && productImages.length > 0) {
                allImages = [...productImages];
            }
            allImages = [...allImages, ...uploadedImageUrls];

            if (allImages.length === 0) {
                setIsUploadingImage(false);
                showPopup("At least one image is required.", "error", "Validation Error");
                return;
            }

            let validPrimaryIndex = primaryImageIndex;
            if (validPrimaryIndex < 0 || validPrimaryIndex >= allImages.length) {
                validPrimaryIndex = 0;
            }

            let productId = null;
            if (!editingProduct) {
                productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            } else {
                productId = editingProduct.product_id || null;
            }

            const productData: any = {
                name: productFormData.name,
                price: productFormData.price,
                images: allImages.length > 0 ? allImages : null,
                primary_image_index: allImages.length > 0 ? validPrimaryIndex : 0,
                product_id: productId,
                category: productFormData.category.length > 0 ? productFormData.category : null,
                image: allImages[validPrimaryIndex],
            };

            if (productFormData.originalPrice && productFormData.originalPrice.trim() !== "") {
                const originalPriceNum = parseFloat(productFormData.originalPrice);
                if (!isNaN(originalPriceNum)) {
                    productData.original_price = originalPriceNum;
                }
            }

            if (editingProduct) {
                // Map to new products schema for update
                const updateData: any = {
                    title: productData.name,
                    name: productData.name, // compatibility
                    price: productData.price,
                    price_per_day: productData.price ? parseFloat(productData.price) || null : null,
                    image: productData.image,
                };
                
                // Note: Facets are managed on the add product page, not in the edit modal
                const { error } = await supabase
                    .from("products")
                    .update(updateData)
                    .eq("id", editingProduct.id);

                if (error) throw error;
                
                showPopup("Product updated successfully!", "success");
            } else {
                // Verify admin session before insert
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError || !session?.user) {
                    throw new Error("No active session. Please log in as admin first.");
                }
                
                console.log("Current auth session user ID:", session.user.id);
                
                // Verify admin status
                const { data: adminCheck, error: adminError } = await supabase
                    .from("admins")
                    .select("id, email, auth_user_id")
                    .eq("auth_user_id", session.user.id)
                    .maybeSingle();
                
                if (adminError) {
                    console.error("Error checking admin status:", adminError);
                }
                
                if (!adminCheck) {
                    throw new Error("Permission denied. Only admins can create products.");
                }
                
                console.log("Admin verified:", adminCheck);
                
                // Map to new products schema for insert
                const insertData: any = {
                    owner_user_id: userId,
                    title: productData.name || "Untitled Product", // Required field
                    name: productData.name || "Untitled Product", // compatibility
                    price: productData.price || "",
                    price_per_day: productData.price ? parseFloat(productData.price) || null : null,
                    image: productData.image || "",
                    is_active: true, // Default to active
                };
                
                // Note: Categories are now handled via facets (product_types, occasions, colors, materials, cities)
                // The category field in productData is now a facets object, not a category name/ID
                
                console.log("Inserting product data:", insertData);
                console.log("Owner user ID (from params):", userId);
                console.log("Current Supabase session:", session);
                console.log("Admin check result:", adminCheck);
                
                // Validate required fields before insert
                if (!insertData.title || insertData.title.trim() === "") {
                    throw new Error("Product name/title is required");
                }
                if (!insertData.owner_user_id) {
                    throw new Error("Owner user ID is required");
                }
                
                // CRITICAL: Verify the owner user exists in database
                // This prevents foreign key constraint violations
                const { data: ownerUser, error: ownerError } = await supabase
                    .from("users")
                    .select("id, name, phone")
                    .eq("id", insertData.owner_user_id)
                    .maybeSingle();
                
                if (ownerError) {
                    console.error("Error checking owner user:", ownerError);
                    throw new Error(`Error verifying owner user: ${ownerError.message}`);
                }
                
                if (!ownerUser) {
                    throw new Error(
                        `Owner user with ID "${insertData.owner_user_id}" does not exist in the database. ` +
                        `Please ensure the user exists before creating a product.`
                    );
                }
                
                console.log("✅ Owner user verified:", ownerUser);
                
                // Try the insert with better error handling
                const insertResponse = await supabase
                    .from("products")
                    .insert([insertData])
                    .select();
                
                console.log("Insert response:", insertResponse);
                
                // Check for error in multiple ways since Supabase error format can vary
                const { data: insertedData, error } = insertResponse;
                
                if (error) {
                    // Log everything about the error
                    const errorInfo: any = {};
                    
                    // Try to extract all possible error properties
                    for (const key in error) {
                        try {
                            errorInfo[key] = (error as any)[key];
                        } catch (e) {
                            errorInfo[key] = "[Unable to serialize]";
                        }
                    }
                    
                    // Also try JSON.stringify
                    try {
                        errorInfo.stringified = JSON.stringify(error, null, 2);
                    } catch (e) {
                        errorInfo.stringified = "[Unable to stringify]";
                    }
                    
                    console.error("Product insert error (full details):", errorInfo);
                    console.error("Error type:", typeof error);
                    console.error("Error constructor:", error?.constructor?.name);
                    console.error("Error keys:", Object.keys(error || {}));
                    
                    // Create a user-friendly error message
                    const errorMsg = error.message || 
                                   error.details || 
                                   error.hint || 
                                   (error as any)?.error_description ||
                                   "Failed to insert product. Check console for details.";
                    
                    throw new Error(errorMsg);
                }
                
                if (!insertedData || insertedData.length === 0) {
                    throw new Error("Product insert returned no data. Check RLS policies.");
                }
                
                const newProductId = insertedData[0].id;
                
                // Note: Facet associations (product_types, occasions, colors, materials, cities) 
                // are handled separately in the product edit modal, not during initial product creation
                
                console.log("Product inserted successfully:", insertedData);
                showPopup("Product added successfully!", "success");
            }

            // Reset form and close modal
            setEditingProduct(null);
            setProductFormData({ name: "", price: "", image: "", originalPrice: "", category: [] });
            setProductImages([]);
            setPrimaryImageIndex(0);
            setProductImageFiles([]);
            setProductImagePreviews([]);
            setImageSizeInfo([]);
            setIsProductModalOpen(false);
            loadUserProducts();
        } catch (error: any) {
            // Better error logging - handle different error formats
            let errorMessage = "Failed to save product";
            let errorDetails: any = {};
            
            if (error) {
                // Try to extract error message from different possible formats
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error?.message) {
                    errorMessage = error.message;
                } else if (error?.details) {
                    errorMessage = error.details;
                } else if (error?.hint) {
                    errorMessage = error.hint;
                } else if (error?.error_description) {
                    errorMessage = error.error_description;
                } else if (typeof error === 'object' && Object.keys(error).length > 0) {
                    // If error is an object with properties, try to stringify it
                    errorMessage = JSON.stringify(error);
                }
                
                errorDetails = {
                    message: error?.message,
                    code: error?.code,
                    details: error?.details,
                    hint: error?.hint,
                    statusCode: error?.statusCode,
                    status: error?.status,
                    fullError: error,
                    errorType: typeof error,
                    errorKeys: typeof error === 'object' ? Object.keys(error) : null,
                };
            }
            
            console.error("Error saving product:", errorDetails);
            console.error("Raw error object:", error);
            
            // Check if it's an RLS policy error
            if (error?.code === '42501' || error?.message?.includes('permission denied') || error?.message?.includes('row-level security')) {
                errorMessage = "Permission denied. Please ensure you're logged in as an admin and run the FIX_PRODUCTS_RLS.sql script in Supabase.";
            }
            
            showPopup(errorMessage, "error", "Error");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleEditProduct = async (product: UserProduct) => {
        // Load product data into form
        const images = product.images && Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : (product.image ? [product.image] : []);
        
        // Load categories for this product from product_categories table
        let productCategories: string[] = [];
        const { data: categoryAssociations } = await supabase
            .from("product_categories")
            .select("category_id, categories(name)")
            .eq("product_id", product.id);
        
        if (categoryAssociations) {
            productCategories = categoryAssociations
                .map((assoc: any) => assoc.categories?.name)
                .filter(Boolean);
        }
        
        // Fallback to product.category if no associations found (legacy)
        if (productCategories.length === 0) {
            productCategories = Array.isArray(product.category) 
                ? product.category 
                : (product.category ? [product.category] : []);
        }
        
        setEditingProduct(product);
        setProductFormData({
            name: product.name,
            price: product.price,
            image: product.image || (images.length > 0 ? images[0] : ""),
            originalPrice: product.original_price ? String(product.original_price) : "",
            category: productCategories,
        });
        
        setProductImages(images);
        const validPrimaryIndex = images.length > 0 
            ? (product.primary_image_index !== undefined && product.primary_image_index >= 0 && product.primary_image_index < images.length
                ? product.primary_image_index 
                : 0)
            : 0;
        setPrimaryImageIndex(validPrimaryIndex);
        setProductImageFiles([]);
        setProductImagePreviews([]);
        setImageSizeInfo([]);
        // Facets are loaded via loadFacets() which is called in useEffect
        setIsProductModalOpen(true);
    };

    const handleOpenAddProductModal = () => {
        // Navigate to the dedicated add product page instead of opening modal
        router.push(`/admin/manage-products/${userId}/add`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <button
                                    onClick={() => router.push("/admin?tab=users")}
                                    className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Users
                                </button>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Products for {user?.name || "User"}
                                </h1>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-sm text-gray-600">
                                        {userProducts.length} product{userProducts.length !== 1 ? 's' : ''} total
                                    </p>
                                    {user && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <p className="text-sm text-gray-600">
                                                Phone: {user.phone}
                                            </p>
                                            {user.email && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <p className="text-sm text-gray-600">
                                                        Email: {user.email}
                                                    </p>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleOpenAddProductModal}
                                className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Product
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Statistics Cards */}
                    {userProducts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Products</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{userProducts.length}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Images</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {userProducts.reduce((sum, p) => {
                                                const images = p.images && Array.isArray(p.images) ? p.images.length : (p.image ? 1 : 0);
                                                return sum + images;
                                            }, 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {(() => {
                                                const prices = userProducts
                                                    .map(p => parseFloat(p.price.replace(/[₹,]/g, '')) || 0)
                                                    .filter(p => p > 0);
                                                if (prices.length === 0) return '₹0';
                                                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                                                return `₹${Math.round(avg).toLocaleString()}`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Categories</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {(() => {
                                                const categories = new Set<string>();
                                                userProducts.forEach(p => {
                                                    if (p.category) {
                                                        if (Array.isArray(p.category)) {
                                                            p.category.forEach(c => categories.add(c));
                                                        } else {
                                                            categories.add(p.category);
                                                        }
                                                    }
                                                });
                                                return categories.size;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                                            <path d="M20 7h-4M4 7h4m0 0a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2m0 0v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {userProducts.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                            <p className="text-sm text-gray-600 mb-6">This user doesn't have any products yet.</p>
                            <button
                                onClick={() => {
                                    // Open modal directly on this page
                                    setEditingProduct(null);
                                    setProductFormData({ name: "", price: "", image: "", originalPrice: "", category: [] });
                                    setProductImages([]);
                                    setPrimaryImageIndex(0);
                                    setProductImageFiles([]);
                                    setProductImagePreviews([]);
                                    setImageSizeInfo([]);
                                    setIsProductModalOpen(true);
                                }}
                                className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 inline-flex items-center gap-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add First Product
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Image
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Product Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Types
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Occasions
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Colors
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Materials
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Cities
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Pricing
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Images
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Uploaded
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {userProducts.map((product) => {
                                            const images = product.images && Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []);
                                            const facets = (product.category && typeof product.category === 'object' && !Array.isArray(product.category))
                                                ? product.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                                                : { productTypes: [], occasions: [], colors: [], materials: [], cities: [] };
                                            const createdDate = product.created_at 
                                                ? new Date(product.created_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric'
                                                })
                                                : 'N/A';
                                            const createdTime = product.created_at 
                                                ? new Date(product.created_at).toLocaleTimeString('en-US', { 
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })
                                                : 'N/A';
                                            
                                            return (
                                                <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                                            {product.image ? (
                                                                <Image
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover rounded-lg"
                                                                    unoptimized
                                                                    onError={(e) => {
                                                                        console.error("Image load error:", product.image);
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                                                    No Image
                                                                </div>
                                                            )}
                                                            {images.length > 1 && (
                                                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                                                    {images.length}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs">
                                                            <div className="text-sm font-semibold text-gray-900 mb-1">
                                                                {product.name}
                                                            </div>
                                                            {product.product_id && (
                                                                <div className="text-xs text-gray-500 font-mono">
                                                                    ID: {product.product_id}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Types Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.productTypes.length > 0 ? (
                                                                facets.productTypes.map((pt, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                        {pt}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Occasions Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.occasions.length > 0 ? (
                                                                facets.occasions.map((oc, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                                                        {oc}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Colors Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.colors.length > 0 ? (
                                                                facets.colors.map((c, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                        {c}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Materials Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.materials.length > 0 ? (
                                                                facets.materials.map((m, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                        {m}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Cities Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {facets.cities.length > 0 ? (
                                                                facets.cities.map((city, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                        {city}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {product.price}
                                                            </div>
                                                            {product.original_price && (
                                                                <div className="text-xs text-gray-500 line-through">
                                                                    ₹{typeof product.original_price === 'number' 
                                                                        ? product.original_price.toLocaleString() 
                                                                        : parseFloat(product.original_price).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Images Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-xs text-gray-700">
                                                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="font-semibold text-gray-900">{images.length} {images.length === 1 ? 'image' : 'images'}</span>
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Uploaded Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1.5 text-xs">
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="font-medium">{createdDate}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-6 text-gray-600">
                                                                <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span>{createdTime}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditProduct(product)}
                                                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Edit product"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Delete product"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Edit/Add Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">
                                    {editingProduct ? "Edit Product" : "Add Product"}
                                </h2>
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setProductFormData({ name: "", price: "", image: "", originalPrice: "", category: [] });
                                        setProductImages([]);
                                        setPrimaryImageIndex(0);
                                        setProductImageFiles([]);
                                        setProductImagePreviews([]);
                                        setImageSizeInfo([]);
                                        setIsProductModalOpen(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSaveProduct} className="space-y-4">
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

                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> Product facets (Product Types, Occasions, Colors, Materials, Cities) are managed when creating a new product. 
                                        To modify facets, please delete and recreate the product with the desired facets.
                                    </p>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                                        Upload Product Images {!editingProduct && "*"}
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

                                {(productImages.length > 0 || productImagePreviews.length > 0) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Product Images ({productImages.length + productImagePreviews.length})
                                        </label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {productImages.map((imgUrl, index) => (
                                                <div key={`existing-${index}`} className="relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPrimaryImage(index)}
                                                        className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-all"
                                                    >
                                                        <Image
                                                            src={imgUrl}
                                                            alt={`Product image ${index + 1}`}
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
                                                                removeImage(index, false);
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
                                            {productImagePreviews.map((preview, index) => {
                                                const totalIndex = productImages.length + index;
                                                return (
                                                    <div key={`preview-${index}`} className="relative group">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrimaryImage(totalIndex)}
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
                                                                <div className={`${primaryImageIndex === totalIndex ? 'bg-red-500' : 'bg-white/80'} rounded-full p-1.5 shadow-md`}>
                                                                    <svg 
                                                                        className={`w-5 h-5 ${primaryImageIndex === totalIndex ? 'text-white fill-white' : 'text-gray-400'}`} 
                                                                        fill={primaryImageIndex === totalIndex ? "currentColor" : "none"} 
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
                                                                    removeImage(totalIndex, true);
                                                                }}
                                                                className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Click an image to set it as primary (shown on home page).
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isUploadingImage}
                                        className="flex-1 px-4 py-2 bg-black text-white font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploadingImage ? "Uploading..." : editingProduct ? "Update Product" : "Add Product"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingProduct(null);
                                            setProductFormData({ name: "", price: "", image: "", originalPrice: "", category: [] });
                                            setProductImages([]);
                                            setPrimaryImageIndex(0);
                                            setProductImageFiles([]);
                                            setProductImagePreviews([]);
                                            setImageSizeInfo([]);
                                            setIsProductModalOpen(false);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <Popup
                isOpen={popup.isOpen}
                onClose={closePopup}
                message={popup.message}
                type={popup.type}
                title={popup.title}
            />
        </>
    );
}

