import { Suspense } from "react";
import ManageProductsClient from "./ClientPage";



export const dynamic = "force-dynamic";

export default function ManageProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading management...</div>}>
            <ManageProductsClient />
        </Suspense>
    );
}
