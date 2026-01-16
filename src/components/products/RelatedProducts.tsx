import React from 'react';
import ProductCard from '../ProductCard';
import ProductCardSkeleton from '../ProductCardSkeleton';

// Define a minimal Product interface to avoid circular dependencies or massive imports if not needed.
// Or better yet, reuse the existing one if available. 
// Assuming the one in page.tsx is complex, detailed here or use 'any' if types are loose, 
// but better to match the usage in ProductCard. ProductCard expects 'any' or a specific type.
// Let's assume ProductCard handles the props.

interface RelatedProductsProps {
    products: any[];
    loading: boolean;
}

export default function RelatedProducts({ products, loading }: RelatedProductsProps) {
    // Determine the number of items to show. 
    // New and Popular skeleton suggests 8 items (4 cols * 2 rows).
    const displayProducts = products.slice(0, 8);

    if (!loading && displayProducts.length === 0) return null;

    return (
        <div className="w-full pb-12 mt-8 border-t border-gray-100 pt-8">
            <h2 className="text-[16px] leading-[24px] font-bold mb-3 md:mb-4 text-center uppercase tracking-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                YOU MIGHT ALSO LIKE
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : (
                    displayProducts.map((p) => (
                        <ProductCard key={p.id} product={p} disableHover={true} />
                    ))
                )}
            </div>
        </div>
    );
}
