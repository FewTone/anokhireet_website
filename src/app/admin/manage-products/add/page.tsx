import { Suspense } from "react";
import AddProductClient from "./ClientPage";



export const dynamic = "force-dynamic";

export default function AddProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading editor...</div>}>
            <AddProductClient />
        </Suspense>
    );
}
