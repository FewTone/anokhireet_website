"use client";

import Image from "next/image";
import Link from "next/link";

interface ProductProps {
    product: {
        id: number;
        productId?: string;
        name: string;
        price: string;
        image: string;
        category?: string;
    };
}

export default function ProductCard({ product }: ProductProps) {
    return (
        <Link href={`/products/${product.productId || product.id}`} className="block bg-white group">
            <div className="relative w-full aspect-[4/5] overflow-hidden mb-3 bg-gray-100">
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                        onError={(e) => {
                            console.error("Image load error for product:", product.name, product.image);
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-sm">No Image</span>
                    </div>
                )}
            </div>

            <div>
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 pr-2">
                        <h4 className="text-sm md:text-base font-medium tracking-tight text-neutral-900 line-clamp-2">
                            {product.name}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">
                            #{product.productId || product.id}
                        </p>
                    </div>
                    <p className="text-sm md:text-base font-normal text-neutral-900 whitespace-nowrap">
                        {product.price}
                    </p>
                </div>
            </div>
        </Link>
    );
}
