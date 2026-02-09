import { Suspense } from "react";
import EditProductClient from "./ClientPage";

export const dynamic = "force-static";

export default function EditProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading editor...</div>}>
            <EditProductClient />
        </Suspense>
    );
}
