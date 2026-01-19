"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useTotalUnreadCount() {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchCount = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setUnreadCount(0);
                return;
            }

            // We need the PUBLIC user id to filter messages correctly
            // messages.sender_user_id stores the public.users.id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', session.user.id)
                .maybeSingle();

            if (userError || !userData) {
                console.error("Error fetching public user id for unread count:", userError);
                return;
            }

            const publicUserId = userData.id;

            // Count messages where is_read is false AND sender is not me
            // RLS handles filtering by chats I'm a participant in
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_user_id', publicUserId);

            if (error) {
                console.error("Error fetching total unread count:", error);
                return;
            }

            setUnreadCount(count || 0);

            // Update browser tab title (WhatsApp style)
            if (count && count > 0) {
                document.title = `(${count}) Anokhi Reet`;
            } else {
                document.title = "Anokhi Reet";
            }
        } catch (error) {
            console.error("Error in fetchCount:", error);
        }
    }, []);

    useEffect(() => {
        fetchCount();

        // Subscribe to changes in messages table
        const channel = supabase
            .channel('total-unread-count-global')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    fetchCount();
                }
            )
            .subscribe();

        // Also listen for auth changes to re-fetch count
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                fetchCount();
            } else if (event === 'SIGNED_OUT') {
                setUnreadCount(0);
            }
        });

        return () => {
            supabase.removeChannel(channel);
            authSubscription.unsubscribe();
        };
    }, [fetchCount]);

    return unreadCount;
}
