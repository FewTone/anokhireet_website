"use client";

import { useState, useEffect } from "react";
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
    category?: string;
}

export default function ShirtCollection() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                // Get primary image from images array
                const productsList = data.map((p: any, index: number) => {
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
                setProducts(productsList);
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

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-4">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading products...</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-6 justify-center max-w-[1400px] mx-auto px-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
