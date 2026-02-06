import { Metadata } from "next";
import { Suspense } from "react";
import ProductClient from "./ProductClient";
import { supabase } from "@/lib/supabase";

// Allow dynamic params that aren't pre-generated (Wait, output: export doesn't implement fallback)
// For static export, we must return ALL params.
export const dynamicParams = false; // Must be false for static export

export async function generateStaticParams() {
    try {
        // Fetch all approved products
        const { data: products, error } = await supabase
            .from("products")
            .select("product_id, custom_id, id")
            .in("status", ["approved", "pending_deactivation"])
            .eq("is_active", true);

        if (error || !products) {
            console.error("Error fetching products for static params:", error);
            return [];
        }

        // Generate params for both product_id and custom_id (if available) and id
        const params: { id: string }[] = [];

        products.forEach((p: any) => {
            if (p.product_id) params.push({ id: String(p.product_id) });
            if (p.custom_id) params.push({ id: String(p.custom_id) });
            if (p.id) params.push({ id: String(p.id) });
        });

        // Unique IDs only
        const uniqueParams = Array.from(new Set(params.map(p => p.id)))
            .map(id => ({ id }));

        return uniqueParams;
    } catch (err) {
        console.error("Exception generating static params for products:", err);
        return [];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const id = (await params).id;

    try {
        const { data: product } = await supabase
            .from("products")
            .select("title, name")
            .or(`product_id.eq.${id},custom_id.eq.${id},id.eq.${id}`)
            .single();

        const productName = product?.title || product?.name || "Product";
        const title = `${productName} | Anokhi Reet`;
        const description = "Discover timeless elegance and contemporary Indian styles at Anokhi Reet. Premium men's fashion handcrafted for the modern gentleman.";

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: "article",
            },
        };
    } catch (e) {
        return {
            title: "Product | Anokhi Reet",
            description: "Discover timeless elegance and contemporary Indian styles at Anokhi Reet. Premium men's fashion handcrafted for the modern gentleman.",
        };
    }
}

export default function ProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading product...</div>}>
            <ProductClient />
        </Suspense>
    );
}
