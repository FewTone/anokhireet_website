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
    const [error, setError] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedReason) {
            setError(true);
            return;
        }
        setSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        onSubmit(selectedReason, details);
        setSubmitting(false);
        setSelectedReason("");
        setDetails("");
        setError(false);
    };

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
                        <h2 className="text-xl font-medium text-gray-900 uppercase tracking-tight">Report {userName}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 hover:text-gray-900 text-gray-400 transition-colors rounded-full"
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
                                className={`flex items-center gap-3 p-3 border cursor-pointer transition-all rounded-md ${selectedReason === reason
                                    ? "border-gray-900 bg-gray-50"
                                    : "bg-white border-gray-200 text-gray-900 hover:border-gray-400"
                                    }`}
                            >
                                <div className={`w-4 h-4 border border-gray-400 flex items-center justify-center rounded-full shrink-0 ${selectedReason === reason ? "border-gray-900" : ""}`}>
                                    {selectedReason === reason && <div className="w-2 h-2 bg-gray-900 rounded-full"></div>}
                                </div>
                                <input
                                    type="radio"
                                    name="report-reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={(e) => {
                                        setSelectedReason(e.target.value);
                                        setError(false);
                                    }}
                                    className="hidden"
                                />
                                <span className="text-[13px] font-normal uppercase tracking-wide">{reason}</span>
                            </label>
                        ))}
                    </div>

                    {selectedReason === "Something else" && (
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-900 uppercase mb-2 tracking-wider">
                                Additional details
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:bg-gray-50 outline-none min-h-[100px] resize-none focus:border-gray-900 transition-colors"
                                placeholder="Please provide more information..."
                            ></textarea>
                        </div>
                    )}

                    {error && (
                        <p className="text-red-600 text-[13px] mb-4 font-medium animate-in fade-in slide-in-from-top-1">
                            Please select a reason for reporting.
                        </p>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-xs font-medium uppercase tracking-widest text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`flex-1 px-4 py-3 text-xs font-medium uppercase tracking-widest text-white transition-colors rounded-lg shadow-sm ${submitting ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800"}`}
                        >
                            {submitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
