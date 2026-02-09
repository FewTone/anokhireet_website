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

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (status: string) => {
        onUpdate(status);
        setIsOpen(false);
    };

    const getBadgeStyle = (status: string) => {
        switch (status) {
            case 'Free':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Offer':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            default: // Paid
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors duration-200 flex items-center gap-1 ${getBadgeStyle(currentStatus)}`}
            >
                {currentStatus || 'Paid'}
                <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-zinc-700 transition-colors flex items-center justify-between group"
                            >
                                <span>{option}</span>
                                {currentStatus === option && (
                                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
