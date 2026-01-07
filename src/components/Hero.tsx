"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface HeroSlide {
    image: string;
    title?: string;
}

export default function Hero() {
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="hero-container relative w-full overflow-hidden bg-white mt-[-64px] md:mt-0 pt-[64px] md:pt-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (heroSlides.length === 0) {
        return null;
    }

    // Duplicate slides multiple times for seamless infinite scroll
    // We need enough duplicates to ensure smooth continuous scrolling
    const duplicateCount = 5; // Creates 5 copies of the slides for seamless loop
    const duplicatedSlides = Array(duplicateCount).fill(heroSlides).flat();
    
    // Calculate animation duration based on number of slides
    // Each slide takes 8 seconds to scroll by (adjustable for speed)
    const slideDuration = 8;
    const animationDuration = heroSlides.length * slideDuration;

    return (
        <div className="hero-container relative w-full overflow-hidden bg-white mt-[-64px] md:mt-0 pt-[64px] md:pt-0">
            {/* Continuous Scrolling Track */}
            <div 
                className="hero-scroll-track flex items-start gap-4"
                style={{
                    animationDuration: `${animationDuration}s`,
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'linear'
                } as React.CSSProperties}
            >
                {duplicatedSlides.map((slide, index) => (
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
                                priority={index < heroSlides.length}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
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
                .hero-scroll-track {
                    --slide-width-mobile: 100vw;
                    --slide-width-desktop: calc((100vw - 32px) / 3);
                    --gap: 16px;
                    --scroll-distance-mobile: calc((var(--slide-width-mobile) + var(--gap)) * ${heroSlides.length});
                    --scroll-distance-desktop: calc((var(--slide-width-desktop) + var(--gap)) * ${heroSlides.length});
                    display: flex;
                    align-items: flex-start;
                    height: 100%;
                    will-change: transform;
                }
                @keyframes hero-scroll-infinite-mobile {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(calc(-1 * var(--scroll-distance-mobile)));
                    }
                }
                @keyframes hero-scroll-infinite-desktop {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(calc(-1 * var(--scroll-distance-desktop)));
                    }
                }
                .hero-scroll-track {
                    animation-name: hero-scroll-infinite-mobile;
                }
                @media (min-width: 768px) {
                    .hero-scroll-track {
                        animation-name: hero-scroll-infinite-desktop;
                    }
                }
            `}</style>
        </div>
    );
}
