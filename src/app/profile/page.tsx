"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ProfileRedirectInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Construct the new URL maintaining other params if necessary, or just force login
        const params = new URLSearchParams(searchParams.toString());
        params.set('login', 'true');

        // Redirect to Home with login param
        router.replace(`/?${params.toString()}`);
    }, []);

    // Return null or a minimal loader (though it should redirect fast)
    // We can show nothing to minimize "white flash" impact, or a transparent div
    return null;
}

export default function Profile() {
    return (
        <Suspense fallback={null}>
            <ProfileRedirectInner />
        </Suspense>
    );
}
