"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface WebsiteGuardProps {
    children: React.ReactNode;
}

export default function WebsiteGuard({ children }: WebsiteGuardProps) {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Define allowed routes that should always be accessible (coming-soon is NOT in this list for redirect logic)
        const allowedRoutes = [
            "/admin",
            "/profile",
            "/user",
            "/my-products",
            "/wishlist",
            "/chat"
        ];
        
        const isAllowedRoute = allowedRoutes.some(route => pathname?.startsWith(route));

        // Check website setting
        const checkWebsiteSetting = async () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebsiteGuard.tsx:31',message:'checkWebsiteSetting called',data:{pathname,isAllowedRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            try {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebsiteGuard.tsx:33',message:'Before Supabase query',data:{supabaseClient:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                const { data, error } = await supabase
                    .from("website_settings")
                    .select("value")
                    .eq("key", "website_enabled")
                    .single();
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebsiteGuard.tsx:37',message:'After Supabase query',data:{hasData:!!data,hasError:!!error,errorCode:error?.code,errorMessage:error?.message?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No rows returned - setting doesn't exist, default to website visible
                        setIsEnabled(true);
                        setLoading(false);
                        // If on coming-soon and no setting, redirect to home
                        if (pathname === "/coming-soon" && !isAllowedRoute) {
                            router.push("/");
                        }
                        return;
                    }
                    console.error("Error loading website setting:", error);
                    // Default to enabled (show normal website) on error
                    setIsEnabled(true);
                    setLoading(false);
                    return;
                }

                if (data && data.value !== null && data.value !== undefined) {
                    // Parse the value correctly
                    let settingValue: boolean;
                    if (typeof data.value === 'string') {
                        settingValue = data.value === 'true' || data.value === 'True';
                    } else if (typeof data.value === 'boolean') {
                        settingValue = data.value;
                    } else {
                        // Handle JSONB boolean
                        settingValue = Boolean(data.value);
                    }
                    
                    // Logic: settingValue true = coming soon active (website disabled)
                    //         settingValue false = website visible (website enabled)
                    const enabled = !settingValue; // Reverse for isEnabled state
                    setIsEnabled(enabled);
                    
                    // Handle redirects based on setting
                    // CRITICAL: Always redirect away from coming-soon when website is enabled
                    if (enabled && pathname === "/coming-soon") {
                        // Setting is false (show normal website) - redirect away from coming-soon
                        console.log("🔄 Website enabled - redirecting away from coming-soon page");
                        // Use replace instead of push to prevent back button issues
                        router.replace("/");
                        return;
                    }
                    
                    // Only redirect public pages (not user account pages or admin) to coming-soon
                    if (!enabled && !isAllowedRoute && pathname !== "/coming-soon") {
                        // Setting is true (show coming soon) - redirect to coming-soon
                        console.log("🔄 Website disabled - redirecting to coming-soon page");
                        // Use replace and ensure it happens
                        setTimeout(() => {
                            router.replace("/coming-soon");
                        }, 50);
                    }
                } else {
                    // Default to enabled (show normal website) if setting doesn't exist
                    setIsEnabled(true);
                    // If on coming-soon and no setting exists, redirect to home
                    if (pathname === "/coming-soon" && !isAllowedRoute) {
                        router.push("/");
                    }
                }
            } catch (error: any) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/2c9fd14d-ce25-467e-afb5-33c950f09df0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebsiteGuard.tsx:101',message:'Error in checkWebsiteSetting',data:{errorType:error?.constructor?.name,errorMessage:error?.message?.substring(0,200),errorStack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.error("Error checking website setting:", error);
                // Default to enabled (show normal website) on error
                setIsEnabled(true);
                // If on coming-soon and error, redirect to home
                if (pathname === "/coming-soon" && !isAllowedRoute) {
                    router.push("/");
                }
            } finally {
                setLoading(false);
            }
        };

        checkWebsiteSetting();

        // Subscribe to changes
        const channel = supabase
            .channel('website-settings-changes-guard')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'website_settings',
                    filter: `key=eq.website_enabled`
                },
                (payload) => {
                    console.log("🔄 Website setting changed via realtime:", payload);
                    if (payload.new) {
                        const value = (payload.new as any).value;
                        // Parse the value correctly
                        let settingValue: boolean;
                        if (typeof value === 'string') {
                            settingValue = value === 'true' || value === 'True';
                        } else if (typeof value === 'boolean') {
                            settingValue = value;
                        } else {
                            settingValue = Boolean(value);
                        }
                        
                        console.log("🔄 Parsed setting value:", settingValue);
                        
                        // Logic: settingValue true = coming soon active (website disabled)
                        //         settingValue false = website visible (website enabled)
                        const enabled = !settingValue; // Reverse for isEnabled state
                        setIsEnabled(enabled);
                        
                        console.log("🔄 Website enabled state:", enabled, "(true = normal website, false = coming soon)");
                        
                        // Define allowed routes (excluding coming-soon for redirect logic)
                        const allowedRoutes = [
                            "/admin",
                            "/profile",
                            "/user",
                            "/my-products",
                            "/wishlist",
                            "/chat"
                        ];
                        const isAllowedRoute = allowedRoutes.some(route => pathname?.startsWith(route));
                        
                        // Handle redirects based on setting change
                        // CRITICAL: Always redirect away from coming-soon when website is enabled
                        if (enabled && pathname === "/coming-soon") {
                            // Setting is false (show normal website) - redirect away from coming-soon
                            console.log("🔄 Website enabled - redirecting away from coming-soon page");
                            router.replace("/");
                            return;
                        }
                        
                        // Only redirect public pages (not user account pages or admin) to coming-soon
                        if (!enabled && !isAllowedRoute && pathname !== "/coming-soon") {
                            // Setting is true (show coming soon) - redirect to coming-soon if not already there
                            console.log("🔄 Website disabled - redirecting to coming-soon page immediately");
                            // Use replace and add a small delay to ensure state is updated
                            setTimeout(() => {
                                router.replace("/coming-soon");
                            }, 100);
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log("📡 Website settings subscription status:", status);
                if (status === 'SUBSCRIBED') {
                    console.log("✅ Successfully subscribed to website settings changes");
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    console.warn("⚠️ Website settings subscription issue:", status);
                    // Fallback: re-check setting manually
                    setTimeout(() => {
                        checkWebsiteSetting();
                    }, 2000);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pathname, router]);

    // Handle redirects based on website enabled state (separate useEffect to avoid render errors)
    useEffect(() => {
        if (loading || isEnabled === null) return;

        const allowedRoutes = [
            "/admin",
            "/profile",
            "/user",
            "/my-products",
            "/wishlist",
            "/chat",
            "/coming-soon"
        ];
        const isAllowedRoute = allowedRoutes.some(route => pathname?.startsWith(route));

        // If website is disabled and not on coming-soon, redirect to coming-soon
        if (!isEnabled && !isAllowedRoute && pathname !== "/coming-soon") {
            console.log("🔄 Website disabled - redirecting to coming-soon");
            router.replace("/coming-soon");
            return;
        }

        // If website is enabled and on coming-soon, redirect to home
        if (isEnabled && pathname === "/coming-soon") {
            console.log("🔄 Website enabled - redirecting from coming-soon to home");
            router.replace("/");
            return;
        }
    }, [isEnabled, loading, pathname, router]);

    // Show loading state
    if (loading) {
        return null; // Or a loading spinner if preferred
    }

    // Define allowed routes that should always be accessible
    const allowedRoutes = [
        "/admin",
        "/profile",
        "/user",
        "/my-products",
        "/wishlist",
        "/chat",
        "/coming-soon"
    ];
    const isAllowedRoute = allowedRoutes.some(route => pathname?.startsWith(route));
    
    // If website is disabled (setting is true = coming soon active)
    if (!isEnabled) {
        // Allow user account pages and admin routes even when website is disabled
        if (isAllowedRoute) {
            return <>{children}</>;
        }
        
        // Show coming-soon page (redirect handled in useEffect above)
        if (pathname === "/coming-soon") {
            return <>{children}</>;
        }
        // Wait for redirect
        return null;
    }

    // If website is enabled (setting is false = website visible) and on coming-soon, wait for redirect
    if (isEnabled && pathname === "/coming-soon") {
        return null; // Redirect handled in useEffect above
    }

    // Otherwise, show the normal content
    return <>{children}</>;
}

