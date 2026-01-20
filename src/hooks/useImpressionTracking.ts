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
                        const { data: { user } } = await supabase.auth.getUser();
                        let authUserId = null;

                        if (user) {
                            const { data: userData } = await supabase
                                .from('users')
                                .select('id')
                                .eq('auth_user_id', user.id)
                                .maybeSingle();
                            authUserId = userData?.id;
                        }

                        let anonId = localStorage.getItem('anokhi_viewer_id');

                        // Ensure we have a valid UUID for guest tracking
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (!anonId || !uuidRegex.test(anonId)) {
                            anonId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                                const r = Math.random() * 16 | 0;
                                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                                return v.toString(16);
                            });
                            localStorage.setItem('anokhi_viewer_id', anonId);
                        }

                        // 2. Track via RPC (DB handles 30-min throttling)
                        await supabase.rpc('track_product_impression', {
                            p_product_id: productId,
                            p_user_id: authUserId,
                            p_anonymous_id: anonId
                        });

                    } catch (error) {
                        console.error('Error tracking impression:', error);
                        // Reset ref on error to allow retry if it wasn't tracked
                        hasTracked.current = false;
                    }
                }
            },
            {
                threshold: 0.5, // 50% visible
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [productId]);

    return elementRef;
}
