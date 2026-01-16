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
        if (typeof priceVal === 'number') return `₹${priceVal}`;
        return priceVal.startsWith('₹') ? priceVal : `₹${priceVal.replace(/[₹,]/g, '')}`;
    };

    return (
        <div className="bg-white space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1">{title}</h2>
                <p className="text-sm text-gray-500 mb-4">Product ID: {productId}</p>

                {/* Pricing Information */}
                <div className="mb-6 space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-normal text-gray-900 uppercase tracking-wide">RENT</span>
                        <span className="text-xl font-bold text-gray-900">
                            {formatPrice(price)}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-normal text-gray-900 uppercase tracking-wide">MRP</span>
                        <span className="text-xl font-normal text-gray-900">
                            {originalPrice ? formatPrice(originalPrice) : ''}
                        </span>
                    </div>
                </div>


            </div>

            {isOwner ? (
                <div className="mt-4">
                    <button
                        disabled
                        className="w-full bg-gray-100 text-gray-500 font-semibold py-4 px-6 cursor-not-allowed border border-gray-200"
                    >
                        Your Product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                        onClick={onMakeInquiry}
                        className="bg-white text-black border border-black font-semibold py-4 px-6 hover:bg-gray-50 transition-all text-center text-sm md:text-base"
                    >
                        Send Msg
                    </button>
                    <button
                        onClick={onMakeInquiry}
                        className="bg-black text-white font-semibold py-4 px-6 hover:opacity-90 transition-opacity text-center text-sm md:text-base"
                    >
                        Make Inquiry
                    </button>
                </div>
            )}
        </div>
    );
}
