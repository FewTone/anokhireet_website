import React from 'react';

interface ProductInfoProps {
    title: string;
    productId: string | number;
    price: string;
    originalPrice?: string | number;
    ownerId?: string;
    currentUserId?: string;
    onMakeInquiry: () => void;
}

export default function ProductInfo({
    title,
    productId,
    price,
    originalPrice,
    ownerId,
    currentUserId,
    onMakeInquiry
}: ProductInfoProps) {
    const isOwner = currentUserId && ownerId && currentUserId === ownerId;

    const formatPrice = (priceVal: string | number | undefined) => {
        if (!priceVal) return '';
        const val = priceVal.toString().replace(/[^0-9.]/g, '');
        const number = parseFloat(val);
        return isNaN(number) ? val : `₹${number.toLocaleString('en-IN')}`;
    };

    return (
        <div className="bg-white space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-1 uppercase tracking-wide">{title}</h2>
                <p className="text-sm text-gray-500 mb-4">Product ID: {productId}</p>

                {/* Pricing Information */}
                <div className="mb-6 space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-md font-semibold text-gray-900 uppercase tracking-wider">RENT</span>
                        <span className="text-md font-semibold text-gray-900">
                            {formatPrice(price)}
                        </span>
                    </div>
                    {originalPrice && (
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-normal text-gray-900 uppercase tracking-wider">MRP</span>
                            <span className="text-sm font-normal text-gray-900">
                                {formatPrice(originalPrice)}
                            </span>
                        </div>
                    )}
                </div>


            </div>

            {isOwner ? (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1001] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none md:static md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-none md:z-auto md:mt-4">
                    <button
                        disabled
                        className="w-full bg-gray-100 text-gray-500 font-semibold py-4 px-6 cursor-not-allowed border-b border-gray-200 md:border md:rounded-none"
                    >
                        Your Product
                    </button>
                </div>
            ) : (
                <>
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1001] grid grid-cols-2 gap-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none md:static md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-none md:z-auto md:mt-4 md:gap-3">
                        <button
                            onClick={onMakeInquiry}
                            className="bg-white text-black border-r border-gray-200 font-semibold py-4 px-4 md:py-4 md:px-6 hover:bg-gray-50 transition-all text-center text-sm md:text-base rounded-none md:border md:border-black"
                        >
                            Send Message
                        </button>
                        <button
                            onClick={onMakeInquiry}
                            className="bg-black text-white font-semibold py-4 px-4 md:py-4 md:px-6 hover:opacity-90 transition-opacity text-center text-sm md:text-base rounded-none"
                        >
                            Make An Inquiry
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
