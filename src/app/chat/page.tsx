"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ChatPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white pt-20 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-8">Chat</h1>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="text-center py-12">
                            <svg
                                width="64"
                                height="64"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-gray-300 mx-auto mb-4"
                            >
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            <p className="text-gray-500 text-lg mb-2">No messages yet</p>
                            <p className="text-gray-400 text-sm">Start a conversation with our support team!</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

