"use client";

import Image from "next/image";

const storySections = [
    {
        id: "origin",
        src: "/images/Group 47.png",
        alt: "The Origin",
        align: "left",
        maxWidth: "800px",
    },
    {
        id: "thought",
        src: "/images/Group 49.png",
        alt: "The Thought",
        align: "right",
        maxWidth: "700px",
    },
    {
        id: "business",
        src: "/images/Group 65.png",
        alt: "The Business Perspective",
        align: "left",
        maxWidth: "650px",
    },
    {
        id: "solution",
        src: "/images/Group 57.png",
        alt: "The Solution",
        align: "right",
        maxWidth: "750px",
    },
    {
        id: "empowerment",
        src: "/images/Group 56.png",
        alt: "Women Empowerment",
        align: "left",
        maxWidth: "600px",
    },
    {
        id: "journey",
        src: "/images/Group 64.png",
        alt: "Our Journey Forward",
        align: "right",
        maxWidth: "450px",
    },
    {
        id: "belief",
        src: "/images/Group 63.png",
        alt: "Our Belief",
        align: "left",
        maxWidth: "600px",
    },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen text-white overflow-x-hidden relative">


            {/* Background Page Radial Gradient - Top to Bottom (from Figma) */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: 'radial-gradient(ellipse 80% 100% at 50% 0%, #890304 3%, #300000 20%, #2E0000 36%, #1A0000 100%)'
                }}
            />
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-24 flex flex-col gap-24 md:gap-40 items-center">

                {/* Hero Section - Static & Precise */}
                <section className="w-full relative flex items-center justify-center py-20 md:py-32 lg:py-48 overflow-visible">


                    {/* Mandala Background & Radial Glow - Centered together */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                        {/* The Glow */}
                        <div
                            className="absolute w-[500px] h-[500px] md:w-[800px] md:h-[800px] lg:w-[1200px] lg:h-[1200px] rounded-full"
                            style={{
                                background: 'radial-gradient(circle at 50% 50%, #890304 0%, #300000 45%, rgba(15, 0, 0, 0) 100%)',
                                filter: 'blur(60px)'
                            }}
                        />

                        {/* The Mandala */}
                        <div className="w-[280px] h-[280px] md:w-[500px] lg:w-[850px] lg:h-[850px] relative opacity-30">
                            <Image
                                src="/images/Vector.png"
                                alt=""
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Title & Envelope Composite */}
                    <div className="relative w-full max-w-[1000px] flex justify-center items-center px-4">
                        <div className="relative inline-block w-full max-w-[812px]">
                            {/* Main Title - Group 29 (812x264) */}
                            <div className="relative z-20 w-full">
                                <Image
                                    src="/images/Group%2029.png"
                                    alt="Anokhi Reet"
                                    width={812}
                                    height={264}
                                    className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                    priority
                                />
                            </div>

                            {/* Envelope Overlay - Group 38 (427x395) - Positioned lower without rotation/animation */}
                            <div className="absolute z-30 
                                           w-[180px] md:w-[350px] lg:w-[420px] 
                                           bottom-[-100px] right-[-50px]
                                           md:bottom-[-180px] md:right-[-120px]
                                           lg:bottom-[-260px] lg:right-[-200px]"
                            >
                                <Image
                                    src="/images/Group%2038.png"
                                    alt="Envelope"
                                    width={427}
                                    height={395}
                                    className="w-full h-auto drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)]"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story Sections - Static & Alternating */}
                <div className="w-full max-w-[1100px] flex flex-col gap-24 md:gap-40">
                    {storySections.map((section) => (
                        <section
                            key={section.id}
                            className={`w-full flex ${section.align === "left" ? "justify-start" : "justify-end"} ${section.id === "journey" ? "pr-12 md:pr-40" : ""}`}
                        >
                            <div
                                style={{ maxWidth: section.maxWidth }}
                                className="w-full"
                            >
                                <div className="relative overflow-hidden rounded-xl md:rounded-[2rem]">
                                    <Image
                                        src={section.src.replace(/ /g, '%20')}
                                        alt={section.alt}
                                        width={1100}
                                        height={800}
                                        className="w-full h-auto drop-shadow-xl"
                                    />
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {/* Bottom Section - Join the Story - Side by Side layout */}
                <section className="w-full max-w-[1200px] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 -mt-10 md:-mt-20">
                    {/* Bottom Envelope - Decorative Static with Rotation */}
                    <div className="w-[180px] md:w-[350px] lg:w-[450px] shrink-0">
                        <Image
                            src="/images/Group%2038.png"
                            alt="Envelope"
                            width={427}
                            height={395}
                            className="w-full h-auto drop-shadow-[0_45px_45px_rgba(0,0,0,0.6)] rotate-[5deg]"
                        />
                    </div>

                    {/* Join Text - Group 66 */}
                    <div className="w-full max-w-[713px] md:mt-20">
                        <Image
                            src="/images/Group%2066.png"
                            alt="Join the story"
                            width={713}
                            height={164}
                            className="w-full h-auto drop-shadow-lg"
                        />
                    </div>
                </section>
            </div>


        </main>
    );
}
