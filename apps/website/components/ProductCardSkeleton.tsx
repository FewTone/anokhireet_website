import { Skeleton } from "@/components/Skeleton";

export default function ProductCardSkeleton() {
    return (
        <div className="block bg-white group relative">
            {/* Image placeholder - Aspect ratio 4/5 matching product card */}
            <div className={`relative w-full aspect-[4/5] overflow-hidden bg-gray-100 mb-3`}>
                <Skeleton className="h-full w-full rounded-none" />
            </div>

            {/* Content placeholder */}
            <div className="px-2 pb-2">
                <div className="flex justify-between items-start mb-1">
                    {/* Left: Title & ID */}
                    <div className="flex-1 pr-2 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    {/* Right: Price */}
                    <div className="text-right pl-2 space-y-1">
                        <Skeleton className="h-4 w-20 ml-auto" />
                        <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                </div>
            </div>
        </div>
    );
}
