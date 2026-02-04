import React from 'react';
import localFont from 'next/font/local';

const arya = localFont({
    src: '../../../public/fonts/Arya-Regular.ttf',
    variable: '--font-arya',
});

export default function AboutPage() {
    return (
        <div
            className={`h-[5769px] w-full relative overflow-hidden ${arya.variable} font-sans`}
            style={{
                background: `radial-gradient(circle 1000px at 50% 50vmin, #890304 0%, transparent 70%), 
                             linear-gradient(180deg, #2E0000 0%, #1A0000 100%)`
            }}
        >
            {/* Vector Image Overlay */}
            <div className="absolute top-0 left-0 w-full pointer-events-none flex justify-center pt-0">
                <div className="relative h-[100vmin] w-[100vmin]">
                    <div
                        className="absolute inset-0 h-full w-full opacity-80"
                        style={{
                            backgroundColor: '#660101',
                            mask: 'url(/images/Vector.png) center/contain no-repeat',
                            WebkitMask: 'url(/images/Vector.png) center/contain no-repeat'
                        }}
                    />

                    {/* Title Text */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <img src="/images/Group 29.png" alt="" className="w-[85%] object-contain" />
                    </div>

                    {/* Envelope */}
                    <div className="absolute top-[57.7%] left-[67.7%] w-[47%] z-20">
                        <img src="/images/Group 38.png" alt="" className="w-full object-contain" />
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="relative z-30 pt-[110vmin] max-w-4xl mx-auto px-6 text-[#FFDCB5]">
                {/* The Origin Section */}
                <section className="mb-24">
                    <div className="flex items-start gap-[11px] mb-8">
                        <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                        <div className="pt-[4px]">
                            <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2B890] inline-block h-[24px]">The Origin</span>
                            <h2
                                className="text-[40px] leading-[72px] mt-[8px]"
                                style={{
                                    fontFamily: 'var(--font-arya), serif',
                                    backgroundImage: 'linear-gradient(90deg, #F8B97A 0%, #E0B073 25%, #B98A3F 38%, #EBB97A 56%, #BB897A 80%, #80533A 100%)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'inline-block'
                                }}
                            >
                                कहानी दिल से शुरू हुई
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90 pl-[111px]">
                        <p>Every Indian woman has a wardrobe full of stories.</p>
                        <p>
                            Bridal lehengas worn once, festive sarees saved for "special occasions",
                            traditional outfits that carry memories — <span style={{ fontFamily: 'var(--font-arya)' }}>यादें</span> — not just fabric.
                        </p>
                        <p>But over time, we noticed a quiet truth.</p>
                        <p>
                            These beautiful clothes remain unused. Not because they are forgotten,
                            but because today's world rarely allows repeating the same outfit again and again.
                        </p>
                        <p>
                            And yet, many women quietly wish that these clothes could do more —
                            that they could help another woman feel confident, beautiful, and make her own
                            <span style={{ fontFamily: 'var(--font-arya)' }}> ख़ास मौका</span> even more memorable.
                        </p>
                    </div>
                </section>

                {/* The Thought Section */}
                <section className="mb-24">
                    <div className="flex flex-col items-center justify-center text-center">
                        <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain mb-6" />
                        <div>
                            <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2B890] inline-block h-[24px]">The Thought</span>
                            <h2
                                className="text-[40px] leading-[72px] mt-[8px] mb-6"
                                style={{
                                    fontFamily: 'var(--font-arya), serif',
                                    backgroundImage: 'linear-gradient(90deg, #F8B97A 0%, #E0B073 25%, #B98A3F 38%, #EBB97A 56%, #BB897A 80%, #80533A 100%)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'inline-block'
                                }}
                            >
                                जब एक सवाल उठा
                            </h2>
                            <p className="text-[20px] leading-[32px] opacity-80 italic">
                                समझा आया The gap we couldn't ignore
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
