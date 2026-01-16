import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ProductGalleryProps {
    images: string[];
    productName: string;
    isInWishlist: boolean;
    isWishlistLoading: boolean;
    onToggleWishlist: (e?: React.MouseEvent) => void;
    onShare: () => void;
    onBack: () => void; // Mobile back button
}

export default function ProductGallery({
    images,
    productName,
    isInWishlist,
    isWishlistLoading,
    onToggleWishlist,
    onShare,
    onBack
}: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(images.length > 0 ? images[0] : null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update selected image if images prop changes
    React.useEffect(() => {
        if (images.length > 0) {
            setSelectedImage(images[0]);
        }
    }, [images]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollPosition = e.currentTarget.scrollLeft;
        const width = e.currentTarget.offsetWidth;
        const index = Math.round(scrollPosition / width);
        setActiveImageIndex(index);
    };

    return (
        <div className="lg:col-span-7">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Mobile Image Carousel (Visible only on mobile) */}
                <div className="md:hidden w-full relative">
                    {/* Overlay Buttons for Mobile */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                        {/* Back Button */}
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center pointer-events-auto bg-white rounded-full shadow-md z-30"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>

                        {/* Right Action Buttons */}
                        <div className="flex flex-col gap-4 pointer-events-auto items-center">
                            {/* Wishlist Button */}
                            <button
                                onClick={onToggleWishlist}
                                disabled={isWishlistLoading}
                                className="w-10 h-10 flex items-center justify-center transition-transform active:scale-95 bg-white rounded-full shadow-md"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill={isInWishlist ? "red" : "none"}
                                    stroke={isInWishlist ? "red" : "black"}
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={onShare}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[4/5] w-full bg-gray-100 relative"
                        onScroll={handleScroll}
                    >
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className="w-full flex-shrink-0 snap-center snap-always relative"
                                style={{ scrollSnapStop: 'always' }}
                            >
                                <Image
                                    src={img}
                                    alt={`${productName} - View ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="100vw"
                                    priority={index === 0}
                                    unoptimized
                                />
                            </div>
                        ))}
                        {images.length === 0 && (
                            <div className="w-full flex-shrink-0 snap-center relative flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                    {/* Mobile Dots Indicator */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
                            {images.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${index === activeImageIndex ? 'bg-black w-4' : 'bg-white/70 backdrop-blur-sm'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>


                {/* Desktop Image Gallery (Hidden on mobile) */}
                <div className="hidden md:flex flex-1 w-full flex-col gap-4">
                    {/* Breadcrumbs - Keeping inside as per original layout */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 mt-8">
                        <Link href="/" className="hover:text-black transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/products" className="hover:text-black transition-colors">Products</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium truncate max-w-xs">{productName}</span>
                    </div>

                    <div className="flex gap-6 justify-end items-start px-4">
                        {/* Left Side - Small Thumbnail Images */}
                        <div className="flex flex-col gap-3 w-20 flex-shrink-0 pt-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(img)}
                                    className={`relative w-full aspect-[4/5] border-2 transition-all overflow-hidden bg-gray-50 ${selectedImage === img
                                        ? "border-black"
                                        : "border-gray-300 hover:border-gray-500"
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`${productName} - View ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                        unoptimized
                                        onError={(e) => {
                                            console.error("Image load error:", img);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Center - Main Product Image */}
                        <div className="relative w-full max-w-[500px] aspect-[4/5] bg-gray-100 shadow-sm">
                            {selectedImage ? (
                                <Image
                                    src={selectedImage}
                                    alt={productName}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 50vw, 500px"
                                    priority
                                    unoptimized
                                    onError={(e) => {
                                        console.error("Image load error:", selectedImage);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                    <span>No Image</span>
                                </div>
                            )}
                        </div>

                        {/* Right Side - Action Buttons */}
                        <div className="flex flex-col gap-3 pt-4">
                            {/* Wishlist Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleWishlist(e);
                                }}
                                disabled={isWishlistLoading}
                                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill={isInWishlist ? "red" : "none"}
                                    stroke={isInWishlist ? "red" : "currentColor"}
                                    strokeWidth="1"
                                    className="text-gray-600 group-hover:text-red-500 transition-colors"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={onShare}
                                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                                title="Share Product"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    className="text-gray-600 group-hover:text-black transition-colors"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
