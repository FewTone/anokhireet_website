"use client";

export default function ReferEarnView() {
    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6">Refer & Earn</h2>

            <div className="bg-white border border-gray-200 p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">Invite Friends & Earn Rewards</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8 text-sm">
                    Share your unique referral link with friends. They get 10% off their first order, and you earn points for every successful referral!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-0 max-w-lg mx-auto border border-black">
                    <div className="w-full bg-white px-4 py-3 text-gray-900 font-mono text-sm truncate border-r border-black sm:border-b-0 border-b">
                        anokhireet.com/ref/USER123
                    </div>
                    <button className="w-full sm:w-auto px-8 py-3 bg-black text-white text-sm font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors whitespace-nowrap">
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    );
}
