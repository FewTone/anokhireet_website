"use client";

import { useEffect } from "react";
import Image from "next/image";

interface Product {
    id: number;
    productId?: string;
    name: string;
    price: string;
    image: string;
    category?: string;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    const handleMakeInquiry = () => {
        // TODO: Implement inquiry functionality
        console.log("Make inquiry for product:", product);
        alert("Inquiry feature coming soon!");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Additional Image */}
                    <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
                        <div className="relative w-full aspect-[4/5] mb-4">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover rounded-lg"
                                sizes="256px"
                            />
                        </div>
                        
                        {/* Product Information Section */}
                        <div className="mt-auto space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                                    {product.name}
                                </h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {product.price}
                                </p>
                                {product.productId && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        #{product.productId}
                                    </p>
                                )}
                            </div>

                            {/* Expandable Sections */}
                            <div className="space-y-2">
                                <details className="border-t border-gray-200 pt-2">
                                    <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between">
                                        Product Information
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="ml-2"
                                        >
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </summary>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p>Detailed product information will appear here.</p>
                                    </div>
                                </details>

                                <details className="border-t border-gray-200 pt-2">
                                    <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between">
                                        Shipping & Returns
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="ml-2"
                                        >
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </summary>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p>Shipping and returns information will appear here.</p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area - Product Image */}
                    <div className="flex-1 flex items-center justify-center bg-white p-8">
                        <div className="relative w-full max-w-2xl aspect-[4/5]">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </div>

                    {/* Right Sidebar - CTA */}
                    <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
                        <div className="mt-auto">
                            <button
                                onClick={handleMakeInquiry}
                                className="w-full bg-gray-800 text-white font-semibold py-4 px-6 rounded-lg hover:bg-gray-900 transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                                Make Inquiry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

