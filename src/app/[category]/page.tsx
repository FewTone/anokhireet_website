"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

interface Product {
    id: number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string | string[];
}

export default function CategoryPage() {
    const params = useParams();
    const categorySlug = params?.category as string;
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState<string>("");

    useEffect(() => {
        if (categorySlug) {
            loadCategoryAndProducts();
        }
    }, [categorySlug]);

    const loadCategoryAndProducts = async () => {
        try {
            setLoading(true);
            
            // First, try to find the category by link_url to get the actual category name
            const { data: categoryData, error: categoryError } = await supabase
                .from("categories")
                .select("name, link_url")
                .or(`link_url.eq./${categorySlug},link_url.eq.${categorySlug}`)
                .single();

            let categoryNameToFilter = "";
            
            if (categoryData && !categoryError) {
                // Use the category name from the database
                categoryNameToFilter = categoryData.name;
                setCategoryName(categoryData.name);
            } else {
                // Fallback: convert slug to category name (e.g., "shirts" -> "Shirts")
                categoryNameToFilter = categorySlug
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                setCategoryName(categoryNameToFilter);
            }

            // Load products from products table
            const { data: productsData, error: productsError } = await supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false });

            if (productsError) throw productsError;

            if (productsData && productsData.length > 0) {
                // Filter products by category (handling both array and string formats)
                const filteredProducts = productsData
                    .filter((p: any) => {
                        const category = p.category || p.category_id || null;
                        if (!category) return false;
                        
                        // Handle array format
                        if (Array.isArray(category)) {
                            return category.some((cat: string) => 
                                cat.toLowerCase() === categoryNameToFilter.toLowerCase()
                            );
                        }
                        
                        // Handle string format
                        if (typeof category === 'string') {
                            return category.toLowerCase() === categoryNameToFilter.toLowerCase();
                        }
                        
                        return false;
                    })
                    .map((p: any, index: number) => {
                        // Get primary image from images array
                        let primaryImage = p.image || "";
                        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                            const primaryIndex = p.primary_image_index !== undefined && p.primary_image_index >= 0 && p.primary_image_index < p.images.length
                                ? p.primary_image_index
                                : 0;
                            primaryImage = p.images[primaryIndex] || p.images[0] || "";
                        }
                        
                        return {
                            id: typeof p.id === 'string' ? p.id : 1000000 + index,
                            productId: p.product_id || p.id,
                            name: p.title || p.name,
                            price: p.price || (p.price_per_day !== null && p.price_per_day !== undefined ? String(p.price_per_day) : ""),
                            image: primaryImage,
                            category: p.category || p.category_id,
                        };
                    });
                
                setProducts(filteredProducts);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Error loading category products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-4 pb-12">
                <div className="max-w-[1400px] mx-auto px-4">
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                <span className="font-medium">Back to Home</span>
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {categoryName || categorySlug?.charAt(0).toUpperCase() + categorySlug?.slice(1) || "Category"}
                        </h1>
                        <p className="text-gray-600">
                            {products.length} product{products.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading products...</p>
                        </div>
                    ) : products.length === 0 ? (
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
                            <p className="text-gray-600">There are no products in this category yet.</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-6 justify-center">
                            {products.map((product) => (
                                <ProductCard 
                                    key={product.id} 
                                    product={{
                                        ...product,
                                        category: Array.isArray(product.category) 
                                            ? product.category.join(", ") 
                                            : product.category
                                    }} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}

