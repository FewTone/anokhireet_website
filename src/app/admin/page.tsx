import { Suspense } from "react";
import AdminClient, { AdminLoading } from "./AdminClient";

export const dynamic = "force-static";

export default function AdminPage() {
    return (
        <Suspense fallback={<AdminLoading />}>
            <AdminClient />
        </Suspense>
    );
}
