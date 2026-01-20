"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/Skeleton";

interface HeroSlide {
    image: string;
    title?: string;
}

export default function Hero() {
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [transitionDuration, setTransitionDuration] = useState(3000); // Dynamic duration
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Touch handling refs
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const isDragging = useRef(false);
    const minSwipeDistance = 50;

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
        // Clone the entire list to ensure safe seamless looping for multiple cycles
        return [...heroSlides, ...heroSlides];
    }, [heroSlides]);

    const resetInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setTransitionDuration(3000);
            setIsTransitioning(true);
            setCurrentSlideIndex((prev) => prev + 1);
        }, 3500);
    };

    useEffect(() => {
        if (heroSlides.length === 0) return;

        // Reset state when slides change
        setCurrentSlideIndex(0);
        setIsTransitioning(true);
        setTransitionDuration(3000);

        resetInterval();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [heroSlides.length]);

    // Handle seamless loop reset
    useEffect(() => {
        if (heroSlides.length === 0) return;

        // If we have advanced past the original set (entering the clone zone)
        if (currentSlideIndex >= heroSlides.length) {
            // We allow the transition to complete (showing the clone)
            // Then we silently jump back to the original

            // Wait for transition to finish
            const timeout = setTimeout(() => {
                setIsTransitioning(false); // Turn off transition for silent jump
                const realIndex = currentSlideIndex % heroSlides.length;
                setCurrentSlideIndex(realIndex);   // Jump to corresponding real slide

                // Small delay to allow DOM to update, then re-enable transition for next move
                setTimeout(() => {
                    setIsTransitioning(true);
                }, 50);

            }, transitionDuration);

            return () => clearTimeout(timeout);
        }
    }, [currentSlideIndex, heroSlides.length, transitionDuration]);

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
        setTransitionDuration(500); // 500ms for manual nav
        setIsTransitioning(true);
        setCurrentSlideIndex(index);
        resetInterval();
    };

    const nextSlide = () => {
        goToSlide(currentSlideIndex + 1);
    };

    const prevSlide = () => {
        resetInterval();
        setTransitionDuration(500);

        if (currentSlideIndex === 0) {
            // Bidirectional loop handling: 0 -> prev must jump to clone first
            setIsTransitioning(false);
            setCurrentSlideIndex(heroSlides.length);

            // Wait a frame then animate back
            setTimeout(() => {
                setIsTransitioning(true);
                setCurrentSlideIndex(heroSlides.length - 1);
            }, 50);
        } else {
            setIsTransitioning(true);
            setCurrentSlideIndex(prev => prev - 1);
        }
    };

    // Touch Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        if (intervalRef.current) clearInterval(intervalRef.current); // Pause auto-scroll
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) {
            resetInterval();
            return;
        }

        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        } else {
            // Keep interval if no valid swipe
            resetInterval();
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Mouse Handlers (Desktop Drag)
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection/drag native behavior
        isDragging.current = true;
        touchStartX.current = e.clientX;
        touchEndX.current = null; // Reset end
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        touchEndX.current = e.clientX;
    };

    const onMouseUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        // Reuse onTouchEnd logic since it relies on touchStartX/touchEndX refs which we set up
        onTouchEnd();
    };

    const onMouseLeave = () => {
        if (isDragging.current) {
            onMouseUp();
        }
    };

    if (loading) {
        return (
            <div className="hero-container relative w-full overflow-hidden bg-white pt-20 md:pt-0">
                <div className="flex items-start gap-0 md:gap-[10px] w-full">
                    {/* Desktop: Show multiple skeletons */}
                    {/* Mobile: Show one skeleton */}
                    <div className="hero-slide relative flex-shrink-0 aspect-[4/5] w-full md:w-[calc((100vw-32px)/2.7)]">
                        <Skeleton className="w-full h-full rounded-none" />
                    </div>
                    <div className="hidden md:block hero-slide relative flex-shrink-0 aspect-[4/5] w-[calc((100vw-32px)/2.7)]">
                        <Skeleton className="w-full h-full rounded-none" />
                    </div>
                    <div className="hidden md:block hero-slide relative flex-shrink-0 aspect-[4/5] w-[calc((100vw-32px)/2.7)]">
                        <Skeleton className="w-full h-full rounded-none" />
                    </div>
                </div>
                {/* Reusing styles from below for consistency */}
                <style jsx global>{`
                .hero-container {
                    width: 100%;
                    aspect-ratio: 4/5;
                }
                @media (min-width: 768px) {
                    .hero-container {
                        aspect-ratio: auto;
                        height: calc((100vw - 32px) / 2.7 * 1.25);
                    }
                }
            `}</style>
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
        <div
            className="hero-container relative w-full overflow-hidden bg-white pt-20 md:pt-0 cursor-grab active:cursor-grabbing"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            {/* Hero Slides Track */}
            <div
                className="hero-scroll-track flex items-start gap-0 md:gap-[10px]"
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
                    /* Mobile: Remove fixed aspect ratio to allow expansion with padding */
                    width: 100%;
                    height: auto;
                }
                @media (min-width: 768px) {
                    .hero-container {
                        /* Desktop: Explicit height calculation based on slide width */
                        aspect-ratio: auto;
                        height: calc((100vw - 32px) / 2.7 * 1.25);
                    }
                }
                .hero-slide {
                    width: 100%; /* Mobile: Match parent width exactly */
                    aspect-ratio: 4 / 5;
                    height: auto;
                    flex-shrink: 0;
                    user-select: none;
                    -webkit-user-drag: none;
                }
                @media (min-width: 768px) {
                    .hero-slide {
                        width: calc((100vw - 32px) / 2.7); /* Desktop width */
                        aspect-ratio: 4 / 5;
                    }
                }
                .hero-scroll-track {
                    width: 100%;
                    will-change: transform;
                    /* Mobile Transform: Move by 100% of container width per index */
                    transform: translateX(calc(-100% * var(--current-index)));
                }
                @media (min-width: 768px) {
                    .hero-scroll-track {
                        /* Desktop Transform: Includes gap calculation */
                        transform: translateX(calc(-1 * ((100vw - 32px) / 2.7 + 10px) * var(--current-index)));
                    }
                }
            `}</style>
        </div>
    );
}
