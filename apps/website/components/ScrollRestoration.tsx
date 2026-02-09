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
        // Disable browser's automatic scroll restoration to prevent conflicts
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        const scrollContainer = document.getElementById('app-shell-scroll');

        // Target is either the specific container or the window
        const target = scrollContainer || window;
        const getScrollTop = () => scrollContainer ? scrollContainer.scrollTop : window.scrollY;
        const setScrollTop = (top: number) => {
            if (scrollContainer) {
                scrollContainer.scrollTop = top;
            } else {
                window.scrollTo({ top, behavior: 'instant' });
            }
        };

        // Function to save scroll position
        const handleSaveScroll = () => {
            const currentPos = getScrollTop();
            if (isTracking.current && currentPos > 0) {
                globalScrollPositions[currentKey] = currentPos;
                // Also save to sessionStorage as a backup
                try {
                    sessionStorage.setItem(`scroll_${currentKey}`, currentPos.toString());
                } catch (e) { }
            }
        };

        target.addEventListener('scroll', handleSaveScroll, { passive: true });

        // RESTORATION LOGIC
        let savedPos = globalScrollPositions[currentKey];
        if (savedPos === undefined) {
            try {
                const stored = sessionStorage.getItem(`scroll_${currentKey}`);
                if (stored) savedPos = parseInt(stored, 10);
            } catch (e) { }
        }

        if (savedPos !== undefined && savedPos > 0) {
            isTracking.current = false;
            let restorationComplete = false;
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds at 100ms

            const tryRestore = () => {
                if (restorationComplete) return;

                // Attempt to scroll
                setScrollTop(savedPos!);

                // Check if we reached it
                if (Math.abs(getScrollTop() - savedPos!) < 5) {
                    restorationComplete = true;
                    observer.disconnect();
                    clearInterval(interval);
                    isTracking.current = true;
                }
            };

            // Use MutationObserver to react to dynamic content loading
            // Observe body as fallback if container is missing
            const observeTarget = scrollContainer || document.body;
            const observer = new MutationObserver(() => {
                tryRestore();
            });

            observer.observe(observeTarget, {
                childList: true,
                subtree: true
            });

            // Fallback interval
            const interval = setInterval(() => {
                attempts++;
                tryRestore();
                if (attempts >= maxAttempts) {
                    restorationComplete = true;
                    observer.disconnect();
                    clearInterval(interval);
                    isTracking.current = true;
                }
            }, 100);

            // Immediate attempt
            tryRestore();

            return () => {
                target.removeEventListener('scroll', handleSaveScroll);
                observer.disconnect();
                clearInterval(interval);
            };
        } else {
            // New page or top of page - ensure it starts at 0
            setScrollTop(0);
            isTracking.current = true;
        }

        return () => {
            target.removeEventListener('scroll', handleSaveScroll);
        };
    }, [currentKey]);

    return null;
}
