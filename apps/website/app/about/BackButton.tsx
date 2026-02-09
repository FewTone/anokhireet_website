'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const BackButton = () => {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 md:top-10 md:left-10 z-50 p-2 rounded-full bg-black/20 backdrop-blur-sm"
            aria-label="Go back"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 md:w-8 md:h-8 text-[#FFDCB5]"
            >
                <path d="m15 18-6-6 6-6" />
            </svg>
        </button>
    );
};

export default BackButton;
