"use client";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export default function SuccessModal({ isOpen, onClose, title, message }: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white border border-gray-200 rounded-none shadow-xl overflow-hidden p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>

                <h2 className="text-lg font-medium text-gray-900 uppercase tracking-tight mb-2">{title}</h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>

                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 text-xs font-medium uppercase tracking-widest text-white bg-gray-900 hover:bg-gray-800 transition-colors rounded-none shadow-sm"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
