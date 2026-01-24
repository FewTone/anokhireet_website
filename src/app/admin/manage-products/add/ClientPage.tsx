"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import Popup from "@/components/Popup";
import { convertToWebPOptimized } from "@/lib/imageUtils";

interface User {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
}

export default function AddProductClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const editProductId = searchParams.get("edit");

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<any>(null);
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

    // Add new item states
    const [showAddProductType, setShowAddProductType] = useState(false);
    const [newProductTypeName, setNewProductTypeName] = useState("");
    const [showAddOccasion, setShowAddOccasion] = useState(false);
    const [newOccasionName, setNewOccasionName] = useState("");
    const [showAddColor, setShowAddColor] = useState(false);
    const [newColorName, setNewColorName] = useState("");
    const [showAddMaterial, setShowAddMaterial] = useState(false);
    const [newMaterialName, setNewMaterialName] = useState("");
    const [showAddCity, setShowAddCity] = useState(false);
    const [newCityName, setNewCityName] = useState("");
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
            loadAllFacets().then(() => {
                if (editProductId) {
                    loadProductForEdit(editProductId);
                }
            });

            // Check if database columns exist on page load
            const checkSchema = async () => {
                try {
                    const { error: schemaCheckError } = await supabase
                        .from("products")
                        .select("images, primary_image_index, original_price")
                        .limit(0);

                    if (schemaCheckError && (
                        schemaCheckError.message?.includes('schema cache') ||
                        schemaCheckError.message?.includes('images') ||
                        schemaCheckError.message?.includes('does not exist') ||
                        (schemaCheckError.message?.includes('column') && schemaCheckError.message?.includes('products'))
                    )) {
                        const sqlToRun = `ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_index INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Verify (should show 3 rows):
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'primary_image_index', 'original_price');`;

                        showPopup(
                            `⚠️ DATABASE MIGRATION REQUIRED\n\n` +
                            `The required database columns are missing.\n\n` +
                            `📋 Copy this SQL and run it in Supabase:\n\n` +
                            `${sqlToRun}\n\n` +
                            `Steps:\n` +
                            `1. Open Supabase Dashboard → SQL Editor\n` +
                            `2. Click "New Query"\n` +
                            `3. Paste the SQL above\n` +
                            `4. Click "Run" (should show 3 rows)\n` +
                            `5. Wait 2-3 minutes for cache refresh\n` +
                            `6. Refresh this page\n\n` +
                            `File: sql/RUN_THIS_NOW.sql`,
                            "error",
                            "Migration Required"
                        );
                    }
                } catch (error) {
                    // Silently ignore - might be other issues
                    console.warn("Schema check warning:", error);
                }
            };

            checkSchema();
        }
    }, [userId, editProductId]);

    const loadUser = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("id, name, phone")
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

    const loadProductForEdit = async (productId: string) => {
        try {
            // Load product data
            const { data: product, error: productError } = await supabase
                .from("products")
                .select("*")
                .eq("id", productId)
                .single();

            if (productError || !product) {
                showPopup("Failed to load product for editing", "error", "Error");
                router.push(`/admin/manage-products?userId=${userId}`);
                return;
            }

            setEditingProduct(product);

            // Load existing images
            const images = product.images && Array.isArray(product.images) && product.images.length > 0
                ? product.images
                : (product.image ? [product.image] : []);
            setProductImages(images);

            const validPrimaryIndex = product.primary_image_index !== undefined && product.primary_image_index >= 0 && product.primary_image_index < images.length
                ? product.primary_image_index
                : 0;
            setPrimaryImageIndex(validPrimaryIndex);

            // Load facets
            const [productTypesRes, occasionsRes, colorsRes, materialsRes, citiesRes] = await Promise.all([
                supabase.from("product_product_types").select("type_id, product_types(name)").eq("product_id", productId),
                supabase.from("product_occasions").select("occasion_id, occasions(name)").eq("product_id", productId),
                supabase.from("product_colors").select("color_id, colors(name)").eq("product_id", productId),
                supabase.from("product_materials").select("material_id, materials(name)").eq("product_id", productId),
                supabase.from("product_cities").select("city_id, cities(name)").eq("product_id", productId),
            ]);

            const productTypes = productTypesRes.data?.map((pt: any) => pt.product_types?.name).filter(Boolean) || [];
            const occasions = occasionsRes.data?.map((oc: any) => oc.occasions?.name).filter(Boolean) || [];
            const colors = colorsRes.data?.map((c: any) => c.colors?.name).filter(Boolean) || [];
            const materials = materialsRes.data?.map((m: any) => m.materials?.name).filter(Boolean) || [];
            const cities = citiesRes.data?.map((c: any) => c.cities?.name).filter(Boolean) || [];

            setProductFormData({
                name: product.name || product.title || "",
                price: product.price || "",
                originalPrice: product.original_price ? String(product.original_price) : "",
                productTypes,
                occasions,
                colors,
                materials,
                cities,
            });

            // Set step to 2 when editing (since we already have product data)
            setCurrentStep(2);
        } catch (error) {
            console.error("Error loading product for edit:", error);
            showPopup("Failed to load product for editing", "error", "Error");
            router.push(`/admin/manage-products?userId=${userId}`);
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

    const handleAddNewProductType = async () => {
        if (!newProductTypeName.trim()) {
            showPopup("Please enter a product type name", "warning", "Validation Error");
            return;
        }

        if (availableProductTypes.some(pt => pt.name.toLowerCase() === newProductTypeName.trim().toLowerCase())) {
            showPopup("This product type already exists", "warning", "Duplicate");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("product_types")
                .insert([{
                    name: newProductTypeName.trim(),
                    display_order: availableProductTypes.length
                }])
                .select()
                .single();

            if (error) throw error;

            setAvailableProductTypes([...availableProductTypes, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
            setProductFormData({
                ...productFormData,
                productTypes: [...productFormData.productTypes, data.name]
            });
            setNewProductTypeName("");
            setShowAddProductType(false);
            showPopup("Product type added and selected!", "success");
        } catch (error: any) {
            showPopup(error.message || "Failed to add product type", "error", "Error");
            console.error("Error adding product type:", error);
        }
    };

    const handleAddNewOccasion = async () => {
        if (!newOccasionName.trim()) {
            showPopup("Please enter an occasion name", "warning", "Validation Error");
            return;
        }

        if (availableOccasions.some(oc => oc.name.toLowerCase() === newOccasionName.trim().toLowerCase())) {
            showPopup("This occasion already exists", "warning", "Duplicate");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("occasions")
                .insert([{
                    name: newOccasionName.trim(),
                    display_order: availableOccasions.length
                }])
                .select()
                .single();

            if (error) throw error;

            setAvailableOccasions([...availableOccasions, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
            setProductFormData({
                ...productFormData,
                occasions: [...productFormData.occasions, data.name]
            });
            setNewOccasionName("");
            setShowAddOccasion(false);
            showPopup("Occasion added and selected!", "success");
        } catch (error: any) {
            showPopup(error.message || "Failed to add occasion", "error", "Error");
            console.error("Error adding occasion:", error);
        }
    };

    const handleAddNewColor = async () => {
        if (!newColorName.trim()) {
            showPopup("Please enter a color name", "warning", "Validation Error");
            return;
        }

        if (availableColors.some(c => c.name.toLowerCase() === newColorName.trim().toLowerCase())) {
            showPopup("This color already exists", "warning", "Duplicate");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("colors")
                .insert([{
                    name: newColorName.trim(),
                    display_order: availableColors.length
                }])
                .select()
                .single();

            if (error) throw error;

            setAvailableColors([...availableColors, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
            setProductFormData({
                ...productFormData,
                colors: [...productFormData.colors, data.name]
            });
            setNewColorName("");
            setShowAddColor(false);
            showPopup("Color added and selected!", "success");
        } catch (error: any) {
            showPopup(error.message || "Failed to add color", "error", "Error");
            console.error("Error adding color:", error);
        }
    };

    const handleAddNewMaterial = async () => {
        if (!newMaterialName.trim()) {
            showPopup("Please enter a material name", "warning", "Validation Error");
            return;
        }

        if (availableMaterials.some(m => m.name.toLowerCase() === newMaterialName.trim().toLowerCase())) {
            showPopup("This material already exists", "warning", "Duplicate");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("materials")
                .insert([{
                    name: newMaterialName.trim(),
                    display_order: availableMaterials.length
                }])
                .select()
                .single();

            if (error) throw error;

            setAvailableMaterials([...availableMaterials, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
            setProductFormData({
                ...productFormData,
                materials: [...productFormData.materials, data.name]
            });
            setNewMaterialName("");
            setShowAddMaterial(false);
            showPopup("Material added and selected!", "success");
        } catch (error: any) {
            showPopup(error.message || "Failed to add material", "error", "Error");
            console.error("Error adding material:", error);
        }
    };

    const handleAddNewCity = async () => {
        if (!newCityName.trim()) {
            showPopup("Please enter a city name", "warning", "Validation Error");
            return;
        }

        if (availableCities.some(c => c.name.toLowerCase() === newCityName.trim().toLowerCase())) {
            showPopup("This city already exists", "warning", "Duplicate");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("cities")
                .insert([{
                    name: newCityName.trim(),
                    display_order: availableCities.length
                }])
                .select()
                .single();

            if (error) throw error;

            setAvailableCities([...availableCities, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
            setProductFormData({
                ...productFormData,
                cities: [...productFormData.cities, data.name]
            });
            setNewCityName("");
            setShowAddCity(false);
            showPopup("City added and selected!", "success");
        } catch (error: any) {
            showPopup(error.message || "Failed to add city", "error", "Error");
            console.error("Error adding city:", error);
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

        // Determine file extension from mime type or file name
        let fileExt = "webp";
        if (file.type === "image/jpeg") fileExt = "jpg";
        else if (file.type === "image/png") fileExt = "png";
        else if (file.type === "image/gif") fileExt = "gif";
        else if (file.name.includes(".")) fileExt = file.name.split(".").pop() || "webp";

        const fileName = `user-products/${userId}/${timestamp}-${randomStr}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                contentType: file.type,
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

        // Pre-check: Verify required columns exist by attempting a simple query
        try {
            const { error: schemaCheckError } = await supabase
                .from("products")
                .select("images, primary_image_index, original_price")
                .limit(0);

            if (schemaCheckError && (
                schemaCheckError.message?.includes('schema cache') ||
                schemaCheckError.message?.includes('images') ||
                schemaCheckError.message?.includes('does not exist') ||
                schemaCheckError.message?.includes('column') && schemaCheckError.message?.includes('products')
            )) {
                const sqlToRun = `ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_index INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Verify (should show 3 rows):
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'primary_image_index', 'original_price');`;

                showPopup(
                    `DATABASE MIGRATION REQUIRED\n\n` +
                    `The database columns are missing. Please run this SQL in Supabase:\n\n` +
                    `${sqlToRun}\n\n` +
                    `1. Go to Supabase Dashboard → SQL Editor\n` +
                    `2. Click "New Query"\n` +
                    `3. Paste the SQL above\n` +
                    `4. Click "Run"\n` +
                    `5. Wait 2-3 minutes for cache refresh\n` +
                    `6. Refresh this page and try again`,
                    "error",
                    "Migration Required"
                );
                return;
            }
        } catch (preCheckError: any) {
            // If it's not a schema error, continue (might be a different issue)
            console.warn("Schema pre-check warning:", preCheckError);
        }

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

        // When editing, allow existing images; when creating, require new images
        if (!editingProduct && productImageFiles.length === 0) {
            showPopup("Please select at least one image file", "warning", "Validation Error");
            return;
        }

        if (editingProduct && productImageFiles.length === 0 && productImages.length === 0) {
            showPopup("At least one image is required", "warning", "Validation Error");
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

            // Combine existing images with newly uploaded ones
            const allImageUrls = editingProduct
                ? [...productImages, ...uploadedImageUrls]
                : uploadedImageUrls;

            if (allImageUrls.length === 0) {
                setIsUploadingImage(false);
                showPopup("At least one image is required.", "error", "Validation Error");
                return;
            }

            let validPrimaryIndex = primaryImageIndex;
            if (validPrimaryIndex < 0 || validPrimaryIndex >= allImageUrls.length) {
                validPrimaryIndex = 0;
            }

            const productData: any = {
                name: productFormData.name,
                price: productFormData.price,
                images: allImageUrls,
                primary_image_index: validPrimaryIndex,
                image: allImageUrls[validPrimaryIndex],
            };

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
                throw new Error("Permission denied. Only admins can manage products.");
            }

            let productToUpdate: any;

            if (editingProduct) {
                // Update existing product
                const updateData: any = {
                    title: productData.name || "Untitled Product",
                    name: productData.name || "Untitled Product",
                    price: productData.price || "",
                    price_per_day: productData.price ? parseFloat(productData.price.replace(/[₹,]/g, '')) || null : null,
                    image: productData.image || "",
                    images: productData.images,
                    primary_image_index: productData.primary_image_index,
                };

                if (productFormData.originalPrice && productFormData.originalPrice.trim() !== "") {
                    const originalPriceNum = parseFloat(productFormData.originalPrice);
                    if (!isNaN(originalPriceNum)) {
                        updateData.original_price = originalPriceNum;
                    }
                }

                const { data: updatedProduct, error: updateError } = await supabase
                    .from("products")
                    .update(updateData)
                    .eq("id", editingProduct.id)
                    .select()
                    .single();

                if (updateError) {
                    // If it's a schema cache error, provide helpful message
                    if (updateError.message?.includes('schema cache') || updateError.message?.includes('images')) {
                        throw new Error(
                            `Database schema error: The 'images' column may not exist yet. ` +
                            `Please run the migration file 'sql/MIGRATION_PRODUCT_IMAGES.sql' in Supabase SQL Editor, ` +
                            `then wait 1-2 minutes for the schema cache to refresh. ` +
                            `Original error: ${updateError.message}`
                        );
                    }
                    throw updateError;
                }

                if (!updatedProduct) {
                    throw new Error(`Failed to update product: No product found with ID ${editingProduct.id}. The product may have been deleted.`);
                }

                productToUpdate = updatedProduct;

                // Delete existing facet associations
                await Promise.all([
                    supabase.from("product_product_types").delete().eq("product_id", editingProduct.id),
                    supabase.from("product_occasions").delete().eq("product_id", editingProduct.id),
                    supabase.from("product_colors").delete().eq("product_id", editingProduct.id),
                    supabase.from("product_materials").delete().eq("product_id", editingProduct.id),
                    supabase.from("product_cities").delete().eq("product_id", editingProduct.id),
                ]);
            } else {
                // Create new product
                // Generate Custom Product ID: AR-UserSuffix-Count
                // FIX: Use MAX existing ID instead of Count to avoid duplicates when products are deleted
                const { data: userProducts } = await supabase
                    .from("products")
                    .select("product_id")
                    .eq("owner_user_id", userId);

                // Need user's custom ID. We loaded user earlier but might not have custom_id.
                // Let's ensure we fetch it.
                const { data: userDataForId } = await supabase.from("users").select("custom_id").eq("id", userId).single();

                let productId = "";
                if (userDataForId?.custom_id) {
                    const userSuffix = userDataForId.custom_id.slice(-3);

                    // Find the highest sequence number currently in use for this user suffix
                    let maxSequence = 0;
                    if (userProducts && userProducts.length > 0) {
                        userProducts.forEach(p => {
                            if (p.product_id && p.product_id.includes(userSuffix)) {
                                // Expected format: AR-XXX01
                                // Extract the last digits
                                const parts = p.product_id.split('-');
                                if (parts.length >= 2) {
                                    const suffixPart = parts[parts.length - 1]; // e.g. XXX01
                                    // The suffix part contains the user last 3 chars (XXX) + sequence (01)
                                    // User suffix is known "userSuffix".
                                    // Let's try to slice it out.
                                    // Actually, generated ID is `AR-${userSuffix}${countStr}`
                                    // So suffixPart starts with userSuffix.
                                    if (suffixPart.startsWith(userSuffix)) {
                                        const numPart = suffixPart.slice(userSuffix.length);
                                        const num = parseInt(numPart, 10);
                                        if (!isNaN(num) && num > maxSequence) {
                                            maxSequence = num;
                                        }
                                    }
                                }
                            }
                        });
                    }

                    const nextSequence = maxSequence + 1;
                    const countStr = nextSequence.toString().padStart(2, '0');
                    productId = `AR-${userSuffix}${countStr}`;
                } else {
                    // Fallback if no custom ID
                    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
                    productId = `PROD-${randomPart}`;
                }

                productData.product_id = productId;

                const insertData: any = {
                    owner_user_id: userId,
                    title: productData.name || "Untitled Product",
                    name: productData.name || "Untitled Product",
                    price: productData.price || "",
                    price_per_day: productData.price ? parseFloat(productData.price.replace(/[₹,]/g, '')) || null : null,
                    image: productData.image || "",
                    images: productData.images,
                    primary_image_index: productData.primary_image_index,
                    product_id: productId,
                    is_active: true,
                };

                if (productFormData.originalPrice && productFormData.originalPrice.trim() !== "") {
                    const originalPriceNum = parseFloat(productFormData.originalPrice);
                    if (!isNaN(originalPriceNum)) {
                        insertData.original_price = originalPriceNum;
                    }
                }

                const { data: insertedProduct, error: insertError } = await supabase
                    .from("products")
                    .insert(insertData)
                    .select()
                    .single();

                if (insertError) {
                    // If it's a schema cache error, provide helpful message
                    if (insertError.message?.includes('schema cache') || insertError.message?.includes('images')) {
                        throw new Error(
                            `Database schema error: The 'images' column may not exist yet. ` +
                            `Please run the migration file 'sql/QUICK_FIX_ADD_IMAGES_COLUMN.sql' in Supabase SQL Editor, ` +
                            `then wait 1-2 minutes for the schema cache to refresh. ` +
                            `Original error: ${insertError.message}`
                        );
                    }
                    throw insertError;
                }
                productToUpdate = insertedProduct;
            }

            // Save facet associations to junction tables
            const facetPromises: Array<Promise<{ error: any }>> = [];

            // Product Types
            if (productFormData.productTypes.length > 0) {
                const productTypeIds = productFormData.productTypes
                    .map(name => availableProductTypes.find(pt => pt.name === name)?.id)
                    .filter((id): id is string => id !== undefined);

                if (productTypeIds.length > 0) {
                    facetPromises.push(
                        Promise.resolve(supabase.from("product_product_types").insert(
                            productTypeIds.map(typeId => ({
                                product_id: productToUpdate.id,
                                type_id: typeId
                            }))
                        )).then(res => res)
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
                        Promise.resolve(supabase.from("product_occasions").insert(
                            occasionIds.map(occasionId => ({
                                product_id: productToUpdate.id,
                                occasion_id: occasionId
                            }))
                        )).then(res => res)
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
                        Promise.resolve(supabase.from("product_colors").insert(
                            colorIds.map(colorId => ({
                                product_id: productToUpdate.id,
                                color_id: colorId
                            }))
                        )).then(res => res)
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
                        Promise.resolve(supabase.from("product_materials").insert(
                            materialIds.map(materialId => ({
                                product_id: productToUpdate.id,
                                material_id: materialId
                            }))
                        )).then(res => res)
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
                        Promise.resolve(supabase.from("product_cities").insert(
                            cityIds.map(cityId => ({
                                product_id: productToUpdate.id,
                                city_id: cityId
                            }))
                        )).then(res => res)
                    );
                }
            }

            // Execute all facet insertions
            const facetResults = await Promise.all(facetPromises);
            const facetErrors = facetResults.filter(r => r.error).map(r => r.error);
            if (facetErrors.length > 0) {
                console.error("Some facet associations failed:", facetErrors);
            }

            showPopup(editingProduct ? "Product updated successfully!" : "Product added successfully!", "success");

            // Redirect back to manage products page after a short delay
            setTimeout(() => {
                router.push(`/admin/manage-products?userId=${userId}`);
            }, 500);

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
                    <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-black mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white rounded-none border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{editingProduct ? "Edit Product" : "Add Product"}</h1>
                            {user && (
                                <p className="text-sm text-gray-600 mt-1">For: {user.name} ({user.phone})</p>
                            )}
                        </div>
                        <button
                            onClick={() => router.push(`/admin/manage-products/${userId}`)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-none hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="bg-white rounded-none border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-none border-2 ${currentStep >= 1 ? 'bg-black border-black text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                <span className="font-semibold">1</span>
                            </div>
                            <div className={`w-24 h-1 mx-2 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>
                            <div className={`flex items-center justify-center w-10 h-10 rounded-none border-2 ${currentStep >= 2 ? 'bg-black border-black text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                <span className="font-semibold">2</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-4 gap-16">
                        <div className="text-center">
                            <p className={`text-sm font-medium ${currentStep >= 1 ? 'text-black' : 'text-gray-400'}`}>Product Details</p>
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-medium ${currentStep >= 2 ? 'text-black' : 'text-gray-400'}`}>Category Section</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-none border border-gray-200 p-6">
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
                            // When editing, allow existing images; when creating, require new images
                            if (!editingProduct && productImageFiles.length === 0) {
                                showPopup("Please upload at least one product image", "warning", "Validation Error");
                                return;
                            }

                            if (editingProduct && productImageFiles.length === 0 && productImages.length === 0) {
                                showPopup("At least one image is required", "warning", "Validation Error");
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rental Price *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={productFormData.price}
                                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="e.g., 999"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="e.g., 1299"
                                />
                                <p className="text-xs text-gray-500 mt-1">Original purchase price of the outfit (required)</p>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-none p-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">
                                    Upload Product Images *
                                </label>
                                <label
                                    htmlFor="product-images-input"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-none bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                                    <div className="mt-3 border border-gray-200 rounded-none bg-white">
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

                            {/* Display existing images when editing */}
                            {editingProduct && productImages.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Existing Product Images ({productImages.length})
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {productImages.map((imgUrl, index) => (
                                            <div key={`existing-${index}`} className="relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => setPrimaryImage(index)}
                                                    className="relative w-full aspect-square rounded-none overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-all"
                                                >
                                                    <Image
                                                        src={imgUrl}
                                                        alt={`Existing image ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                    <div className="absolute top-2 right-2 z-10">
                                                        <div className={`${primaryImageIndex === index ? 'bg-red-500' : 'bg-white/80'} rounded-none p-1.5 shadow-md`}>
                                                            <svg
                                                                className={`w-5 h-5 ${primaryImageIndex === index ? 'text-white fill-white' : 'text-gray-400'}`}
                                                                fill={primaryImageIndex === index ? "currentColor" : "none"}
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div
                                                        role="button"
                                                        aria-label="Remove image"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newImages = productImages.filter((_, i) => i !== index);
                                                            setProductImages(newImages);
                                                            // Adjust primary index if needed
                                                            if (primaryImageIndex === index) {
                                                                setPrimaryImageIndex(newImages.length > 0 ? 0 : (productImagePreviews.length > 0 ? productImages.length : 0));
                                                            } else if (primaryImageIndex > index) {
                                                                setPrimaryImageIndex(primaryImageIndex - 1);
                                                            }
                                                        }}
                                                        className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-none p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
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

                            {/* Display newly uploaded image previews */}
                            {productImagePreviews.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        New Product Images ({productImagePreviews.length})
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {productImagePreviews.map((preview, index) => {
                                            const totalIndex = productImages.length + index;
                                            return (
                                                <div key={`preview-${index}`} className="relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPrimaryImage(totalIndex)}
                                                        className="relative w-full aspect-square rounded-none overflow-hidden border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all"
                                                    >
                                                        <Image
                                                            src={preview}
                                                            alt={`New image ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        <div
                                                            role="button"
                                                            aria-label="Remove image"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeImage(totalIndex);
                                                            }}
                                                            className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-none p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
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

                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/admin/manage-products/${userId}`)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity"
                                >
                                    Next: Select Facets
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSaveProduct} className="space-y-6">
                            {/* Step 1 Summary */}
                            <div className="bg-gray-50 border border-gray-200 rounded-none p-4 mb-6">
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
                                        <p className="text-sm font-medium text-gray-900">
                                            {productImages.length + productImagePreviews.length} image{(productImages.length + productImagePreviews.length) !== 1 ? 's' : ''}
                                            {editingProduct && productImages.length > 0 && ` (${productImages.length} existing, ${productImagePreviews.length} new)`}
                                            {!editingProduct && productImagePreviews.length > 0 && ' uploaded'}
                                        </p>
                                    </div>
                                </div>
                                {(productImages.length > 0 || productImagePreviews.length > 0) && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 mb-2">Product Images</p>
                                        <div className="flex gap-2 overflow-x-auto">
                                            {/* Show existing images first */}
                                            {productImages.slice(0, 3).map((imgUrl, index) => (
                                                <div key={`existing-summary-${index}`} className="relative w-16 h-16 rounded-none border border-gray-300 overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={imgUrl}
                                                        alt={`Existing ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ))}
                                            {/* Then show new previews */}
                                            {productImagePreviews.slice(0, Math.max(0, 3 - productImages.length)).map((preview, index) => (
                                                <div key={`preview-summary-${index}`} className="relative w-16 h-16 rounded-none border border-gray-300 overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ))}
                                            {(productImages.length + productImagePreviews.length) > 3 && (
                                                <div className="flex items-center justify-center w-16 h-16 rounded-none border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium">
                                                    +{(productImages.length + productImagePreviews.length) - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category Selection Sections */}
                            <div className="space-y-6">
                                {/* Product Types */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Category
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddProductType(!showAddProductType);
                                                if (showAddProductType) {
                                                    setNewProductTypeName("");
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                            </svg>
                                            {showAddProductType ? "Cancel" : "Add New"}
                                        </button>
                                    </div>

                                    {showAddProductType && (
                                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-none">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newProductTypeName}
                                                    onChange={(e) => setNewProductTypeName(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddNewProductType();
                                                        }
                                                    }}
                                                    placeholder="Enter new category"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewProductType}
                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full border border-gray-300 rounded-none min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableProductTypes.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No categories available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableProductTypes.map((pt) => {
                                                    const isSelected = productFormData.productTypes.includes(pt.name);
                                                    return (
                                                        <label
                                                            key={pt.id}
                                                            className={`flex items-center gap-2 p-2 rounded-none cursor-pointer transition-colors ${isSelected
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
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded-none focus:ring-blue-500"
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
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Occasion
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddOccasion(!showAddOccasion);
                                                if (showAddOccasion) {
                                                    setNewOccasionName("");
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                            </svg>
                                            {showAddOccasion ? "Cancel" : "Add New"}
                                        </button>
                                    </div>

                                    {showAddOccasion && (
                                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-none">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newOccasionName}
                                                    onChange={(e) => setNewOccasionName(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddNewOccasion();
                                                        }
                                                    }}
                                                    placeholder="Enter new occasion"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewOccasion}
                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full border border-gray-300 rounded-none min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableOccasions.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No occasions available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableOccasions.map((oc) => {
                                                    const isSelected = productFormData.occasions.includes(oc.name);
                                                    return (
                                                        <label
                                                            key={oc.id}
                                                            className={`flex items-center gap-2 p-2 rounded-none cursor-pointer transition-colors ${isSelected
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
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded-none focus:ring-blue-500"
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
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Color
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddColor(!showAddColor);
                                                if (showAddColor) {
                                                    setNewColorName("");
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                            </svg>
                                            {showAddColor ? "Cancel" : "Add New"}
                                        </button>
                                    </div>

                                    {showAddColor && (
                                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-none">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newColorName}
                                                    onChange={(e) => setNewColorName(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddNewColor();
                                                        }
                                                    }}
                                                    placeholder="Enter new color"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewColor}
                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full border border-gray-300 rounded-none min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableColors.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No colors available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableColors.map((c) => {
                                                    const isSelected = productFormData.colors.includes(c.name);
                                                    return (
                                                        <label
                                                            key={c.id}
                                                            className={`flex items-center gap-2 p-2 rounded-none cursor-pointer transition-colors ${isSelected
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
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded-none focus:ring-blue-500"
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
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Material
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddMaterial(!showAddMaterial);
                                                if (showAddMaterial) {
                                                    setNewMaterialName("");
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                            </svg>
                                            {showAddMaterial ? "Cancel" : "Add New"}
                                        </button>
                                    </div>

                                    {showAddMaterial && (
                                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-none">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newMaterialName}
                                                    onChange={(e) => setNewMaterialName(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddNewMaterial();
                                                        }
                                                    }}
                                                    placeholder="Enter new material"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewMaterial}
                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full border border-gray-300 rounded-none min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableMaterials.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No materials available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableMaterials.map((m) => {
                                                    const isSelected = productFormData.materials.includes(m.name);
                                                    return (
                                                        <label
                                                            key={m.id}
                                                            className={`flex items-center gap-2 p-2 rounded-none cursor-pointer transition-colors ${isSelected
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
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded-none focus:ring-blue-500"
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
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            City
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddCity(!showAddCity);
                                                if (showAddCity) {
                                                    setNewCityName("");
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                            </svg>
                                            {showAddCity ? "Cancel" : "Add New"}
                                        </button>
                                    </div>

                                    {showAddCity && (
                                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-none">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCityName}
                                                    onChange={(e) => setNewCityName(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddNewCity();
                                                        }
                                                    }}
                                                    placeholder="Enter new city"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewCity}
                                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-none hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full border border-gray-300 rounded-none min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-white">
                                        {availableCities.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No cities available. Add them from the admin panel.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableCities.map((city) => {
                                                    const isSelected = productFormData.cities.includes(city.name);
                                                    return (
                                                        <label
                                                            key={city.id}
                                                            className={`flex items-center gap-2 p-2 rounded-none cursor-pointer transition-colors ${isSelected
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
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded-none focus:ring-blue-500"
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
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-none hover:bg-gray-300 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploadingImage}
                                    className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploadingImage ? "Uploading..." : editingProduct ? "Update Product" : "Create Product"}
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
