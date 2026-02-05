import React, { useState } from 'react';

interface ProductAccordionsProps {
    product: any;
    bookedDates?: { start_date: string; end_date: string; status?: string }[];
}

export default function ProductAccordions({ product, bookedDates = [] }: ProductAccordionsProps) {
    const [expandedSections, setExpandedSections] = useState({
        availability: false,
        details: false,
        occasion: false
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="max-w-2xl">
            {/* Availability Section */}
            <div className="border-b border-gray-100">
                <button
                    onClick={() => toggleSection('availability')}
                    className="w-full flex items-center justify-between py-4 text-left group"
                >
                    <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Availability</span>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.availability ? 'rotate-180' : ''}`}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
                <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedSections.availability
                        ? 'grid-rows-[1fr] opacity-100 mb-4'
                        : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="overflow-hidden space-y-4">
                        {product.cities && product.cities.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Location</span>
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                    {product.cities.map((city: any, i: number) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {city.name || city}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {bookedDates && bookedDates.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Booked Dates</span>
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                    {bookedDates.map((booking, i) => {
                                        const start = new Date(booking.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                                        const end = new Date(booking.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                                        return (
                                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {start} - {end}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(!product.cities || product.cities.length === 0) && (!bookedDates || bookedDates.length === 0) && (
                            <p className="text-sm text-gray-500 italic">Availability information not specified</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Details Section */}
            <div className="border-b border-gray-100">
                <button
                    onClick={() => toggleSection('details')}
                    className="w-full flex items-center justify-between py-4 text-left group"
                >
                    <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Product Details</span>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.details ? 'rotate-180' : ''}`}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
                <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedSections.details
                        ? 'grid-rows-[1fr] opacity-100 mb-4'
                        : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="overflow-hidden">
                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                            <p>{product.description || "No description available."}</p>

                            {/* Additional details */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {product.brands && product.brands.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-900 block mb-1">Brand</span>
                                        <p>{product.brands[0]}</p>
                                    </div>
                                )}
                                {product.colors && product.colors.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-900 block mb-2">Color</span>
                                        <div className="flex flex-wrap gap-2">
                                            {product.colors.map((c: any, i: number) => {
                                                const colorValue = c.hex || (typeof c === 'string' ? c : c.name);
                                                const colorName = c.name || (typeof c === 'string' ? c : 'Color');
                                                return (
                                                    <div
                                                        key={i}
                                                        title={colorName}
                                                        className="w-5 h-5 rounded-none border border-gray-200 shadow-sm relative group"
                                                        style={{ backgroundColor: colorValue || '#000' }}
                                                    >
                                                        <span className="sr-only">{colorName}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {product.materials && product.materials.length > 0 && (
                                    <div className="col-span-2">
                                        <span className="font-medium text-gray-900 block mb-1">Material</span>
                                        <p>{product.materials.join(", ")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Occasion Section */}
            <div className="border-b border-gray-100">
                <button
                    onClick={() => toggleSection('occasion')}
                    className="w-full flex items-center justify-between py-4 text-left group"
                >
                    <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Occasion</span>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-gray-400 group-hover:text-gray-900 transition-transform duration-300 ${expandedSections.occasion ? 'rotate-180' : ''}`}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
                <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedSections.occasion
                        ? 'grid-rows-[1fr] opacity-100 mb-4'
                        : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="overflow-hidden">
                        {product.occasions && product.occasions.length > 0 ? (
                            <div className="text-sm text-gray-600">
                                <p>{product.occasions.join(", ")}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No occasion specified</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
