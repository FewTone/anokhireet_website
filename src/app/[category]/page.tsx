import { Suspense } from "react";
import CategoryClient from "./CategoryClient";

export const dynamicParams = false;

export function generateStaticParams() {
    return [{ category: "shirts" }, { category: "trousers" }, { category: "chinos" }];
}

export default function CategoryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading category...</div>}>
            <CategoryClient />
        </Suspense>
    );
}
