"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "info" | "warning";
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info"
}: ConfirmationModalProps) {
    const [focusedButton, setFocusedButton] = useState<"cancel" | "confirm">(type === "danger" ? "confirm" : "cancel");
    const cancelBtnRef = useRef<HTMLButtonElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFocusedButton(type === "danger" ? "confirm" : "cancel");
            document.body.style.overflow = "hidden";
            // Move focus into the modal to prevent background elements from catching Enter
            setTimeout(() => {
                if (type === "danger") {
                    confirmBtnRef.current?.focus();
                } else {
                    cancelBtnRef.current?.focus();
                }
            }, 50);
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen, type]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft") {
                setFocusedButton("cancel");
                cancelBtnRef.current?.focus();
            } else if (e.key === "ArrowRight") {
                setFocusedButton("confirm");
                confirmBtnRef.current?.focus();
            } else if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (focusedButton === "cancel") {
                    onClose();
                } else {
                    onConfirm();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, focusedButton, onClose, onConfirm]);

    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: "bg-red-600",
            hover: "hover:bg-red-700",
            text: "text-red-600",
            light: "bg-red-50",
            border: "border-red-100",
            ring: "ring-red-600"
        },
        info: {
            bg: "bg-black",
            hover: "hover:bg-gray-800",
            text: "text-black",
            light: "bg-blue-50",
            border: "border-blue-100",
            ring: "ring-black"
        },
        warning: {
            bg: "bg-amber-600",
            hover: "hover:bg-amber-700",
            text: "text-amber-600",
            light: "bg-amber-50",
            border: "border-amber-100",
            ring: "ring-amber-600"
        }
    };

    const style = colors[type];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative bg-white rounded-none border border-gray-100 max-w-md w-full shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-4 ${style.light} rounded-none border ${style.border}`}>
                                {type === "danger" ? (
                                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                ) : (
                                    <svg className={`w-6 h-6 ${type === "warning" ? "text-amber-500" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2 uppercase tracking-wide">
                                {title}
                            </h3>
                            <div className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                                {message}
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    ref={cancelBtnRef}
                                    onClick={onClose}
                                    animate={{
                                        backgroundColor: focusedButton === "cancel" ? "rgb(229, 231, 235)" : "rgb(255, 255, 255)"
                                    }}
                                    className={`flex-1 px-4 py-3 font-bold rounded-none transition-colors uppercase tracking-wider text-xs border border-gray-200 ${focusedButton === "cancel" ? "z-10" : "hover:bg-gray-50"}`}
                                >
                                    {cancelText}
                                </motion.button>
                                <motion.button
                                    ref={confirmBtnRef}
                                    onClick={onConfirm}
                                    animate={{
                                        filter: focusedButton === "confirm" ? "brightness(0.85)" : "brightness(1)"
                                    }}
                                    className={`flex-1 px-4 py-3 text-white font-bold rounded-none transition-colors uppercase tracking-wider text-xs ${style.bg} ${focusedButton === "confirm" ? "z-10" : ""}`}
                                >
                                    {confirmText}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
