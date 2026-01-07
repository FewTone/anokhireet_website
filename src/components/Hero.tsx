"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface HeroSlide {
    image: string;
    title: string;
    subtitle?: string;
}

export default function Hero() {
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    
    // We need enough clones to fill the desktop view (which shows 3-4 slides)
    // Cloning 4 from each end ensures we never see a "gap" even on wide screens.
    const numClones = 4;
    
    const originalLength = heroSlides.length;
    
    const slides = originalLength > 0 ? [
        ...heroSlides.slice(-numClones),
        ...heroSlides,
        ...heroSlides.slice(0, numClones),
    ] : [];

    useEffect(() => {
        loadHeroSlides();
        
        // Set up realtime subscription for hero slides
        const channel = supabase
            .channel('hero-slides-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'hero_slides'
                },
                () => {
                    loadHeroSlides();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadHeroSlides = async () => {
        try {
            const { data, error } = await supabase
                .from("hero_slides")
                .select("*")
                .eq("is_active", true)
                .order("display_order", { ascending: true });

            if (error) {
                console.error("Error loading hero slides:", error);
                return;
            }

            if (data && data.length > 0) {
                const mapped = data.map(slide => ({
                    image: slide.image_url,
                    title: slide.title,
                    subtitle: slide.subtitle || ""
                }));
                setHeroSlides(mapped);
            } else {
                setHeroSlides([]);
            }
        } catch (error) {
            console.error("Error loading hero slides:", error);
        } finally {
            setLoading(false);
        }
    };

    const [currentIndex, setCurrentIndex] = useState(numClones);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const currentIndexRef = useRef(currentIndex);
    const isResettingRef = useRef(false);

    // Keep ref in sync with state
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => {
            const nextIndex = prev + 1;
            // If we're about to go past the end clones, we'll handle it in transitionEnd
            return nextIndex;
        });
        setIsTransitioning(true);
    }, []);

    const handleTransitionEnd = useCallback(() => {
        const index = currentIndexRef.current;
        
        // Prevent multiple resets
        if (isResettingRef.current) return;
        
        setIsTransitioning(false);
        
        // If we reach the end clones, snap back to the start of original slides
        if (index >= originalLength + numClones) {
            isResettingRef.current = true;
            // Use requestAnimationFrame for smooth reset
            requestAnimationFrame(() => {
                setCurrentIndex(numClones);
                requestAnimationFrame(() => {
                    isResettingRef.current = false;
                });
            });
        }
        // If we reach the beginning clones (for prev navigation), snap to the end of original slides
        else if (index < numClones) {
            isResettingRef.current = true;
            requestAnimationFrame(() => {
                setCurrentIndex(originalLength + numClones - 1);
                requestAnimationFrame(() => {
                    isResettingRef.current = false;
                });
            });
        }
    }, [originalLength, numClones]);

    useEffect(() => {
        if (isPaused) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // Start the carousel after initial delay
        const initialTimeout = setTimeout(() => {
            handleNext();
        }, 4000);

        // Then continue with interval
        timerRef.current = setInterval(() => {
            handleNext();
        }, 4000);

        return () => {
            clearTimeout(initialTimeout);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isPaused, handleNext]);


    // Calculate dot index for the pagination indicators
    let dotIndex = (currentIndex - numClones) % originalLength;
    if (dotIndex < 0) dotIndex += originalLength;

    if (loading) {
        return (
            <div className="hero-container relative w-full overflow-hidden bg-white mt-[-64px] md:mt-0 pt-[64px] md:pt-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (originalLength === 0) {
        return null;
    }

    return (
        <div
            className="hero-container relative w-full overflow-hidden bg-white mt-[-64px] md:mt-0 pt-[64px] md:pt-0"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Slider Track */}
            <div
                className={`flex items-start gap-4 ${isTransitioning ? "transition-transform duration-1000 ease-in-out" : ""}`}
                onTransitionEnd={handleTransitionEnd}
                style={{
                    transform: `translateX(calc(-${currentIndex} * (var(--slide-width) + 16px)))`,
                    height: '100%',
                } as React.CSSProperties}
            >
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className="hero-slide relative flex-shrink-0 aspect-[4/5]"
                    >
                        <div className="relative w-full h-full">
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                className="object-cover"
                                draggable={false}
                                priority={index >= numClones && index < numClones + originalLength}
                            />
                            {/* Gradient Overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />


                            <div className="absolute bottom-6 md:bottom-8 left-0 w-full px-6 md:px-8 text-white z-10 pointer-events-none">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-[-0.05em] mb-2 md:mb-3 leading-[0.9] drop-shadow-2xl">
                                    {slide.title}
                                </h2>
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-90 drop-shadow-lg">
                                    {slide.subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Dots */}
            {originalLength > 0 && (
                <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-50 pointer-events-auto">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setIsTransitioning(true);
                                setCurrentIndex(index + numClones);
                            }}
                            className={`transition-all duration-300 rounded-full cursor-pointer h-2.5 shadow-lg ${index === dotIndex
                                ? "w-10 bg-white opacity-100"
                                : "w-2.5 bg-white/70 hover:bg-white hover:opacity-100"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}



            <style jsx>{`
        .hero-container {
          height: calc(100vw * 1.25);
        }
        @media (min-width: 768px) {
          .hero-container {
            height: calc((100vw - 32px) / 3 * 1.25);
          }
        }
        .hero-slide {
          width: 100vw;
          aspect-ratio: 4 / 5;
          height: auto;
          flex-shrink: 0;
          user-select: none;
          -webkit-user-drag: none;
        }
        @media (min-width: 768px) {
          .hero-slide {
            width: calc((100vw - 32px) / 3);
            aspect-ratio: 4 / 5;
            height: auto;
          }
        }
        div.flex {
            --slide-width: 100vw;
            align-items: flex-start;
            height: 100%;
        }
        @media (min-width: 768px) {
            div.flex {
                --slide-width: calc((100vw - 32px) / 3);
            }
        }
      `}</style>
        </div>
    );
}
