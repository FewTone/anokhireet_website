"use client";

import { useState, useRef, useEffect } from 'react';

interface ListingStatusSelectProps {
    currentStatus: string;
    onUpdate: (newStatus: string) => void;
}

export default function ListingStatusSelect({ currentStatus, onUpdate }: ListingStatusSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options = ["Paid", "Free", "Offer"];

    const [showInput, setShowInput] = useState(false);
    const [offerValue, setOfferValue] = useState("");

    // Initialize offer value from current status if it exists
    useEffect(() => {
        if (currentStatus.startsWith('Offer:')) {
            // Extract number from "Offer: ₹500" or simple number
            const match = currentStatus.match(/(\d+)/);
            setOfferValue(match ? match[0] : "");
        } else {
            setOfferValue("");
        }
    }, [currentStatus]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowInput(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (status: string) => {
        if (status === 'Offer') {
            setShowInput(true);
        } else if (status === 'Paid') {
            onUpdate('Paid: ₹99');
            setIsOpen(false);
            setShowInput(false);
        } else {
            onUpdate(status);
            setIsOpen(false);
            setShowInput(false);
        }
    };

    const handleApplyOffer = () => {
        if (offerValue.trim()) {
            onUpdate(`Offer: ₹${offerValue}`);
            setIsOpen(false);
            setShowInput(false);
        }
    };

    const getBadgeStyle = (status: string) => {
        if (status === 'Free') return 'bg-blue-50 text-blue-700 border-blue-200';
        if (status.includes('Offer')) return 'bg-purple-50 text-purple-700 border-purple-200';
        return 'bg-gray-50 text-gray-700 border-gray-200';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setShowInput(false);
                }}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors duration-200 flex items-center gap-1 ${getBadgeStyle(currentStatus)}`}
            >
                {currentStatus || 'Paid'}
                <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {!showInput ? (
                        <div className="py-1">
                            {options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-zinc-700 transition-colors flex items-center justify-between group"
                                >
                                    <span>{option}</span>
                                    {(currentStatus === option || (option === 'Offer' && currentStatus.includes('Offer')) || (option === 'Paid' && currentStatus.includes('Paid'))) && (
                                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            <label className="text-xs text-gray-400 block">Offer Price</label>
                            <div className="flex gap-2 relative">
                                <span className="absolute left-2 top-1.5 text-gray-400 text-xs">₹</span>
                                <input
                                    type="number"
                                    value={offerValue}
                                    onChange={(e) => setOfferValue(e.target.value)}
                                    placeholder="Price"
                                    className="w-full bg-zinc-700 text-white text-xs pl-5 pr-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-blue-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleApplyOffer();
                                    }}
                                />
                                <button
                                    onClick={handleApplyOffer}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                            <button
                                onClick={() => setShowInput(false)}
                                className="text-xs text-gray-500 hover:text-gray-300 w-full text-center mt-1"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
