import { Suspense } from "react";
import AdminClient, { AdminLoading } from "./AdminClient";

export const dynamic = "force-dynamic";

export default function AdminPage() {
    return (
        <Suspense fallback={<AdminLoading />}>
            <AdminClient />
        </Suspense>
    );
}
