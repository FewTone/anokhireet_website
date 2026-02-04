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
                <img src="/images/Vector.png" alt="" className="h-[100vmin] w-[100vmin] object-contain opacity-80 mix-blend-overlay" />
            </div>

            {/* Intentionally blank as requested */}
        </div>
    );
}
