import { Skeleton } from "@/components/Skeleton";

export default function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen pt-0 pb-12">
            <div className="max-w-[1400px] mx-auto px-0 md:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">

                    {/* Left Column: Images (lg:col-span-7) */}
                    <div className="lg:col-span-7">
                        <div className="flex flex-col md:flex-row gap-4">

                            {/* Mobile Skeleton: Single aspect ratio block */}
                            <div className="md:hidden w-full relative aspect-[4/5]">
                                <Skeleton className="w-full h-full rounded-none" />
                            </div>

                            {/* Desktop Image Gallery Structure (Hidden on mobile) */}
                            <div className="hidden md:flex flex-1 w-full flex-col gap-4">
                                {/* Breadcrumbs Skeleton */}
                                <div className="flex items-center gap-2 mb-4 mt-8">
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-24" />
                                </div>

                                {/* Main Gallery Area */}
                                <div className="flex gap-6 justify-end items-start px-4">
                                    {/* Desktop Thumbnails */}
                                    <div className="flex flex-col gap-3 w-20 flex-shrink-0 pt-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-full aspect-[4/5]">
                                                <Skeleton className="w-full h-full rounded-none" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Main Image */}
                                    <div className="relative w-full max-w-[500px] aspect-[4/5]">
                                        <Skeleton className="w-full h-full rounded-none" />
                                    </div>

                                    {/* Desktop Right Action Buttons (Wishlist/Share) */}
                                    <div className="flex flex-col gap-3 pt-4">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details (lg:col-span-5) */}
                    <div className="lg:col-span-5 px-4 md:px-0 mt-0 lg:mt-24">
                        <div className="sticky top-24 space-y-6">

                            {/* Title & ID */}
                            <div>
                                <Skeleton className="h-8 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/3 mb-4" />

                                <div className="space-y-2 mb-6">
                                    <Skeleton className="h-8 w-1/4" />
                                    <Skeleton className="h-6 w-1/5" />
                                </div>

                                {/* Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <Skeleton className="h-14 w-full rounded-none" />
                                    <Skeleton className="h-14 w-full rounded-none" />
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <Skeleton className="h-6 w-1/3" />
                                </div>
                            </div>

                            {/* Accordions */}
                            <div className="border-t border-gray-200 pt-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="border-b border-gray-100 py-4 flex justify-between items-center">
                                        <Skeleton className="h-5 w-1/3" />
                                        <Skeleton className="h-5 w-5 rounded-full" />
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>

                </div>
            </div>
            {/* Related Products Skeleton Section */}
            <div className="w-full pb-12 mt-8 border-t border-gray-100 pt-8 max-w-[1400px] mx-auto px-4">
                <div className="h-7 w-48 mx-auto mb-4 bg-gray-100 animate-pulse rounded" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse">
                            <Skeleton className="w-full h-full rounded-none" />
                        </div>
                    ))}
                </div>
            </div>
        </div>

    );
}
