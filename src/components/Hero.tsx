"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface HeroSlide {
    image: string;
    title?: string;
}

export default function Hero() {
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const extendedSlides = useMemo(() => {
        if (heroSlides.length === 0) return [];
        // Clone the first few slides to ensure seamless looping on desktop (needs 3) and mobile (needs 1)
        // We clone 4 just to be safe and cover the desktop view width
        const cloneCount = Math.min(heroSlides.length, 4);
        return [...heroSlides, ...heroSlides.slice(0, cloneCount)];
    }, [heroSlides]);

    useEffect(() => {
        if (heroSlides.length === 0) return;

        // Reset state when slides change
        setCurrentSlideIndex(0);
        setIsTransitioning(true);

        const slideDuration = 4500; // 3s pause + 1.5s transition

        const startInterval = () => {
            // Clear existing interval to avoid duplicates
            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                setCurrentSlideIndex((prev) => {
                    // Logic: Increment. 
                    // The limit check and reset happens in the other useEffect
                    return prev + 1;
                });
                // Ensure transition is on for the move
                setIsTransitioning(true);
            }, slideDuration);
        };

        startInterval();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [heroSlides.length]);

    // Handle seamless loop reset
    useEffect(() => {
        if (heroSlides.length === 0) return;

        // If we have reached the start of the cloned set (which matches index 0)
        // We let the transition happen (visual move from N-1 to N)
        // Then we silently jump back to 0
        if (currentSlideIndex === heroSlides.length) {
            const transitionTime = 1500; // Must match CSS transition duration

            const timeout = setTimeout(() => {
                setIsTransitioning(false); // Turn off transition for instant jump
                setCurrentSlideIndex(0);   // Jump to real 0

                // Small delay to allow DOM to update with no-transition, then re-enable
                // requestAnimationFrame is usually safer for this but setTimeout 50ms is robust enough here
                setTimeout(() => {
                    setIsTransitioning(true);
                }, 50);

            }, transitionTime);

            return () => clearTimeout(timeout);
        }
    }, [currentSlideIndex, heroSlides.length]);

    const transitionDuration = 1500; // ms

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
                    title: slide.title
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

    const goToSlide = (index: number) => {
        setIsTransitioning(true);
        setCurrentSlideIndex(index);
        // Reset interval to avoid immediate jump after manual click
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setCurrentSlideIndex(prev => prev + 1);
                setIsTransitioning(true);
            }, 4500);
        }
    };

    if (loading) {
        return (
            <div className="hero-container relative w-full overflow-hidden bg-white mt-[-64px] md:mt-0 pt-[64px] md:pt-0 flex items-center justify-center">
            </div>
        );
    }

    if (heroSlides.length === 0) {
        return null;
    }

    // Helper to determine the active dot. 
    // If currentSlideIndex is at the clone (index === length), it corresponds to dot 0.
    const activeDotIndex = currentSlideIndex % heroSlides.length;

    return (
        <div className="hero-container relative w-full overflow-hidden bg-white mt-4 md:mt-0">
            {/* Hero Slides Track */}
            <div
                className="hero-scroll-track flex items-start gap-4"
                style={{
                    '--current-index': currentSlideIndex,
                    transition: isTransitioning
                        ? `transform ${transitionDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`
                        : 'none',
                } as React.CSSProperties}
            >
                {extendedSlides.map((slide, index) => (
                    <div
                        key={index}
                        className="hero-slide relative flex-shrink-0 aspect-[4/5]"
                    >
                        <div className="relative w-full h-full">
                            <Image
                                src={slide.image}
                                alt={slide.title || "Hero slide"}
                                fill
                                className="object-cover"
                                draggable={false}
                                priority={index < 4}
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                    </div>
                ))}
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${index === activeDotIndex
                            ? 'w-8 h-2 bg-black'
                            : 'w-2 h-2 bg-gray-400 hover:bg-gray-600'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            <style jsx global>{`
                .hero-container {
                    /* Mobile height logic */
                    height: calc(100vw * 1.25);
                }
                @media (min-width: 768px) {
                    .hero-container {
                        /* Desktop height logic */
                        height: calc((100vw - 32px) / 2.5 * 1.25);
                    }
                }
                .hero-slide {
                    width: 100vw; /* Mobile width */
                    aspect-ratio: 4 / 5;
                    height: auto;
                    flex-shrink: 0;
                    user-select: none;
                    -webkit-user-drag: none;
                }
                @media (min-width: 768px) {
                    .hero-slide {
                        width: calc((100vw - 32px) / 2.5); /* Desktop width */
                        aspect-ratio: 4 / 5;
                    }
                }
                .hero-scroll-track {
                    width: 100%;
                    will-change: transform;
                    /* Mobile Transform Calculation */
                    /* width = 100vw, gap = 16px */
                    transform: translateX(calc(-1 * (100vw + 16px) * var(--current-index)));
                }
                @media (min-width: 768px) {
                    .hero-scroll-track {
                        /* Desktop Transform Calculation */
                        /* width = (100vw - 32px)/2.5, gap = 16px */
                        transform: translateX(calc(-1 * ((100vw - 32px) / 2.5 + 16px) * var(--current-index)));
                    }
                }
            `}</style>
        </div>
    );
}
