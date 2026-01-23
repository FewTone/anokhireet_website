"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

// Store positions globally to survive component remounts within the same session
const globalScrollPositions: { [key: string]: number } = {};

export default function ScrollRestoration() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isTracking = useRef(true);

    // Create a unique key for the current page
    const currentKey = pathname + searchParams.toString();

    useEffect(() => {
        const scrollContainer = document.getElementById('app-shell-scroll');
        if (!scrollContainer) return;

        // Function to save scroll position
        const handleSaveScroll = () => {
            if (isTracking.current && scrollContainer.scrollTop > 0) {
                globalScrollPositions[currentKey] = scrollContainer.scrollTop;
                // Also save to sessionStorage as a backup
                try {
                    sessionStorage.setItem(`scroll_${currentKey}`, scrollContainer.scrollTop.toString());
                } catch (e) { }
            }
        };

        scrollContainer.addEventListener('scroll', handleSaveScroll);

        // RESTORATION LOGIC
        // Priority: Global JS object > Session Storage
        let savedPos = globalScrollPositions[currentKey];
        if (savedPos === undefined) {
            try {
                const stored = sessionStorage.getItem(`scroll_${currentKey}`);
                if (stored) savedPos = parseInt(stored, 10);
            } catch (e) { }
        }

        if (savedPos !== undefined && savedPos > 0) {
            // We are starting a restoration - stop tracking scroll events to avoid overwriting with 0
            isTracking.current = false;

            let restorationComplete = false;
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds at 100ms

            const tryRestore = () => {
                if (restorationComplete) return;

                // Attempt to scroll
                scrollContainer.scrollTop = savedPos;

                // Check if we reached it
                // We add a small tolerance for scroll precision
                if (Math.abs(scrollContainer.scrollTop - savedPos) < 2) {
                    restorationComplete = true;
                    observer.disconnect();
                    clearInterval(interval);
                    // Page has settled - resume tracking
                    isTracking.current = true;
                }
            };

            // Use MutationObserver to react to dynamic content loading (e.g., product lists)
            const observer = new MutationObserver(() => {
                tryRestore();
            });

            observer.observe(scrollContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });

            // Fallback interval for things that don't trigger observer (like images loading without layout change)
            const interval = setInterval(() => {
                attempts++;
                tryRestore();
                if (attempts >= maxAttempts) {
                    restorationComplete = true;
                    observer.disconnect();
                    clearInterval(interval);
                    isTracking.current = true; // Fallback to tracking even if we didn't reach it
                }
            }, 100);

            // Immediate attempt
            tryRestore();

            return () => {
                scrollContainer.removeEventListener('scroll', handleSaveScroll);
                observer.disconnect();
                clearInterval(interval);
            };
        } else {
            // New page or top of page
            scrollContainer.scrollTop = 0;
            isTracking.current = true;
        }

        return () => {
            scrollContainer.removeEventListener('scroll', handleSaveScroll);
        };
    }, [currentKey]);

    return null;
}
