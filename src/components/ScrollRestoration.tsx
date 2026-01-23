"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ScrollRestoration() {
    const pathname = usePathname();
    const scrollPositions = useRef<{ [key: string]: number }>({});
    const lastPathname = useRef<string>("");

    useEffect(() => {
        const scrollContainer = document.getElementById('app-shell-scroll');
        if (!scrollContainer) return;

        // Function to save scroll position
        const handleScroll = () => {
            if (pathname) {
                scrollPositions.current[pathname] = scrollContainer.scrollTop;
            }
        };

        // Function to attempt scroll restoration with retries
        const attemptRestoration = () => {
            const savedPos = scrollPositions.current[pathname];
            if (savedPos === undefined || savedPos <= 0) return;

            // Try to restore immediately
            scrollContainer.scrollTop = savedPos;

            // If it didn't STICK (meaning content isn't long enough yet), retry
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds total (100ms intervals)

            const interval = setInterval(() => {
                attempts++;

                // If scroll matches saved OR we hit max attempts OR content is long enough
                if (scrollContainer.scrollTop === savedPos || attempts >= maxAttempts) {
                    clearInterval(interval);
                    return;
                }

                // Attempt to set it again (in case height grew)
                scrollContainer.scrollTop = savedPos;
            }, 100);

            return () => clearInterval(interval);
        };

        // When pathname changes
        if (pathname !== lastPathname.current) {
            // Give a small delay for the initial render
            const timer = setTimeout(attemptRestoration, 50);
            lastPathname.current = pathname;

            scrollContainer.addEventListener('scroll', handleScroll);

            return () => {
                scrollContainer.removeEventListener('scroll', handleScroll);
                clearTimeout(timer);
            };
        }

        // Keep scroll listener active
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    return null;
}
