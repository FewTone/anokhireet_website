"use client";

import { useState } from "react";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, details: string) => void;
    userName: string;
}

const REASONS = [
    "Spam or misleading",
    "Harassment or bullying",
    "Inappropriate content",
    "Nudity or sexual activity",
    "Hate speech",
    "Something else"
];

export default function ReportModal({ isOpen, onClose, onSubmit, userName }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedReason) return;
        setSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        onSubmit(selectedReason, details);
        setSubmitting(false);
        setSelectedReason("");
        setDetails("");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white border border-black rounded-none overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4 border-b border-black pb-4">
                        <h2 className="text-xl font-medium text-black uppercase tracking-tight">Report {userName}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
                        Why are you reporting this user? Your report is anonymous, except if you're reporting an intellectual property infringement.
                    </p>

                    <div className="space-y-2 mb-6">
                        {REASONS.map((reason) => (
                            <label
                                key={reason}
                                className={`flex items-center gap-3 p-3 border cursor-pointer transition-all rounded-none ${selectedReason === reason
                                    ? "border-black bg-gray-50"
                                    : "bg-white border-gray-100 text-black hover:border-black"
                                    }`}
                            >
                                <div className={`w-4 h-4 border border-black flex items-center justify-center rounded-full shrink-0`}>
                                    {selectedReason === reason && <div className="w-2 h-2 bg-black rounded-full"></div>}
                                </div>
                                <input
                                    type="radio"
                                    name="report-reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="hidden"
                                />
                                <span className="text-[13px] font-normal uppercase tracking-wide">{reason}</span>
                            </label>
                        ))}
                    </div>

                    {selectedReason === "Something else" && (
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-black uppercase mb-2 tracking-wider">
                                Additional details
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full p-3 border border-black rounded-none text-sm focus:bg-gray-50 outline-none min-h-[100px] resize-none"
                                placeholder="PLEASE PROVIDE MORE INFORMATION..."
                            ></textarea>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-xs font-medium uppercase tracking-widest text-black bg-white border border-black hover:bg-gray-100 transition-colors rounded-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedReason || submitting}
                            className="flex-1 px-4 py-3 text-xs font-medium uppercase tracking-widest text-white bg-black border border-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none"
                        >
                            {submitting ? "SUBMITTING..." : "SUBMIT REPORT"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
