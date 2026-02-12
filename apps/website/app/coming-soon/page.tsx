"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ComingSoonPage() {
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [imageLoadCount, setImageLoadCount] = useState(0);
    const totalImages = 4; // left-decoration, right-decoration, mandala, logo

    useEffect(() => {
        // Check if all images are loaded
        if (imageLoadCount >= totalImages) {
            setImagesLoaded(true);
        }
    }, [imageLoadCount]);

    const handleImageLoad = () => {
        setImageLoadCount((prev) => prev + 1);
    };

    const handleImageError = () => {
        // Count as loaded even if error (to prevent blocking)
        setImageLoadCount((prev) => prev + 1);
    };

    return (
        <main className="min-h-screen bg-[#240000] bg-radial-brand flex flex-col items-center justify-center relative overflow-hidden text-[#E8E5C3]">
            {/* Side Decorations - Full Height Pattern on each side */}
            <div className="hidden md:block absolute top-0 left-0 h-full w-56 pointer-events-none opacity-100">
                <div className={`relative w-full h-full ${imagesLoaded ? 'block' : 'hidden'}`}>
                    <Image
                        src="/left-decoration.png"
                        alt="Left Decoration"
                        fill
                        className="object-fill object-left"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        priority
                        unoptimized
                    />
                </div>
            </div>

            <div className="hidden md:block absolute top-0 right-0 h-full w-56 pointer-events-none opacity-100">
                <div className={`relative w-full h-full ${imagesLoaded ? 'block' : 'hidden'}`}>
                    <Image
                        src="/right-decoration.png"
                        alt="Right Decoration"
                        fill
                        className="object-fill object-right"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        priority
                        unoptimized
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center z-10 w-full px-4 opacity-0 translate-y-5 animate-fadeInUp">
                {/* Top Text - "Coming Soon" */}
                <h1 className="text-2xl md:text-5xl font-[var(--font-playfair)] mb-8 tracking-wider text-center text-[#E8E5C3]">
                    We are Launching Soon
                </h1>

                {/* Central Mandala / Logo */}
                <div className="relative w-72 h-72 md:w-[36rem] md:h-[36rem] flex items-center justify-center mb-0">
                    {/* Main Mandala Pattern - Rotating */}
                    <div className="absolute inset-0 w-full h-full opacity-60 animate-rotate">
                        <div className={`relative w-full h-full ${imagesLoaded ? 'block' : 'hidden'}`}>
                            <Image
                                src="/mandala-pattern.png"
                                alt="Mandala Pattern"
                                fill
                                className="object-contain"
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                priority
                                unoptimized
                            />
                        </div>
                    </div>

                    {/* Central Logo - Fixed */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-40 h-40 md:w-64 md:h-64 pointer-events-none">
                            <div className={`relative w-full h-full ${imagesLoaded ? 'block' : 'hidden'}`}>
                                <Image
                                    src="/logo-icon.svg"
                                    alt="Anokhi Reet Logo"
                                    fill
                                    className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                    priority
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="flex flex-col items-center gap-3 mt-4">
                    <p className="text-[10px] md:text-sm tracking-[0.4em] font-[var(--font-inter)] uppercase opacity-70">
                        FOLLOW US FOR MORE UPDATES
                    </p>
                    <Link
                        href="https://instagram.com/anokhireet.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-inherit no-underline transition-colors duration-300 hover:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                        </svg>
                        <span className="font-[var(--font-playfair)] text-lg md:text-xl">@anokhireet.in</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}

