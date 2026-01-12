import { useState } from "react";
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="absolute inset-x-0 bottom-0 h-[50vh] bg-white rounded-t-2xl flex flex-col overflow-hidden animate-slide-up">
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-2 bg-white sticky top-0 z-10">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-20">
                    {/* Reuse the logic from the sidebar but styled for mobile */}

                    {/* SORT */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("sort")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900">SORT</span>
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
                                            <span className={`text-sm ${sortBy === option.value ? "text-black font-medium" : "text-gray-600"}`}>
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRODUCT TYPE */}
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            onClick={() => toggleFilterSection("product_type")}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-medium text-sm text-gray-900">PRODUCT TYPE</span>
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
                                <div className="mt-0 space-y-0 pl-0 max-h-[60vh] overflow-y-auto">
                                    {productTypes.map(type => (
                                        <label key={type.id} className="flex items-center w-full bg-white border-b border-gray-200 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={pendingProductTypes.includes(type.id)}
                                                onChange={() => toggleFilter('productType', type.id)}
                                                className="hidden" // Hide default checkbox
                                            />
                                            <div className={`flex items-center w-full gap-4 px-4 py-3 transition-colors ${pendingProductTypes.includes(type.id) ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                                                <div className="w-[72px] h-[96px] bg-gray-100 flex-shrink-0 relative overflow-hidden">
                                                    {type.image_url ? (
                                                        <Image
                                                            src={type.image_url}
                                                            alt={type.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="72px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                            {/* Simple Icon Placeholder */}
                                                            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {/* Selected Indicator - Subtle Overlay */}
                                                    {pendingProductTypes.includes(type.id) && (
                                                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                                            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center shadow-sm">
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[13px] font-bold uppercase tracking-widest flex-1 ${pendingProductTypes.includes(type.id) ? 'text-black' : 'text-gray-900'}`}>
                                                    {type.name}
                                                </span>
                                            </div>
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
                            <span className="font-medium text-sm text-gray-900">OCCASION</span>
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
                                                className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black"
                                            />
                                            <span className="text-sm text-gray-600">{item.name}</span>
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
                            <span className="font-medium text-sm text-gray-900">COLOR</span>
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
                                                className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black"
                                            />
                                            {item.hex && (
                                                <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: item.hex }} />
                                            )}
                                            <span className="text-sm text-gray-600">{item.name}</span>
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
                            <span className="font-medium text-sm text-gray-900">MATERIAL</span>
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
                                                className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black"
                                            />
                                            <span className="text-sm text-gray-600">{item.name}</span>
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
                            <span className="font-medium text-sm text-gray-900">AVAILABLE CITY</span>
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
                                                className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black"
                                            />
                                            <span className="text-sm text-gray-600">{item.name}</span>
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
                            <span className="font-medium text-sm text-gray-900">PRICE</span>
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
                                    <div className="relative h-[2px] bg-gray-200 rounded">
                                        <div
                                            className="absolute h-full bg-black rounded"
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
                <div className="border-t border-gray-100 bg-white p-4 absolute bottom-0 left-0 right-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 40px)' }}>
                    <div className="flex gap-3">
                        <button
                            onClick={onClear}
                            className="flex-1 py-3 border border-black text-black font-semibold text-sm uppercase tracking-wider"
                        >
                            CLEAR
                        </button>
                        <button
                            onClick={onApply}
                            className="flex-1 py-3 bg-black text-white font-semibold text-sm uppercase tracking-wider"
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
