import React from 'react';
import localFont from 'next/font/local';

const arya = localFont({
    src: '../../../public/fonts/Arya-Regular.ttf',
    variable: '--font-arya',
});

const hindiStyle: React.CSSProperties = {
    fontFamily: 'var(--font-arya), serif',
    backgroundImage: 'linear-gradient(90deg, #F8B97A 0%, #E0B073 25%, #B98A3F 38%, #EBB97A 56%, #BB897A 80%, #80533A 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block'
};

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
                        <div className="flex flex-col pt-[8px]">
                            <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">The Origin</span>
                            <div className="mt-[4px]">
                                <h2
                                    className="text-[40px] leading-[72px]"
                                    style={hindiStyle}
                                >
                                    कहानी दिल से सुरु हुई
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90">
                        <p>Every Indian woman has a wardrobe full of stories.</p>
                        <p>
                            Bridal lehengas worn once,<br />
                            festive sarees saved for "special occasions",<br />
                            traditional outfits that carry memories — <span style={hindiStyle}>यादें</span> — not just fabric.
                        </p>
                        <p>But over time, we noticed a quiet truth.</p>
                        <p>
                            These beautiful clothes remain unused.<br />
                            Not because they are forgotten,<br />
                            but because today's world rarely allows repeating the same outfit again and again.
                        </p>
                        <p>
                            And yet, many women quietly wish that these clothes could do more —<br />
                            that they could help another woman feel confident, beautiful, and make her own<br />
                            <span style={hindiStyle}> ख़ास मौका</span> even more memorable.
                        </p>
                    </div>
                </section>

                {/* The Thought Section */}
                <section className="mb-24">
                    <div className="flex items-start gap-[11px] mb-8">
                        <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                        <div className="flex flex-col pt-[8px]">
                            <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">The Thought</span>
                            <div className="mt-[4px]">
                                <h2
                                    className="text-[40px] leading-[72px]"
                                    style={hindiStyle}
                                >
                                    जब एक सवाल उठा
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90">
                        <p>
                            <span style={hindiStyle}>समझा आया</span> The gap we couldn't ignore
                        </p>
                        <p>The more we looked, the clearer it became.</p>
                        <p>
                            Across India, in almost every home, traditional wear sits idle —<br />
                            expensive, exquisite, and rarely worn.
                        </p>
                        <p>
                            Women want to rent them out.<br />
                            They want to earn from them.<br />
                            But there is no simple, trusted way to do it.
                        </p>
                        <p>
                            No platform that truly celebrates the owner.<br />
                            No space that feels safe, premium, and respectful.
                        </p>
                        <p>
                            On the other side, women who want to look their best at every occasion are left with only<br />
                            two choices repeat outfits or spend lakhs buying new ones.
                        </p>
                        <p>
                            We saw women with beautiful clothes and no opportunity.<br />
                            We saw women with dreams and no platform.
                        </p>
                        <p>
                            We saw a gap —<br />
                            and we knew we had to fill it.
                        </p>
                    </div>
                </section>

                {/* THE BUSINESS PERSPECTIVE Section */}
                <section className="mb-24">
                    <div className="flex items-start gap-[11px] mb-8">
                        <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                        <div className="flex flex-col pt-[8px]">
                            <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">THE BUSINESS PERSPECTIVE</span>
                            <div className="mt-[4px]">
                                <h2
                                    className="text-[40px] leading-[72px]"
                                    style={hindiStyle}
                                >
                                    जब दिल और दिमाग मिले
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90">
                        <p>India's wedding and traditional clothing market is massive.</p>
                        <p>Every year:</p>
                        <ul className="list-disc pl-8 space-y-2">
                            <li>Billions are spent on weddings</li>
                            <li>Traditional outfits are purchased for single occasions</li>
                            <li>Most of this market still runs offline and unorganised</li>
                        </ul>
                        <p>We saw a clear gap.</p>
                        <p>
                            Demand exists.<br />
                            Clothes exist.<br />
                            Women are ready.
                        </p>
                        <p>
                            What was missing was a <span style={hindiStyle}>structured, respectful, and premium</span> digital platform.
                        </p>
                        <p>That's where the idea evolved — from emotion to execution.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
