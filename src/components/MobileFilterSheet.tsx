import { useState, useRef } from "react";
import Image from "next/image";

interface MobileFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filterSections: { id: string; title: string; isOpen: boolean }[];
    toggleFilterSection: (id: string) => void;
    // Filter Data
    productTypes: Array<{ id: string; name: string; image_url?: string | null }>;
    occasions: Array<{ id: string; name: string }>;
    colors: Array<{ id: string; name: string; hex?: string }>;
    materials: Array<{ id: string; name: string }>;
    cities: Array<{ id: string; name: string }>;
    maxPrice: number;
    // Pending State
    pendingProductTypes: string[];
    pendingOccasions: string[];
    pendingColors: string[];
    pendingMaterials: string[];
    pendingCities: string[];
    pendingPriceRange: [number, number];
    sortBy: string;
    // Handlers
    toggleFilter: (type: 'productType' | 'occasion' | 'color' | 'material' | 'city', id: string) => void;
    setPendingPriceRange: (range: [number, number]) => void;
    setSortBy: (sort: string) => void;
    onApply: () => void;
    onClear: () => void;
    appliedCount: number;
}

export default function MobileFilterSheet({
    isOpen,
    onClose,
    filterSections,
    toggleFilterSection,
    productTypes,
    occasions,
    colors,
    materials,
    cities,
    maxPrice,
    pendingProductTypes,
    pendingOccasions,
    pendingColors,
    pendingMaterials,
    pendingCities,
    pendingPriceRange,
    sortBy,
    toggleFilter,
    setPendingPriceRange,
    setSortBy,
    onApply,
    onClear,
    appliedCount
}: MobileFilterSheetProps) {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [translateY, setTranslateY] = useState(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [currentSnap, setCurrentSnap] = useState<number>(70); // Default open to 70%
    const [isDragging, setIsDragging] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Snap points in percentage
    const SNAP_POINTS = [30, 50, 70, 100];
    const MIN_SNAP = 30;

    if (!isOpen) return null;

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        // Only allow dragging if we are at the top of the scroll content
        if (contentRef.current && contentRef.current.scrollTop > 5) return;

        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientY);
        setStartTime(Date.now());
        setIsDragging(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!touchStart || !isDragging) return;

        // If we started scrolling down but content wasn't top, don't drag sheet
        if (contentRef.current && contentRef.current.scrollTop > 5) return;

        const currentTouch = e.targetTouches[0].clientY;
        const diff = currentTouch - touchStart;

        // Update translate Y based on drag
        // Positive diff = dragging down (reducing height)
        // Negative diff = dragging up (increasing height)
        setTranslateY(diff);
        setTouchEnd(currentTouch);
    };

    const onTouchEnd = () => {
        if (!touchStart || !isDragging) {
            setIsDragging(false);
            setTouchStart(null);
            setTranslateY(0);
            return;
        }

        const distance = (touchEnd || touchStart) - touchStart;
        const time = Date.now() - startTime;
        const velocity = Math.abs(distance / time);
        const screenHeight = window.innerHeight;

        // Calculate the effective new percentage after drag
        // distance > 0 means drag down (reduce height)
        // newHeightPx = currentHeightPx - distance
        const currentHeightPx = (currentSnap / 100) * screenHeight;
        const newHeightPx = currentHeightPx - distance;
        const newHeightPercent = (newHeightPx / screenHeight) * 100;

        setIsDragging(false);
        setTouchStart(null);
        setTouchEnd(null);
        setTranslateY(0);

        // Velocity check for quick swipes
        if (velocity > 0.3) {
            if (distance > 0) {
                // Swiped Down
                // Find next lower snap point
                const lowerSnaps = SNAP_POINTS.filter(p => p < currentSnap).sort((a, b) => b - a);
                if (lowerSnaps.length > 0) {
                    setCurrentSnap(lowerSnaps[0]);
                } else {
                    onClose(); // Close if no lower snap (below 30%)
                }
            } else {
                // Swiped Up
                // Find next higher snap point
                const higherSnaps = SNAP_POINTS.filter(p => p > currentSnap).sort((a, b) => a - b);
                if (higherSnaps.length > 0) {
                    setCurrentSnap(higherSnaps[0]);
                }
            }
            return;
        }

        // Standard snap to closest logic
        if (newHeightPercent < (MIN_SNAP - 10)) {
            onClose();
            return;
        }

        // Find closest snap point
        const closest = SNAP_POINTS.reduce((prev, curr) => {
            return (Math.abs(curr - newHeightPercent) < Math.abs(prev - newHeightPercent) ? curr : prev);
        });

        setCurrentSnap(closest);
    };

    return (
        <div className="fixed inset-0 z-[2000] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className="absolute inset-x-0 bottom-0 bg-white rounded-none flex flex-col overflow-hidden animate-slide-up shadow-2xl"
                style={{
                    height: `${currentSnap}%`,
                    transform: isDragging ? `translateY(${translateY}px)` : 'translateY(0)',
                    transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    borderRadius: '0'
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Drag Handle */}
                <div
                    className="w-full flex justify-center pt-3 pb-2 bg-white sticky top-0 z-10 cursor-grab active:cursor-grabbing"
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-none"></div>
                </div>

                {/* Content */}
                <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto px-4 pb-32"
                >
                    {/* Reuse the logic from the sidebar but styled for mobile */}

                    {/* SORT */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("sort")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900 text-[11px] tracking-[0.2em]">SORT</span>
                            <span className="text-xl text-gray-400 font-light">
                                {filterSections.find(s => s.id === "sort")?.isOpen ? "−" : "+"}
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "sort")?.isOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="mt-4 space-y-3 pl-1">
                                    {[
                                        { value: "newest", label: "Newest First" },
                                        { value: "oldest", label: "Oldest First" },
                                        { value: "price_low", label: "Price: Low to High" },
                                        { value: "price_high", label: "Price: High to Low" },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="mobile_sort"
                                                value={option.value}
                                                checked={sortBy === option.value}
                                                onChange={() => setSortBy(option.value)}
                                                className="w-4 h-4 border-gray-300 text-black focus:ring-black"
                                            />
                                            <span className={`text-[13px] tracking-wider ${sortBy === option.value ? "text-black font-medium" : "text-gray-600"}`}>
                                                {option.label.toUpperCase()}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CATEGORY */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("product_type")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900 text-[11px] tracking-[0.2em]">CATEGORY</span>
                            <span className="text-xl text-gray-400 font-light">
                                {filterSections.find(s => s.id === "product_type")?.isOpen ? "−" : "+"}
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "product_type")?.isOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="mt-4 space-y-3 pl-1 max-h-60 overflow-y-auto">
                                    {productTypes.map(type => (
                                        <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={pendingProductTypes.includes(type.id)}
                                                onChange={() => toggleFilter('productType', type.id)}
                                                className="w-4 h-4 border-gray-300 rounded-none text-black focus:ring-black"
                                            />
                                            <span className="text-[13px] text-gray-600 uppercase tracking-widest">{type.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OCCASION */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("occasion")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900 text-[11px] tracking-[0.2em]">OCCASION</span>
                            <span className="text-xl text-gray-400 font-light">
                                {filterSections.find(s => s.id === "occasion")?.isOpen ? "−" : "+"}
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "occasion")?.isOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="mt-4 space-y-3 pl-1 max-h-60 overflow-y-auto">
                                    {occasions.map(item => (
                                        <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={pendingOccasions.includes(item.id)}
                                                onChange={() => toggleFilter('occasion', item.id)}
                                                className="w-4 h-4 border-gray-300 rounded-none text-black focus:ring-black"
                                            />
                                            <span className="text-[13px] text-gray-600 uppercase tracking-widest">{item.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLOR */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("color")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900 text-[11px] tracking-[0.2em]">COLOR</span>
                            <span className="text-xl text-gray-400 font-light">
                                {filterSections.find(s => s.id === "color")?.isOpen ? "−" : "+"}
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "color")?.isOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="mt-4 space-y-3 pl-1 max-h-60 overflow-y-auto">
                                    {colors.map(item => (
                                        <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={pendingColors.includes(item.id)}
                                                onChange={() => toggleFilter('color', item.id)}
                                                className="w-4 h-4 border-gray-300 rounded-none text-black focus:ring-black"
                                            />
                                            {item.hex && (
                                                <div className="w-4 h-4 border border-gray-300" style={{ backgroundColor: item.hex }} />
                                            )}
                                            <span className="text-[13px] text-gray-600 uppercase tracking-widest">{item.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MATERIAL */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("material")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900 text-[11px] tracking-[0.2em]">MATERIAL</span>
                            <span className="text-xl text-gray-400 font-light">
                                {filterSections.find(s => s.id === "material")?.isOpen ? "−" : "+"}
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "material")?.isOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="mt-4 space-y-3 pl-1 max-h-60 overflow-y-auto">
                                    {materials.map(item => (
                                        <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={pendingMaterials.includes(item.id)}
                                                onChange={() => toggleFilter('material', item.id)}
                                                className="w-4 h-4 border-gray-300 rounded-none text-black focus:ring-black"
                                            />
                                            <span className="text-[13px] text-gray-600 uppercase tracking-widest">{item.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AVAILABLE CITY */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("city")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900 text-[11px] tracking-[0.2em]">AVAILABLE CITY</span>
                            <span className="text-xl text-gray-400 font-light">
                                {filterSections.find(s => s.id === "city")?.isOpen ? "−" : "+"}
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "city")?.isOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="mt-4 space-y-3 pl-1 max-h-60 overflow-y-auto">
                                    {cities.map(item => (
                                        <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={pendingCities.includes(item.id)}
                                                onChange={() => toggleFilter('city', item.id)}
                                                className="w-4 h-4 border-gray-300 rounded-none text-black focus:ring-black"
                                            />
                                            <span className="text-[13px] text-gray-600 uppercase tracking-widest">{item.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRICE */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("price")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900 text-[11px] tracking-[0.2em]">PRICE</span>
                            <span className="text-xl text-gray-400 font-light">
                                {filterSections.find(s => s.id === "price")?.isOpen ? "−" : "+"}
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${filterSections.find(s => s.id === "price")?.isOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="mt-8 px-2 pb-4">
                                    <div className="relative h-[2px] bg-gray-200">
                                        <div
                                            className="absolute h-full bg-black"
                                            style={{
                                                left: `${(pendingPriceRange[0] / maxPrice) * 100}%`,
                                                width: `${((pendingPriceRange[1] - pendingPriceRange[0]) / maxPrice) * 100}%`
                                            }}
                                        />
                                        {/* Thumb knobs would go here, simplified with native sliders for better touch */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={maxPrice}
                                            value={pendingPriceRange[0]}
                                            onChange={(e) => {
                                                const val = Math.min(Number(e.target.value), pendingPriceRange[1]);
                                                setPendingPriceRange([val, pendingPriceRange[1]]);
                                            }}
                                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto"
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max={maxPrice}
                                            value={pendingPriceRange[1]}
                                            onChange={(e) => {
                                                const val = Math.max(Number(e.target.value), pendingPriceRange[0]);
                                                setPendingPriceRange([pendingPriceRange[0], val]);
                                            }}
                                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto"
                                        />
                                        {/* Visual Thumbs matching desktop style */}
                                        <div
                                            className="absolute w-4 h-4 bg-black border-2 border-white rounded-full shadow-sm top-1/2 -translate-y-1/2 pointer-events-none z-10"
                                            style={{ left: `calc(${(pendingPriceRange[0] / maxPrice) * 100}% - 8px)` }}
                                        />
                                        <div
                                            className="absolute w-4 h-4 bg-black border-2 border-white rounded-full shadow-sm top-1/2 -translate-y-1/2 pointer-events-none z-10"
                                            style={{ left: `calc(${(pendingPriceRange[1] / maxPrice) * 100}% - 8px)` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-4 text-sm font-medium">
                                        <span>₹{pendingPriceRange[0]}</span>
                                        <span>₹{pendingPriceRange[1]}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="border-t border-gray-100 bg-white p-4 absolute bottom-0 left-0 right-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)' }}>
                    <div className="flex gap-3">
                        <button
                            onClick={onClear}
                            className="flex-1 py-3 border border-black text-black font-semibold text-sm uppercase tracking-wider rounded-none"
                        >
                            CLEAR
                        </button>
                        <button
                            onClick={onApply}
                            className="flex-1 py-3 bg-black text-white font-semibold text-sm uppercase tracking-wider rounded-none"
                        >
                            APPLY ({appliedCount})
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .safe-area-pb {
                    padding-bottom: env(safe-area-inset-bottom, 20px);
                }
            `}</style>
        </div>
    );
}
