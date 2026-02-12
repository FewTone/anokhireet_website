"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';

export function useTotalUnreadCount() {
    const [unreadCount, setUnreadCount] = useState(0);
    const { session } = useAuth();

    const fetchCount = useCallback(async () => {
        try {
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

            if (userError) {
                console.error("Error fetching public user id for unread count:", userError);
                return;
            }

            if (!userData) {
                // Not a public user (e.g. admin), so no unread count
                setUnreadCount(0);
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

        // Auth changes are now handled by AuthProvider and dependency on session

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchCount, session]);

    return unreadCount;
}
