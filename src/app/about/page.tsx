import React from 'react';

export default function AboutPage() {
    return (
        <div
            className="h-[5769px] w-full relative overflow-hidden"
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

            {/* Intentionally blank as requested */}
        </div>
    );
}
