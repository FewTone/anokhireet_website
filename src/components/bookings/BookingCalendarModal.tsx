import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface BookingCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    dateRange: [Date | null, Date | null];
    onChange: (update: [Date | null, Date | null]) => void;
    existingBookedDates: Date[];
    onConfirm: () => void;
    readOnly?: boolean;
    productDetails?: {
        title: string;
        image: string;
        price: number;
        customId?: string;
    };
}

export const BookingCalendarModal: React.FC<BookingCalendarModalProps> = ({
    isOpen,
    onClose,
    dateRange,
    onChange,
    existingBookedDates,
    onConfirm,
    readOnly = false,
    productDetails
}) => {
    if (!isOpen) return null;

    const [startDate, endDate] = dateRange;

    // Helper to get formatted date string
    const formatDate = (date: Date | null) => {
        return date ? date.toLocaleDateString('en-GB') : "Select date";
    };

    return (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-none shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8 border border-gray-100 relative">
                {/* Header with Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2 className="text-lg font-semibold uppercase tracking-wide mb-4 text-center">Book Rental Period</h2>

                {/* Product Summary */}
                {productDetails && (
                    <div className="flex gap-4 mb-6 py-4 border-y border-gray-200">
                        {productDetails.image && (
                            <div className="relative w-24 h-32 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                <img
                                    src={productDetails.image}
                                    alt={productDetails.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate">{productDetails.title}</h3>
                            {productDetails.customId && (
                                <p className="text-sm text-gray-500 mb-2">ID: {productDetails.customId}</p>
                            )}
                            <p className="text-lg font-bold text-gray-900">Price: {productDetails.price}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <style>{`
                        .react-datepicker {
                            border: 1px solid #e5e7eb;
                            font-family: inherit;
                            border-radius: 0 !important;
                            margin: 0 auto !important;
                            width: fit-content !important;
                        }
                        .react-datepicker__header {
                            background-color: white;
                            border-bottom: 1px solid #e5e7eb;
                            padding-top: 0;
                        }
                        .react-datepicker__month-container {
                            width: 100% !important;
                        }
                        .react-datepicker__current-month { 
                            font-size: 0.9rem; 
                            font-weight: 600; 
                            color: #111; 
                            margin-bottom: 0.5rem; 
                        }
                        .react-datepicker__day-name, .react-datepicker__day {
                            width: 2rem !important;
                            line-height: 2rem !important;
                            margin: 0.05rem !important;
                            font-size: 0.875rem !important;
                        }
                        .react-datepicker__day-names { display: flex; justify-content: space-around; }
                        .react-datepicker__month { display: flex; flex-direction: column; align-items: center; }
                        .react-datepicker__week { display: flex; justify-content: center; }
                        
                        .react-datepicker__day--selected, 
                        .react-datepicker__day--in-selecting-range, 
                        .react-datepicker__day--in-range,
                        .react-datepicker__month-text--selected,
                        .react-datepicker__month-text--in-selecting-range,
                        .react-datepicker__month-text--in-range {
                            background-color: #e5e7eb !important;
                            color: #1f2937 !important;
                            border-radius: 0.375rem !important;
                            border: none !important;
                        }
                        .react-datepicker__day--range-start {
                            background-color: #e5e7eb !important;
                            color: #1f2937 !important;
                            border-radius: 0.375rem !important;
                            border: none !important;
                        }
                        .react-datepicker__day--range-end {
                            background-color: #e5e7eb !important;
                            color: #1f2937 !important;
                            border-radius: 0.375rem !important;
                            border: 1px solid #9ca3af !important;
                        }
                        .react-datepicker__day--in-selecting-range {
                            background-color: #d1d5db !important;
                            color: #374151 !important;
                            border: 1px solid #9ca3af !important;
                        }
                        .react-datepicker__day--in-range:not(.react-datepicker__day--selected) {
                            background-color: #e5e7eb !important;
                            color: #1f2937 !important;
                            border: none !important;
                        }
                        .react-datepicker__day:hover {
                            background-color: #f3f4f6 !important;
                            border-radius: 0.375rem !important;
                        }
                        .react-datepicker__day--disabled { color: #ccc !important; opacity: 0.5; }
                    `}</style>

                    <div className="flex justify-center mb-6 relative">
                        <DatePicker
                            selected={startDate}
                            onChange={onChange}
                            startDate={startDate}
                            endDate={endDate}
                            selectsRange
                            inline
                            minDate={new Date()}
                            excludeDates={existingBookedDates}
                            monthsShown={1}
                            dateFormat="dd/MM/yyyy"
                            readOnly={readOnly}
                        />
                        {readOnly && (
                            <div className="absolute inset-0 bg-transparent cursor-not-allowed z-10" title="Dates are fixed for this inquiry"></div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="border border-black bg-white p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Start Date</p>
                            <p className="text-sm font-medium">{formatDate(startDate)}</p>
                        </div>
                        <div className="border border-black bg-white p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">End Date</p>
                            <p className="text-sm font-medium">{formatDate(endDate)}</p>
                        </div>
                    </div>

                    <button
                        onClick={onConfirm}
                        disabled={!startDate || !endDate}
                        className="w-full bg-black text-white font-semibold py-3 px-4 rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
                    >
                        Confirm Booking
                    </button>
                </div>
            </div>
        </div>
    );
};
