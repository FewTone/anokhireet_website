"use client";

import { useEffect } from "react";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: "error" | "success" | "info" | "warning";
    autoClose?: boolean; // Auto-close after delay
    autoCloseDelay?: number; // Delay in milliseconds (default: 3000ms)
}

export default function Popup({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
    autoClose = true, // Default to auto-close for minimal UX
    autoCloseDelay = 3000 // 3 seconds default
}: PopupProps) {
    // Auto-close functionality
    useEffect(() => {
        if (isOpen && autoClose && type !== "error") {
            // Don't auto-close errors, user should acknowledge them
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, autoCloseDelay, type, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && (e.key === "Escape" || e.key === "Enter")) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const typeStyles = {
        error: {
            icon: (
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            textColor: "text-red-800",
            iconColor: "text-red-600",
            buttonColor: "bg-red-600 hover:bg-red-700",
        },
        success: {
            icon: (
                <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
            borderColor: "border-green-300",
            textColor: "text-green-800",
            iconColor: "text-green-600",
            buttonColor: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
        },
        warning: {
            icon: (
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            ),
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200",
            textColor: "text-yellow-800",
            iconColor: "text-yellow-600",
            buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        },
        info: {
            icon: (
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-800",
            iconColor: "text-blue-600",
            buttonColor: "bg-blue-600 hover:bg-blue-700",
        },
    };

    const styles = typeStyles[type];

    // Format message to support newlines
    const formattedMessage = message.split("\n").map((line, index) => (
        <span key={index}>
            {line}
            {index < message.split("\n").length - 1 && <br />}
        </span>
    ));

    // Minimal toast-style popup
    return (
        <div className="fixed top-4 right-4 z-[3000] animate-slideInRight">
            {/* Minimal Popup - Toast Style */}
            <div className={`bg-white rounded-none shadow-lg border-l-4 ${type === "success" ? "border-green-500" : type === "error" ? "border-red-500" : type === "warning" ? "border-yellow-500" : "border-blue-500"} min-w-[300px] max-w-[400px] flex items-start gap-3 p-4 relative`}>
                {/* Icon */}
                <div className={`${styles.iconColor} flex-shrink-0 mt-0.5`}>
                    {type === "success" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <div className="w-5 h-5">
                            {styles.icon}
                        </div>
                    )}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm ${type === "success" ? "text-gray-700" : type === "error" ? "text-red-700" : type === "warning" ? "text-yellow-700" : "text-blue-700"} leading-relaxed`}>
                        {formattedMessage}
                    </p>
                </div>

                {/* Close Button - Only show if not auto-closing or if it's an error */}
                {(type === "error" || !autoClose) && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2 p-1 rounded-none hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

