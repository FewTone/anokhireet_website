import React from 'react';
import localFont from 'next/font/local';

const arya = localFont({
    src: '../../../public/fonts/Arya-Regular.ttf',
    variable: '--font-arya',
});

const gradientStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(90deg, #F8B97A 0%, #E0B073 25%, #B98A3F 38%, #EBB97A 56%, #BB897A 80%, #80533A 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline',
    fontWeight: 600
};

const hindiStyle: React.CSSProperties = {
    ...gradientStyle,
    fontFamily: 'var(--font-arya), serif',
    fontWeight: 400
};

export default function AboutPage() {
    return (
        <div
            className={`h-[5769px] w-full relative overflow-hidden ${arya.variable} font-sans`}
            style={{
                background: `radial-gradient(circle 1000px at 50% 50vmin, #890304 0%, transparent 60%), 
                             linear-gradient(180deg, #2E0000 0%, #1A0000 100%)`
            }}
        >
            {/* Vector Image Overlay */}
            <div className="absolute top-0 left-0 w-full pointer-events-none flex justify-center pt-0">
                <div className="relative h-[100vmin] w-[100vmin]">
                    <div
                        className="absolute inset-0 h-full w-full opacity-50"
                        style={{
                            backgroundColor: '#750000',
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
            <div className="relative z-30 pt-[110vmin] max-w-[1440px] mx-auto px-[100px] text-[#FFDCB5]">
                {/* The Origin Section */}
                <section className="mb-[120px]">
                    <div className="max-w-[867px]">
                        <div className="flex items-start gap-[11px] mb-8">
                            <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                            <div className="flex flex-col pt-[8px]">
                                <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">THE ORIGIN</span>
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
                                that they could help another woman feel confident, beautiful, and make her own
                                <span style={hindiStyle}> ख़ास मौका</span> even more memorable.
                            </p>
                        </div>
                    </div>
                </section>

                {/* The Thought Section */}
                <section className="mb-[120px] flex justify-end">
                    <div className="max-w-[867px] w-full pl-[60px]">
                        <div className="flex items-start gap-[11px] mb-8">
                            <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                            <div className="flex flex-col pt-[8px]">
                                <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">THE THOUGHT</span>
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
                    </div>
                </section>

                {/* THE BUSINESS PERSPECTIVE Section */}
                <section className="mb-[120px]">
                    <div className="max-w-[867px]">
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
                            <div className="flex flex-col">
                                <p>Every year:</p>
                                <ul className="list-disc pl-8">
                                    <li>Billions are spent on weddings</li>
                                    <li>Traditional outfits are purchased for single occasions</li>
                                    <li>Most of this market still runs offline and unorganised</li>
                                </ul>
                            </div>
                            <p>We saw a clear gap.</p>
                            <p>
                                Demand exists.<br />
                                Supply exists.<br />
                                Women are ready.
                            </p>
                            <p>
                                What was missing was a <span style={gradientStyle}>structured, respectful, and premium</span> digital platform.
                            </p>
                            <p>That's where the idea evolved — from emotion to execution.</p>
                        </div>
                    </div>
                </section>
                {/* THE SOLUTION Section */}
                <section className="mb-[120px] flex justify-end">
                    <div className="max-w-[900px] w-full">
                        <div className="flex items-start gap-[11px] mb-8">
                            <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                            <div className="flex flex-col pt-[8px]">
                                <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">THE SOLUTION</span>
                                <div className="mt-[4px]">
                                    <h2
                                        className="text-[40px] leading-[72px]"
                                        style={hindiStyle}
                                    >
                                        जब सोच ने आकर रूप लिया
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90">
                            <p>
                                <span style={gradientStyle}>Anokhi Reet was created as a space where tradition meets intention.</span>
                            </p>
                            <div className="flex flex-col">
                                <p>A place where:</p>
                                <ul className="list-disc pl-8">
                                    <li>Women can list their traditional outfits with pride</li>
                                    <li>Renters can discover meaningful pieces, not mass-produced fashion</li>
                                    <li>Every interaction feels personal, respectful, and real</li>
                                </ul>
                            </div>
                            <p>
                                Anokhi Reet doesn't just connect people.<br />
                                It creates a shared understanding —<br />
                                that what already exists in our homes can create value, confidence, and opportunity for someone else.
                            </p>
                            <p>
                                This feels richer, calmer, and premium.
                            </p>
                        </div>
                    </div>
                </section>
                {/* WOMEN EMPOWERMENT Section */}
                <section className="mb-[120px]">
                    <div className="max-w-[867px]">
                        <div className="flex items-start gap-[11px] mb-8">
                            <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                            <div className="flex flex-col pt-[8px]">
                                <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">WOMEN EMPOWERMENT</span>
                                <div className="mt-[4px]">
                                    <h2
                                        className="text-[40px] leading-[72px]"
                                        style={hindiStyle}
                                    >
                                        सिर्फ कपड़ों से कहि ज़्यादा
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90">
                            <p>This is not just about renting clothes.</p>
                            <div className="flex flex-col">
                                <p>It's about:</p>
                                <ul className="list-disc pl-8">
                                    <li>Creating income from your own belongings</li>
                                    <li>Starting small, from home</li>
                                    <li>Turning unused wardrobes into opportunities</li>
                                </ul>
                            </div>
                            <p>
                                For some, Anokhi Reet becomes side income.<br />
                                For others, it becomes a full-time journey.
                            </p>
                            <p>
                                Every listing carries a story.<br />
                                Every story belongs to a woman who chose to take a step forward - <span style={hindiStyle}>अपने दम पर</span>
                            </p>
                        </div>
                    </div>
                </section>
                {/* OUR JOURNEY FORWARD Section */}
                <section className="mb-[120px] flex justify-end">
                    <div className="max-w-[867px] w-full">
                        <div className="flex items-start gap-[11px] mb-8">
                            <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                            <div className="flex flex-col pt-[8px]">
                                <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">OUR JOURNEY FORWARD</span>
                                <div className="mt-[4px]">
                                    <h2
                                        className="text-[40px] leading-[72px]"
                                        style={hindiStyle}
                                    >
                                        आगे का सफर
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90">
                            <p>
                                <span style={gradientStyle}>Anokhi Reet</span> begins its journey in Gujarat,<br /> with a vision to reach women across India.
                            </p>
                            <p>Our goal is not to become just another marketplace.</p>
                            <div className="flex flex-col">
                                <p>We want Anokhi Reet to be:</p>
                                <ul className="list-disc pl-8">
                                    <li>A trusted discovery platform</li>
                                    <li>A celebration of Indian traditions</li>
                                    <li>A space where <span style={hindiStyle}>परंपरा</span> meets progress</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* OUR BELIEF Section */}
                <section className="mb-[120px]">
                    <div className="max-w-[867px]">
                        <div className="flex items-start gap-[11px] mb-8">
                            <img src="/images/seal.png" alt="Seal" className="w-[100px] h-[100px] object-contain flex-shrink-0" />
                            <div className="flex flex-col pt-[8px]">
                                <span className="text-[20px] font-normal tracking-[0.2em] uppercase text-[#E2BB90] h-[24px] leading-none">OUR BELIEF</span>
                                <div className="mt-[4px]">
                                    <h2
                                        className="text-[40px] leading-[72px]"
                                        style={hindiStyle}
                                    >
                                        दिल से जुड़ी एक अनोखी रीत
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-[18px] text-[20px] leading-[32px] font-normal opacity-90">
                            <p>This is not just the story of a platform.</p>
                            <p>
                                It is the story of women who believe that their clothes carry meaning,<br />
                                that their choices can create impact,<br />
                                and that their journey deserves to be seen — not hidden away.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final Closing Section */}
                <section className="flex items-center gap-[39px] pb-[40px] pt-0">
                    <div className="w-[420px] flex-shrink-0">
                        <img src="/images/Group 38.png" alt="Envelope" className="w-full object-contain" />
                    </div>
                    <div
                        className="text-[40px] leading-[60px] font-normal"
                        style={{ fontFamily: 'var(--font-arya), serif', color: '#D30000' }}
                    >
                        अगर आप भी<br />
                        किसी और की कहानी का हिस्सा बनना चाहती हे<br />
                        तो आप पहेले से ही <span style={hindiStyle}>अनोखी रीत</span> का हिस्सा हे
                    </div>
                </section>
            </div>
        </div>
    );
}
