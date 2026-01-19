"use client";

import { useRouter } from "next/navigation";

interface MobileHeaderProps {
    title: string;
    backLink?: string;
    onBack?: () => void;
    showBack?: boolean;
}

export default function MobileHeader({ title, backLink, onBack, showBack = true }: MobileHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backLink) {
            router.push(backLink, { scroll: false });
        } else {
            router.back();
        }
    };

    return (
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-20">
            {showBack && (
                <button
                    onClick={handleBack}
                    className="p-1 -ml-2 text-gray-600"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
            )}
            <h1 className="text-lg font-semibold uppercase">{title.replace("-", " ")}</h1>
        </div>
    );
}
