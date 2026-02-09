"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useImpressionTracking(productId: string | number) {
    const hasTracked = useRef(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined' || !productId || hasTracked.current) return;

        const observer = new IntersectionObserver(
            async (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !hasTracked.current) {
                    hasTracked.current = true;
                    observer.disconnect();

                    try {
                        // 1. Get identifiers
                        // console.log('👁️ Tracking impression for product:', productId);
                        const { data: { user } } = await supabase.auth.getUser();
                        let authUserId = null;

                        if (user) {
                            const { data: userData } = await supabase
                                .from('users')
                                .select('id')
                                .eq('auth_user_id', user.id)
                                .maybeSingle();
                            authUserId = userData?.id || null;
                        }

                        let anonId = typeof window !== 'undefined' ? localStorage.getItem('anokhi_viewer_id') : null;

                        // Ensure we have a valid UUID for guest tracking
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (!anonId || !uuidRegex.test(anonId)) {
                            anonId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                                const r = Math.random() * 16 | 0;
                                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                                return v.toString(16);
                            });
                            if (typeof window !== 'undefined') localStorage.setItem('anokhi_viewer_id', anonId);
                        }

                        // 2. Track via RPC (DB handles 30-min throttling)
                        // Use 'record_impression' to avoid ad-blockers blocking "track_*" requests
                        await supabase.rpc('record_impression', {
                            p_product_id: productId,
                            p_user_id: authUserId,
                            p_anonymous_id: anonId
                        });
                        // console.log('✅ Impression recorded');

                    } catch (error) {
                        console.error('Error tracking impression:', error);
                        // Reset ref on error to allow retry if it wasn't tracked
                        hasTracked.current = false;
                    }
                }
            },
            {
                threshold: 0.1, // 10% visible - captures "glance" views better
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [productId]);

    return elementRef;
}
