"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { convertToWebPOptimized } from "@/lib/imageUtils";
import { formatUserDisplayName } from "@/lib/utils";
import dynamic from 'next/dynamic';
import ReportModal from "@/components/ReportModal";
import SuccessModal from "@/components/SuccessModal";
import LoginModal from "@/components/LoginModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BookingCalendarModal } from "@/components/bookings/BookingCalendarModal";

interface Chat {
    id: string;
    inquiry_id: string;
    created_at: string;
    inquiry?: {
        product?: {
            title?: string;
            name?: string;
            price?: number;
            image?: string;
            product_id?: string;
        };
        owner_user_id: string;
        renter_user_id: string;
    };
    other_user?: {
        id: string;
        name: string;
        phone?: string;
        avatar_url?: string;
    };
    last_message?: {
        message: string;
        created_at: string;
        sender_user_id: string;
        is_read: boolean;
        is_delivered?: boolean;
        media_url?: string;
    };
    unread_count: number;
}

interface Message {
    id: string;
    chat_id: string;
    sender_user_id: string;
    message: string;
    created_at: string;
    is_read: boolean;
    is_delivered?: boolean;
    read_at?: string;
    media_url?: string;
    media_type?: string;
    reply_to_message_id?: string;
    sender?: {
        name: string;
        avatar_url?: string;
    };
    reply_message?: Message;
}

export default function ChatClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar_url?: string } | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUserOnline, setOtherUserOnline] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);


    // Pagination state
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [page, setPage] = useState(0);
    const MESSAGES_PER_PAGE = 50;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const chatChannelRef = useRef<any>(null);

    const isUserAtBottomRef = useRef(true); // Track if user is at bottom

    // Check login status and load chats
    useEffect(() => {
        checkLoginStatus();
    }, []);

    // Load chats when user is loaded
    // Load chats when user is loaded
    useEffect(() => {
        if (currentUser) {
            loadChats();
        }
    }, [currentUser]);

    const selectedChatIdRef = useRef<string | null>(null);
    const chatsRef = useRef<Chat[]>([]);

    useEffect(() => {
        selectedChatIdRef.current = selectedChat?.id || null;
    }, [selectedChat]);

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    // Better scrolling with useLayoutEffect to avoid flickers
    useLayoutEffect(() => {
        if (selectedChat && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, selectedChat]);

    interface BookingData {
        productId: string;
        inquiryId: string;
        messageId: string;
        dates: [Date | null, Date | null];
        existingBookedDates: Date[];
        productDetails?: {
            title: string;
            image: string;
            price: number;
            customId?: string;
        };
    }

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState<BookingData | null>(null);

    // Fetch booked dates for a product to populate exclusion list
    const fetchBookedDates = async (productId: string) => {
        try {
            // First get the db_id if we only have a slug/string ID
            let dbId = productId;
            // Check if it's a UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

            if (!isUUID) {
                const { data: prodData } = await supabase
                    .from('products')
                    .select('id')
                    .eq('product_id', productId) // assuming productId column holds the slug/string ID
                    .single();
                if (prodData) dbId = prodData.id;
            }

            const { data, error } = await supabase
                .from('inquiries')
                .select('start_date, end_date, status')
                .eq('product_id', dbId)
                .eq('status', 'confirmed');

            if (data) {
                const dates: Date[] = [];
                data.forEach((booking: any) => {
                    const start = new Date(booking.start_date);
                    const end = new Date(booking.end_date);
                    let current = new Date(start);
                    while (current <= end) {
                        dates.push(new Date(current));
                        current.setDate(current.getDate() + 1);
                    }
                });
                return dates;
            }
        } catch (e) {
            console.error("Error fetching booked dates", e);
        }
        return [];
    };

    const handleOpenBookingModal = async (productId: string, inquiryId: string, messageId: string, startStr: string, endStr: string, initialProductDetails?: any) => {
        const start = startStr ? new Date(startStr) : null;
        const end = endStr ? new Date(endStr) : null;

        try {
            const booked = await fetchBookedDates(productId);

            // 1. Use initial details passed from the card (Highest Priority)
            let productDetails = initialProductDetails ? {
                title: initialProductDetails.name || initialProductDetails.title || "Product",
                image: initialProductDetails.image || "",
                price: Number(initialProductDetails.price) || 0,
                customId: initialProductDetails.productId || initialProductDetails.customId
            } : undefined;

            if (!productDetails) {

                // Extract product details from the currently selected chat if available
                // Fetch product details explicitly
                let dbId = productId;
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

                // If productId is not UUID (it's custom ID), get the real UUID first
                if (!isUUID) {
                    const { data: prodData } = await supabase
                        .from('products')
                        .select('id')
                        .eq('product_id', productId)
                        .maybeSingle();
                    if (prodData) dbId = prodData.id;
                }

                let productDetails = undefined;

                // Only try fetching if we have a valid UUID dbId, otherwise skip to fallback
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbId)) {
                    // Fetch full product details
                    const { data: productData } = await supabase
                        .from('products')
                        .select('title, name, price, product_media, product_id')
                        .eq('id', dbId)
                        .maybeSingle();

                    if (productData) {
                        let image = "";
                        if (productData.product_media && Array.isArray(productData.product_media) && productData.product_media.length > 0) {
                            image = productData.product_media[0].url;
                        }

                        productDetails = {
                            title: productData.title || productData.name || "Product",
                            image: image,
                            price: productData.price || 0,
                            customId: productData.product_id
                        };
                    }
                }

                // Fallback to selectedChat data if explicit fetch failed or returned nothing
                if (!productDetails && selectedChat?.inquiry?.product) {
                    productDetails = {
                        title: selectedChat.inquiry.product.title || selectedChat.inquiry.product.name || "Product",
                        image: selectedChat.inquiry.product.image || "",
                        price: selectedChat.inquiry.product.price || 0,
                        customId: selectedChat.inquiry.product.product_id || (isUUID ? undefined : productId)
                    };
                }
            }

            setBookingData({
                productId,
                inquiryId,
                messageId,
                dates: [start, end],
                existingBookedDates: booked,
                productDetails
            });
            setShowBookingModal(true);
        } catch (e) {
            console.error("Error opening booking modal", e);
        }
    };

    const handleConfirmBooking = async () => {
        if (!currentUser) return;
        if (!selectedChat) return;
        if (!bookingData || !bookingData.dates[0] || !bookingData.dates[1]) return;

        try {
            const { dates, inquiryId, messageId, productId } = bookingData;

            // Resolve DB ID again to be safe
            let dbId = productId;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
            if (!isUUID) {
                const { data: prodData } = await supabase.from('products').select('id').eq('product_id', productId).single();
                if (prodData) dbId = prodData.id;
            }

            // 1. Update Inquiry
            const { data: updateData, error } = await supabase
                .from('inquiries')
                .update({
                    status: 'confirmed',
                    start_date: dates[0]!.toISOString(),
                    end_date: dates[1]!.toISOString()
                })
                .eq('id', inquiryId)
                .select();

            if (error) throw error;

            // Fallback insert
            if (!updateData || updateData.length === 0) {
                const ownerId = selectedChat?.inquiry?.owner_user_id || currentUser.id;
                const renterId = selectedChat?.inquiry?.renter_user_id || selectedChat?.other_user?.id;

                await supabase.from('inquiries').insert([{
                    product_id: dbId,
                    owner_user_id: ownerId,
                    renter_user_id: renterId,
                    start_date: dates[0]!.toISOString(),
                    end_date: dates[1]!.toISOString(),
                    status: 'confirmed'
                }]);
            }

            // 2. Send Confirmation Message
            if (messageId && selectedChat) {
                const formattedDates = `${dates[0]!.toLocaleDateString('en-GB')} - ${dates[1]!.toLocaleDateString('en-GB')}`;
                await supabase
                    .from('messages')
                    .insert([{
                        chat_id: selectedChat.id,
                        sender_user_id: currentUser.id,
                        message: `Booking Confirmed for ${formattedDates}`,
                        reply_to_message_id: messageId
                    }]);

                // 3. Refresh State
                await loadMessages(selectedChat.id, 0, true);
                loadChats();
            }

            setShowBookingModal(false);
            setBookingData(null);

        } catch (e) {
            console.error("Error confirming booking", e);
            alert("Failed to confirm booking. Please try again.");
        }
    };

    // Auto-select chat from URL parameter - Single Source of Truth
    useEffect(() => {
        const chatId = searchParams.get('id');
        if (chatId) {
            // Check if we have the chat in our list
            const existingChat = chats.find(c => c.id === chatId);

            if (existingChat) {
                if (selectedChat?.id !== chatId) {
                    setSelectedChat(existingChat);
                }
                markAsRead(chatId);
            } else if (currentUser) {
                // Chat ID in URL but not in list - likely Admin viewing reported chat
                // OR user just clicked a link and list hasn't loaded yet
                loadSpecificChat(chatId);
            }
        } else if (selectedChat) {
            setSelectedChat(null);
        }
    }, [chats, searchParams, currentUser]);

    const loadSpecificChat = async (chatId: string) => {
        try {
            const { data: chatData, error } = await supabase
                .from("chats")
                .select("*")
                .eq("id", chatId)
                .single();

            if (error || !chatData) {
                console.error("Error loading specific chat:", error);
                return;
            }

            const { data: inquiry } = await supabase
                .from("inquiries")
                .select("*")
                .eq("id", chatData.inquiry_id)
                .single();

            if (!inquiry) return;

            let otherUserId = inquiry.owner_user_id === currentUser?.id
                ? inquiry.renter_user_id
                : inquiry.owner_user_id;

            // If neither matches (Admin view), duplicate logic: show Reporter or Reported?
            // For now, let's just show the Owner as "other user" if we are Admin
            if (currentUser?.id !== inquiry.owner_user_id && currentUser?.id !== inquiry.renter_user_id) {
                otherUserId = inquiry.owner_user_id;
            }

            const { data: otherUser } = await supabase
                .from("users")
                .select("id, name, phone, avatar_url")
                .eq("id", otherUserId)
                .single();

            let product = null;
            if (inquiry.product_id) {
                const { data: productData } = await supabase
                    .from("products")
                    .select("id, title, name, price, product_media, product_id")
                    .eq("id", inquiry.product_id)
                    .single();

                let image = null;
                if (productData?.product_media && Array.isArray(productData.product_media) && productData.product_media.length > 0) {
                    image = productData.product_media[0].url;
                }
                product = { ...productData, image };
            }

            const fullChat: Chat = {
                ...chatData,
                inquiry: { ...inquiry, product: product || null },
                other_user: otherUser || { id: otherUserId, name: "Unknown User" },
                unread_count: 0
            };

            // Add to chats list to prevent re-fetching and allow switching back
            setChats(prev => {
                if (prev.find(c => c.id === fullChat.id)) return prev;
                return [fullChat, ...prev];
            });

            setSelectedChat(fullChat);

        } catch (error) {
            console.error("Error loading specific chat details:", error);
        }
    };

    // Handle chat selection (URL driven + Immediate State)
    const handleChatSelect = (chat: Chat) => {
        setSelectedChat(chat);
        markAsRead(chat.id);
        router.push(`/chat?id=${chat.id}`);
    };

    // Handle back navigation (Mobile)
    const handleBack = () => {
        router.push('/chat');
    };

    // Load messages when chat is selected
    useEffect(() => {
        if (selectedChat && currentUser) {
            setMessages([]); // Clear previous messages
            setHasMoreMessages(true);
            setPage(0);
            loadMessages(selectedChat.id, 0, true); // Initial load
            subscribeToMessages(selectedChat.id);
            setReplyingTo(null);
            setMessageInput("");

            // Instant scroll to bottom on mount
            scrollToBottom();

            const handleFocus = () => {
                markAsRead(selectedChat.id);
            };
            window.addEventListener("focus", handleFocus);
            // Also call immediately
            markAsRead(selectedChat.id);

            return () => {
                window.removeEventListener("focus", handleFocus);
                unsubscribeFromMessages();
                if (chatChannelRef.current) {
                    chatChannelRef.current.unsubscribe();
                }
            };
        }

        return () => {
            if (selectedChat) {
                unsubscribeFromMessages();
                if (chatChannelRef.current) {
                    chatChannelRef.current.unsubscribe();
                }
            }
        };
    }, [selectedChat, currentUser]);



    // Handle typing status broadcast
    useEffect(() => {
        if (!selectedChat || !currentUser || !chatChannelRef.current) return;

        const broadcastStatus = async (typing: boolean) => {
            if (chatChannelRef.current) {
                await chatChannelRef.current.track({
                    id: currentUser.id,
                    typing: typing,
                    online: true,
                    last_seen: new Date().toISOString()
                });
            }
        };

        if (messageInput.trim().length > 0) {
            if (!isTyping) {
                setIsTyping(true);
                broadcastStatus(true);
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                broadcastStatus(false);
            }, 3000);
        } else if (isTyping) {
            setIsTyping(false);
            broadcastStatus(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [messageInput, selectedChat, currentUser]);

    // Smart Auto-scroll
    useEffect(() => {
        // Only scroll if we were at the bottom, OR if it's the very first load (messages just populated)
        // OR if the last message is from me.
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        const isFromMe = lastMessage.sender_user_id === currentUser?.id;

        if (isUserAtBottomRef.current || isFromMe || (otherUserTyping && isUserAtBottomRef.current)) {
            scrollToBottom();
        }
    }, [messages, otherUserTyping]);

    // Scroll listener to track position and load more
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

        // Check if user is near bottom (within 100px)
        isUserAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;

        // Load more if at top
        if (scrollTop === 0 && hasMoreMessages && !loading && selectedChat) {
            const prevScrollHeight = scrollHeight;
            loadMessages(selectedChat.id, page + 1, false).then(() => {
                // Maintain scroll position after loading old messages
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight;
                }
            });
        }
    };

    // Hide search bar in mobile when chat is selected
    useEffect(() => {
        if (selectedChat) {
            document.body.classList.add('chat-selected');
        } else {
            document.body.classList.remove('chat-selected');
            setOtherUserOnline(false);
            setOtherUserTyping(false);
        }
        return () => {
            document.body.classList.remove('chat-selected');
        };
    }, [selectedChat]);

    const checkLoginStatus = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: userData, error } = await supabase
                    .from("users")
                    .select("id, name, phone, avatar_url")
                    .eq("auth_user_id", session.user.id)
                    .single();

                if (userData && !error) {
                    setCurrentUser({ ...userData, name: userData.name || "User" });
                } else {
                    setCurrentUser({ id: session.user.id, name: "User" });
                }
            } else {
                setCurrentUser(null);
                // Redirect unauthenticated users to home with login modal
                router.replace("/?login=true");
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            setCurrentUser(null);
            router.replace("/?login=true");
        } finally {
            setLoading(false);
        }
    };

    const loadChats = async () => {
        if (!currentUser) return;

        try {
            const { data: inquiries, error: inquiriesError } = await supabase
                .from("inquiries")
                .select(`id, owner_user_id, renter_user_id, product_id`)
                .or(`owner_user_id.eq.${currentUser.id},renter_user_id.eq.${currentUser.id}`)
                .order("created_at", { ascending: false });

            if (inquiriesError) throw inquiriesError;

            if (!inquiries || inquiries.length === 0) {
                setChats([]);
                return;
            }

            const inquiryIds = inquiries.map((i: any) => i.id);

            const { data: chatsData, error: chatsError } = await supabase
                .from("chats")
                .select("*")
                .in("inquiry_id", inquiryIds)
                .order("created_at", { ascending: false });

            if (chatsError) throw chatsError;

            if (!chatsData || chatsData.length === 0) {
                setChats([]);
                return;
            }

            const chatsWithDetails = await Promise.all(
                chatsData.map(async (chat: any) => {
                    const inquiry = inquiries.find((i: any) => i.id === chat.inquiry_id);
                    if (!inquiry) return null;

                    const otherUserId = inquiry.owner_user_id === currentUser.id
                        ? inquiry.renter_user_id
                        : inquiry.owner_user_id;

                    const { data: otherUser } = await supabase
                        .from("users")
                        .select("id, name, phone, avatar_url")
                        .eq("id", otherUserId)
                        .single();

                    let product = null;
                    if (inquiry.product_id) {
                        const { data: productData } = await supabase
                            .from("products")
                            .select("id, title, name, price, product_media, product_id")
                            .eq("id", inquiry.product_id)
                            .single();

                        // Extract first image if available
                        let image = null;
                        if (productData?.product_media && Array.isArray(productData.product_media) && productData.product_media.length > 0) {
                            image = productData.product_media[0].url;
                        }

                        product = { ...productData, image };
                    }

                    const { data: lastMessages } = await supabase
                        .from("messages")
                        .select("message, created_at, sender_user_id, is_read, is_delivered")
                        .eq("chat_id", chat.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const { count: unreadCount } = await supabase
                        .from("messages")
                        .select("*", { count: 'exact', head: true })
                        .eq("chat_id", chat.id)
                        .eq("is_read", false)
                        .neq("sender_user_id", currentUser.id);

                    // Use Ref for current selection AND URL param to avoid closure staleness and refresh flickers
                    const currentId = searchParams.get('id');
                    const isSelected = selectedChatIdRef.current === chat.id || currentId === chat.id;

                    return {
                        ...chat,
                        inquiry: {
                            ...inquiry,
                            product: product || null,
                        },
                        other_user: otherUser || { id: otherUserId, name: "Unknown User" },
                        last_message: lastMessages || undefined,
                        unread_count: (isSelected || lastMessages?.sender_user_id === currentUser.id || lastMessages?.is_read) ? 0 : (unreadCount || 0),
                    };
                })
            );

            const validChats = chatsWithDetails.filter((chat): chat is Chat => chat !== null);

            // Sort by last message time (latest first)
            validChats.sort((a, b) => {
                const dateA = new Date(a.last_message?.created_at || a.created_at).getTime();
                const dateB = new Date(b.last_message?.created_at || b.created_at).getTime();
                return dateB - dateA;
            });

            setChats(validChats);
        } catch (error) {
            console.error("Error loading chats:", error);
            setChats([]);
        }
    };

    const markAsRead = async (chatId: string) => {
        if (!currentUser) return;

        try {
            // Simplest possible update to ensure it works
            const { error } = await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("chat_id", chatId)
                .eq("is_read", false)
                .neq("sender_user_id", currentUser.id);

            if (error) {
                console.error("Supabase Error marking read:", error);
                throw error;
            }

            // Optimistically update local state
            setChats(prev => prev.map(chat =>
                chat.id === chatId ? { ...chat, unread_count: 0 } : chat
            ));
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    // New function to mark messages as delivered
    const markAsDelivered = async (chatId: string) => {
        if (!currentUser) return;

        try {
            const { error } = await supabase
                .from("messages")
                .update({ is_delivered: true })
                .eq("chat_id", chatId)
                .eq("is_delivered", false)
                .neq("sender_user_id", currentUser.id);

            if (error) throw error;
        } catch (error) {
            console.error("Error marking messages as delivered:", error);
        }
    };

    const loadMessages = async (chatId: string, pageNum: number, isInitial: boolean) => {
        if (!isInitial && !hasMoreMessages) return;

        // Don't set global loading if pagination

        try {
            const from = pageNum * MESSAGES_PER_PAGE;
            const to = from + MESSAGES_PER_PAGE - 1;

            const { data: messagesData, error } = await supabase
                .from("messages")
                .select("*, reply_message:reply_to_message_id(*)")
                .eq("chat_id", chatId)
                .order("created_at", { ascending: false }) // Fetch latest first
                .range(from, to);

            if (error) throw error;

            if (messagesData && messagesData.length > 0) {
                // Check if we reached the end
                if (messagesData.length < MESSAGES_PER_PAGE) {
                    setHasMoreMessages(false);
                }

                const uniqueSenderIds = [...new Set([
                    ...messagesData.map((m: any) => m.sender_user_id),
                    ...messagesData.filter((m: any) => m.reply_message).map((m: any) => m.reply_message.sender_user_id)
                ])];
                const { data: sendersData } = await supabase
                    .from("users")
                    .select("id, name, avatar_url")
                    .in("id", uniqueSenderIds);

                const sendersMap = new Map(
                    (sendersData || []).map((s: any) => [s.id, { name: s.name, avatar_url: s.avatar_url }])
                );

                const messagesWithSenders = messagesData.map((message: any) => {
                    const enrichedMessage = {
                        ...message,
                        sender: sendersMap.get(message.sender_user_id) || { name: "Unknown" },
                    };

                    if (message.reply_message) {
                        enrichedMessage.reply_message = {
                            ...message.reply_message,
                            sender: sendersMap.get(message.reply_message.sender_user_id) || { name: "User" }
                        };
                    }

                    return enrichedMessage;
                }).reverse(); // Reverse back to chronological order for display

                setMessages(prev => isInitial ? messagesWithSenders : [...messagesWithSenders, ...prev]);
                setPage(pageNum);

                if (isInitial) {
                    // Scroll is now handled by useLayoutEffect
                    markAsRead(chatId);
                }
            } else {
                if (isInitial) setMessages([]);
                setHasMoreMessages(false);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            if (isInitial) setMessages([]);
        } finally {
        }
    };

    const handleMessageUpdate = (updatedMessage: Message) => {
        setMessages(prev => prev.map(m =>
            m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
        ));

        setChats(prev => prev.map(chat => {
            if (chat.id === updatedMessage.chat_id && chat.last_message && chat.last_message.created_at <= updatedMessage.created_at) {
                // Only update chat list if it matches the last message or is newer
                return {
                    ...chat,
                    last_message: {
                        ...chat.last_message,
                        is_read: updatedMessage.is_read,
                        is_delivered: updatedMessage.is_delivered
                    } as any,
                    unread_count: updatedMessage.is_read ? 0 : chat.unread_count
                };
            }
            return chat;
        }));
    };

    const subscribeToMessages = (chatId: string) => {
        const channel = supabase
            .channel(`chat:${chatId}`, {
                config: {
                    presence: {
                        key: currentUser?.id,
                    },
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chatId}`,
                },
                async (payload: any) => {
                    if (payload.eventType === "INSERT") {
                        const newMessage = payload.new as Message;

                        // If we are the recipient, mark as read/delivered immediately if chat is open
                        if (newMessage.sender_user_id !== currentUser?.id) {
                            markAsRead(chatId);
                            markAsDelivered(chatId);
                        }

                        // Optimistically add message if not already present (should be from sender)
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === newMessage.id)) return prev;

                            // Fetch reply message if exists
                            if (newMessage.reply_to_message_id) {
                                // We might have it in local state
                                const replyMsg = prev.find(m => m.id === newMessage.reply_to_message_id);
                                if (replyMsg) {
                                    const msgWithReply = { ...newMessage, reply_message: replyMsg };
                                    // Also need sender info
                                    const senderName = newMessage.sender_user_id === currentUser?.id ? currentUser?.name : (selectedChat?.other_user?.name || "Loading...");
                                    const senderAvatar = newMessage.sender_user_id === currentUser?.id ? currentUser?.avatar_url : selectedChat?.other_user?.avatar_url;
                                    return [...prev, { ...msgWithReply, sender: { name: senderName || "Unknown", avatar_url: senderAvatar } }];
                                }
                            }

                            const senderName = newMessage.sender_user_id === currentUser?.id
                                ? currentUser?.name
                                : "Loading...";
                            // @ts-ignore
                            const senderAvatar = newMessage.sender_user_id === currentUser?.id ? currentUser?.avatar_url : undefined;
                            return [...prev, { ...newMessage, sender: { name: senderName || "Unknown", avatar_url: senderAvatar } }];
                        });

                        // Refetch to get full details including join
                        if (newMessage.reply_to_message_id) {
                            const { data: freshMsg } = await supabase
                                .from("messages")
                                .select("*, reply_message:reply_to_message_id(*)")
                                .eq("id", newMessage.id)
                                .single();

                            if (freshMsg) {
                                const { data: sendersData } = await supabase.from("users")
                                    .select("id, name, avatar_url")
                                    .in("id", [freshMsg.sender_user_id, freshMsg.reply_message.sender_user_id]);

                                const sendersMap = new Map((sendersData || []).map((s: any) => [s.id, { name: s.name, avatar_url: s.avatar_url }]));

                                const enrichedFresh = {
                                    ...freshMsg,
                                    sender: sendersMap.get(freshMsg.sender_user_id) || { name: "Unknown" },
                                    reply_message: {
                                        ...freshMsg.reply_message,
                                        sender: sendersMap.get(freshMsg.reply_message.sender_user_id) || { name: "User" }
                                    }
                                };
                                setMessages(prev => prev.map(m => m.id === newMessage.id ? enrichedFresh : m));
                            }
                        } else {
                            // Basic sender fetch
                            try {
                                const { data: senderData } = await supabase
                                    .from("users")
                                    .select("id, name, avatar_url")
                                    .eq("id", newMessage.sender_user_id)
                                    .single();

                                const messageWithSender = {
                                    ...newMessage,
                                    sender: senderData || { name: "Unknown" },
                                };

                                setMessages((prev) => {
                                    if (prev.some((m) => m.id === newMessage.id)) {
                                        return prev.map(m => m.id === newMessage.id ? messageWithSender : m);
                                    }
                                    return [...prev, messageWithSender];
                                });
                            } catch (error) {
                                console.error("Error fetching sender info:", error);
                            }
                        }

                    } else if (payload.eventType === "UPDATE") {
                        handleMessageUpdate(payload.new as Message);
                    }
                }
            )
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const otherUsers = Object.keys(state).filter(id => id !== currentUser?.id);

                // Determine if other user is online and typing
                let isOnline = false;
                let isTyping = false;

                otherUsers.forEach(id => {
                    const presences = state[id] as any[];
                    // If they are present in this channel, they are online in this chat context
                    if (presences && presences.length > 0) {
                        isOnline = true;
                        if (presences.some(p => p.typing === true)) {
                            isTyping = true;
                        }
                    }
                });

                setOtherUserOnline(isOnline);
                setOtherUserTyping(isTyping);

                // If they just came online, mark my sent messages as delivered
                if (isOnline) {
                    // This is a bit tricky: we want to mark *their* received messages as delivered? 
                    // No, "I" can't mark "their" messages as delivered.
                    // But if *I* am the one viewing this, and *they* just joined, 
                    // it means they are now receiving my messages.
                    // Actually, the other client should mark as delivered when they join. 
                    // So we call markAsDelivered for myself (currentUser) receiving messages in this chat.
                    markAsDelivered(chatId);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    chatChannelRef.current = channel;
                    // Initial track
                    channel.track({
                        id: currentUser?.id,
                        typing: false,
                        online: true, // I am here
                        last_seen: new Date().toISOString()
                    });
                }
            });
    };

    // Global listener for new messages (to update sidebar when in other chats)
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel('global_messages')
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload: any) => {
                    const newMessage = payload.new as Message;

                    // Check if chat exists in our list
                    const chatExists = chatsRef.current.some(c => c.id === newMessage.chat_id);

                    if (!chatExists) {
                        // New chat! Fetch it immediately
                        await loadSpecificChat(newMessage.chat_id);
                        return; // loadSpecificChat will add it to the list
                    }

                    // Update chat list for ALL incoming messages involving me
                    setChats(prev => prev.map(chat => {
                        if (chat.id === newMessage.chat_id) {
                            // If this chat is currently open, don't increment unread (or if I sent it)
                            const isOpen = selectedChatIdRef.current === chat.id;
                            const isMyMsg = newMessage.sender_user_id === currentUser.id;

                            const newUnreadCount = (isOpen || isMyMsg) ? 0 : (chat.unread_count + 1);

                            return {
                                ...chat,
                                unread_count: newUnreadCount,
                                last_message: {
                                    message: newMessage.message,
                                    created_at: newMessage.created_at,
                                    sender_user_id: newMessage.sender_user_id,
                                    is_read: isOpen || isMyMsg ? true : false,
                                    is_delivered: true
                                } as any
                            };
                        }
                        return chat;
                    }).sort((a, b) => {
                        // Re-sort to put newest at top
                        const dateA = new Date(a.id === newMessage.chat_id ? newMessage.created_at : (a.last_message?.created_at || a.created_at)).getTime();
                        const dateB = new Date(b.id === newMessage.chat_id ? newMessage.created_at : (b.last_message?.created_at || b.created_at)).getTime();
                        return dateB - dateA;
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);



    const unsubscribeFromMessages = () => {
        supabase.removeAllChannels();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat || !currentUser) return;

        setSending(true);
        try {
            // Optimize image
            const { blob } = await convertToWebPOptimized(file);
            const optimizedFile = new File([blob], "image.webp", { type: "image/webp" });

            const fileName = `chat_media/${selectedChat.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(fileName, optimizedFile, {
                    contentType: "image/webp",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("product-images")
                .getPublicUrl(fileName);

            // Send message with media
            const { data: msgData, error: msgError } = await supabase
                .from("messages")
                .insert([{
                    chat_id: selectedChat.id,
                    sender_user_id: currentUser.id,
                    message: "",
                    media_url: publicUrl,
                    media_type: "image",
                    is_read: false,
                    is_delivered: false,
                    reply_to_message_id: replyingTo?.id || null
                }])
                .select("*, reply_message:reply_to_message_id(*)")
                .single();

            if (msgError) throw msgError;

            if (msgData) {
                const newMessage = {
                    ...msgData,
                    sender: { name: currentUser.name || "Me" }
                };

                // Enrich reply message sender from state
                if (replyingTo) {
                    newMessage.reply_message = {
                        ...msgData.reply_message,
                        sender: replyingTo.sender || { name: "User" }
                    };
                }

                setMessages((prev) => [...prev, newMessage]);
            }

            setReplyingTo(null);
            loadChats();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setSending(false);
            e.target.value = '';
        }
    };

    const sendMessage = async (overrideMessage?: string, overrideReplyToId?: string) => {
        const finalMessage = (overrideMessage || messageInput).trim();
        const finalReplyId = overrideReplyToId || replyingTo?.id || null;

        if (!selectedChat || !currentUser || !finalMessage) {
            if (!currentUser) alert("Please log in to send messages");
            return;
        }

        setSending(true);
        try {
            const { data, error } = await supabase
                .from("messages")
                .insert([{
                    chat_id: selectedChat.id,
                    sender_user_id: currentUser.id,
                    message: finalMessage,
                    reply_to_message_id: finalReplyId,
                    is_read: false,
                    is_delivered: false
                }])
                .select("*, reply_message:reply_to_message_id(*)")
                .single();

            if (error) throw error;

            if (!overrideMessage) {
                setMessageInput("");
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'inherit';
                }
            }

            if (!overrideReplyToId) {
                setReplyingTo(null);
            }


            if (data) {
                const newMessage = {
                    ...data,
                    sender: { name: currentUser.name || "Me" }
                };

                // Enrich reply message sender
                const replyContext = overrideReplyToId
                    ? messages.find(m => m.id === overrideReplyToId)
                    : replyingTo;

                if (replyContext) {
                    newMessage.reply_message = {
                        ...data.reply_message,
                        sender: replyContext.sender || { name: "User" }
                    };
                }

                setMessages((prev) => [...prev, newMessage]);
            }
            loadChats();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };



    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatChatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const renderMessageStatus = (msg: Message) => {
        if (msg.sender_user_id !== currentUser?.id) return null; // Only show for my messages

        if (msg.is_read) {
            // Blue Ticks
            return (
                <div className="flex text-blue-500" title="Read">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 12l5 5L22 7" /><path d="M2 12l5 5L22 7" style={{ transform: 'translateX(-6px)' }} /></svg>
                </div>
            );
        } else if (msg.is_delivered) {
            // Gray Ticks
            return (
                <div className="flex text-gray-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 12l5 5L22 7" /><path d="M2 12l5 5L22 7" style={{ transform: 'translateX(-6px)' }} /></svg>
                </div>
            );
        } else {
            // Single Gray Tick
            return (
                <div className="flex text-gray-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
            );
        }
    };

    const renderMessageContent = (msg: Message) => {
        const isSent = msg.sender_user_id === currentUser?.id;

        // Render Replied Context
        const repliedMessage = msg.reply_message;
        const replyContext = repliedMessage ? (
            <div
                className={`mb-1 rounded-lg p-2 text-xs border-l-4 cursor-pointer opacity-90 ${isSent ? "bg-black/5 border-black/30" : "bg-white/50 border-blue-500"}`}
                onClick={(e) => {
                    e.stopPropagation();
                    // Scroll to message functionality could go here
                }}
            >
                <div className="font-bold mb-0.5 text-black/70">
                    {repliedMessage.sender_user_id === currentUser?.id ? "You" : repliedMessage.sender?.name || "User"}
                </div>
                <div className="truncate text-black/60">
                    {repliedMessage.media_url ? "📷 Photo" : (() => {
                        try {
                            if (repliedMessage.message.trim().startsWith('{')) {
                                const parsed = JSON.parse(repliedMessage.message);
                                if (parsed.type === 'inquiry_card') {
                                    return `Inquiry: ${parsed.product.name}`;
                                }
                            }
                        } catch (e) { /* ignore */ }
                        return repliedMessage.message;
                    })()}
                </div>
            </div>
        ) : null;

        if (msg.media_url && msg.media_type === "image") {
            return (
                <div className="flex flex-col">
                    {replyContext}
                    <div className="mb-1 max-w-[300px] overflow-hidden rounded-lg">
                        <img
                            src={msg.media_url}
                            alt="Media"
                            className="w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(msg.media_url, '_blank')}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Expired';
                            }}
                        />
                        {msg.message && <p className="text-[14.5px] leading-[19px] whitespace-pre-wrap break-words mt-1">{msg.message}</p>}
                    </div>
                </div>
            );
        }

        let messageContent = msg.message;
        let isInquiryCard = false;
        let cardData = null;

        try {
            if (msg.message.trim().startsWith('{') && msg.message.trim().endsWith('}')) {
                const parsed = JSON.parse(msg.message);
                if (parsed.type === 'inquiry_card') {
                    isInquiryCard = true;
                    cardData = parsed;
                    messageContent = parsed.text;
                }
            }
        } catch (e) { /* ignore */ }

        if (isInquiryCard && cardData) {
            const isOwner = currentUser?.id === selectedChat?.inquiry?.owner_user_id;

            // Check if rejected - look for "Inquiry Rejected" that REPLIES to this specific message
            const isRejected = messages.some(m =>
                m.message === "Inquiry Rejected" &&
                m.reply_to_message_id === msg.id
            );

            // Check if accepted - look for "Booking Confirmed" or "Inquiry Accepted" that REPLIES to this specific message
            const isAccepted = messages.some(m =>
                (m.message?.startsWith("Booking Confirmed") || m.message === "Inquiry Accepted") &&
                m.reply_to_message_id === msg.id
            );

            // Check if date has passed
            const startDateStr = cardData.dates?.start;
            let isExpired = false;
            if (startDateStr) {
                const startDate = new Date(startDateStr);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (startDate < today) {
                    isExpired = true;
                }
            }

            // Determine the ID to display
            let displayId = cardData.product.productId;

            // Try to get fresh Custom ID from the selected chat if the product matches (UUID check)
            if (selectedChat?.inquiry?.product?.id === (cardData.product.id || cardData.product.db_id)) {
                if (selectedChat.inquiry.product.product_id) {
                    displayId = selectedChat.inquiry.product.product_id;
                }
            }

            return (
                <div className="mb-1 w-full">
                    {replyContext}
                    <div className="flex flex-col gap-2">
                        <a
                            href={`/products/${cardData.product.id || cardData.product.productId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-50 rounded p-2 flex gap-3 border border-gray-200 overflow-hidden w-full max-w-[300px] hover:bg-gray-100 transition-colors cursor-pointer text-inherit no-underline block"
                        >
                            {cardData.product.image && (
                                <div className="w-16 h-20 relative flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                                    <img src={cardData.product.image} alt={cardData.product.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="font-semibold text-sm truncate text-gray-900 leading-tight">{cardData.product.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">ID: {displayId}</p>
                                {cardData.product.price && <p className="text-xs font-medium mt-1 text-gray-900">Price: {cardData.product.price}</p>}
                                {cardData.dates && (
                                    <p className="text-[10px] text-gray-500 mt-1 font-medium">
                                        {cardData.dates.start} - {cardData.dates.end}
                                    </p>
                                )}
                            </div>
                        </a>

                        {isExpired ? (
                            <div className="w-full max-w-[300px] px-3 py-2 text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100 text-center uppercase tracking-widest">
                                Auto-Rejected (Date Passed)
                            </div>
                        ) : isRejected ? (
                            <div className="w-full max-w-[300px] px-3 py-2 text-[11px] font-bold text-red-400 bg-red-50 text-center uppercase tracking-widest">
                                Inquiry Rejected
                            </div>
                        ) : isAccepted ? (
                            <div className="w-full max-w-[300px] px-3 py-2 text-[11px] font-bold text-green-500 bg-green-50 text-center uppercase tracking-widest">
                                Booking Confirmed
                            </div>
                        ) : (
                            isOwner && (
                                <div className="flex gap-2 w-full max-w-[300px]">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            sendMessage("Inquiry Rejected", msg.id);
                                        }}
                                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-none transition-colors uppercase tracking-wider"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.stopPropagation();
                                            const start = cardData.dates.rawStart || "";
                                            const end = cardData.dates.rawEnd || "";
                                            const inquiryId = cardData.inquiryId || "";
                                            const productId = cardData.product.id || cardData.product.productId;

                                            handleOpenBookingModal(productId, inquiryId, msg.id, start, end, cardData.product);
                                        }}
                                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-black rounded-none transition-colors uppercase tracking-wider text-center"
                                    >
                                        ACCEPT
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col min-w-[60px]">
                {replyContext}
                <p className="text-[14.5px] leading-[19px] whitespace-pre-wrap break-words">{messageContent}</p>
            </div>
        );
    };

    // Format name to "First L."
    const formatName = (name: string) => {
        if (!name) return "";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0];
        return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
    };

    // Filter chats based on search
    const filteredChats = chats.filter(chat => {
        const otherName = chat.other_user?.name?.toLowerCase() || "";
        const productName = (chat.inquiry?.product?.title || chat.inquiry?.product?.name || "").toLowerCase();
        const lastMsg = (chat.last_message?.message || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return otherName.includes(query) || productName.includes(query) || lastMsg.includes(query);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen flex flex-col pt-20">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-2xl font-bold mb-4">Please log in to chat</h2>
                    <button onClick={() => setShowLoginPopup(true)} className="bg-black text-white px-6 py-2 rounded-full font-semibold hover:opacity-90">
                        Log In
                    </button>
                </div>
                <Footer />
                <BottomNav />

                <LoginModal
                    isOpen={showLoginPopup}
                    onClose={() => setShowLoginPopup(false)}
                    onLoginSuccess={async () => {
                        await checkLoginStatus();
                        setShowLoginPopup(false);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-[100dvh] bg-white">
            {/* Navbar - Always visible */}
            <div className="block">
                <Navbar />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden w-full relative">
                <div className="flex-1 flex bg-white overflow-hidden h-full">
                    {/* Chat List Sidebar */}
                    <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col h-full md:shrink-0 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                        <div className="bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                        {currentUser?.avatar_url ? (
                                            <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-600 font-semibold">{currentUser?.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-[#111b21]">Chats</h2>
                                </div>
                                {/* <div className="flex gap-3 text-gray-600">
                                    <button title="New Chat"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></button>
                                    <button title="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button>
                                </div> */}
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="bg-[#f0f2f5] text-gray-900 text-sm rounded-none focus:ring-green-500 focus:border-green-500 block w-full pl-10 p-2 outline-none"
                                    placeholder="Search or start new chat"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredChats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                    <p className="text-gray-500">{chats.length === 0 ? "No chats yet" : "No chats found"}</p>
                                </div>
                            ) : (
                                filteredChats.map((chat) => {
                                    const isSelected = selectedChat?.id === chat.id;
                                    const productName = chat.inquiry?.product?.name || chat.inquiry?.product?.title || "Product";

                                    // Smart Unread Logic:
                                    // 1. If chat is selected, 0.
                                    // 2. If I sent the last message, 0 (assumes I've seen the chat).
                                    // 3. Otherwise, use DB count.
                                    const showUnreadBadge = chat.unread_count > 0 &&
                                        chat.id !== selectedChat?.id &&
                                        chat.last_message?.sender_user_id !== currentUser?.id;

                                    return (
                                        <div key={chat.id} onClick={() => handleChatSelect(chat)} className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? "bg-[#f0f2f5]" : "bg-white hover:bg-[#f5f6f6]"}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-lg overflow-hidden shrink-0">
                                                    {chat.inquiry?.product?.image ? (
                                                        <img src={chat.inquiry.product.image} alt="Product" className="w-full h-full object-cover" />
                                                    ) : (
                                                        chat.other_user?.avatar_url ? (
                                                            <img src={chat.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            formatName(chat.other_user?.name || "").charAt(0).toUpperCase()
                                                        )
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-[16px] font-normal text-[#111b21] truncate">{formatUserDisplayName(chat.other_user?.name)}</h3>
                                                        {chat.last_message && <span className={`text-[12px] whitespace-nowrap ml-2 ${showUnreadBadge ? "text-[#667781] font-medium" : "text-[#667781]"}`}>{formatChatTimestamp(chat.last_message.created_at)}</span>}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-0.5">
                                                        <p className={`text-[14px] truncate flex-1 ${showUnreadBadge ? "text-[#111b21] font-medium" : "text-[#667781]"}`}>
                                                            {(() => {
                                                                const msg = chat.last_message?.message;
                                                                if (!msg && chat.last_message?.media_url) return <span className="flex items-center gap-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> Photo</span>;
                                                                if (!msg) return productName;
                                                                try {
                                                                    if (msg.trim().startsWith('{') && msg.trim().endsWith('}')) {
                                                                        const parsed = JSON.parse(msg);
                                                                        if (parsed.type === 'inquiry_card') {
                                                                            return `Inquiry: ${parsed.product.name}`;
                                                                        }
                                                                        return parsed.text || "Sent an attachment";
                                                                    }
                                                                } catch (e) { }
                                                                return msg;
                                                            })()}
                                                        </p>
                                                        {showUnreadBadge && <div className="bg-[#667781] text-white text-[12px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 ml-2 shadow-sm">{chat.unread_count}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat View */}
                    <div className={`flex flex-col relative h-full bg-white min-w-0 ${selectedChat ? 'flex w-full md:w-auto md:flex-1' : 'hidden md:flex md:flex-1'}`}>
                        {/* Background Pattern */}
                        {/* Background Pattern - REMOVED for clean look */}
                        <div className="absolute inset-0 bg-white z-0"></div>

                        {selectedChat ? (
                            <>
                                <div className="bg-[#f0f2f5] px-4 py-2.5 border-b border-gray-300 flex items-center gap-3 relative z-[50] flex-shrink-0">
                                    <button onClick={handleBack} className="md:hidden p-1 -ml-1 text-gray-600 mr-1"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer">
                                        {selectedChat.other_user?.avatar_url ? (
                                            <img src={selectedChat.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-600 font-semibold">{selectedChat.other_user?.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 cursor-pointer flex flex-col justify-center">
                                        <h3 className="text-[16px] font-medium text-[#111b21] leading-tight truncate">
                                            {formatUserDisplayName(selectedChat.other_user?.name)}
                                        </h3>
                                        {otherUserOnline && (
                                            <p className="text-[13px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-[#667781]"></span>
                                                <span>Online</span>
                                            </p>
                                        )}
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 relative">
                                        <button
                                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                                            className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="12" cy="5" r="1"></circle>
                                                <circle cx="12" cy="19" r="1"></circle>
                                            </svg>
                                        </button>

                                        {isMenuOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-[10000] cursor-default"
                                                    onClick={() => setIsMenuOpen(false)}
                                                ></div>
                                                <div className="absolute top-10 right-0 bg-white shadow-lg rounded-none py-1 min-w-[180px] z-[10001] border border-gray-100 overflow-hidden ring-1 ring-black/5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log("Report User clicked");
                                                            setIsReportModalOpen(true);
                                                            // Close menu on next tick to allow event to finish
                                                            setTimeout(() => setIsMenuOpen(false), 0);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-[14px] text-red-600 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3 font-medium cursor-pointer"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                                            <line x1="4" y1="22" x2="4" y2="15" />
                                                        </svg>
                                                        Report User
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-2 relative z-10 scrollbar-thin scrollbar-thumb-gray-300" key={selectedChat.id}>
                                    <div className="space-y-1 pb-2">
                                        {messages.map((message, index) => {
                                            const isSent = message.sender_user_id === currentUser.id;
                                            const showAvatar = index === 0 || messages[index - 1].sender_user_id !== message.sender_user_id;
                                            const showDateSeparator = index === 0 ||
                                                new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString();

                                            return (
                                                <div key={message.id} className="group">
                                                    {showDateSeparator && (
                                                        <div className="flex justify-center my-4 sticky top-2 z-20">
                                                            <span className="bg-gray-100/90 text-gray-500 text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm font-medium border border-gray-100 uppercase tracking-wide">
                                                                {formatDateSeparator(message.created_at)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={`flex items-end ${isSent ? "justify-end" : "justify-start"} mb-1`}>
                                                        {/* Reply Trigger for Mobile - Long Press could be added */}

                                                        <div className={`relative max-w-[85%] md:max-w-[65%] px-2 py-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] group-hover:shadow-md transition-shadow 
                                                            ${index > 0 && messages[index - 1].sender_user_id === message.sender_user_id && !showDateSeparator ? "mt-0.5" : "mt-2"} 
                                                            ${isSent ? "bg-gray-100 text-gray-900 rounded-lg rounded-tr-none" : "bg-white text-gray-900 rounded-lg rounded-tl-none"}`}>

                                                            {/* Reply Context Menu (Visible on Hover) */}
                                                            <button
                                                                onClick={() => setReplyingTo(message)}
                                                                className={`absolute top-0 ${isSent ? "-left-8" : "-right-8"} p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity`}
                                                                title="Reply"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6" /></svg>
                                                            </button>

                                                            <div className="px-1 pt-1">
                                                                {renderMessageContent(message)}
                                                            </div>

                                                            <div className="flex items-center justify-end gap-1 mt-0.5 pl-4 pb-0.5 select-none">
                                                                <span className={`text-[11px] min-w-fit ${isSent ? "text-gray-500" : "text-gray-500"}`}>{formatTime(message.created_at)}</span>
                                                                {isSent && renderMessageStatus(message)}
                                                            </div>

                                                            {/* Tail SVG */}
                                                            {(!messages[index + 1] || messages[index + 1].sender_user_id !== message.sender_user_id) && (
                                                                <div className={`absolute top-0 ${isSent ? "-right-[8px]" : "-left-[8px]"}`}>
                                                                    {isSent ? (
                                                                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid slice" version="1.1"><path fill="#f3f4f6" d="M5.188,0H0v11.193l6.467-8.625C7.526,1.156,6.958,0,5.188,0z"></path></svg>
                                                                    ) : (
                                                                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid slice" version="1.1" style={{ transform: "scaleX(-1)" }}><path fill="#ffffff" d="M5.188,0H0v11.193l6.467-8.625C7.526,1.156,6.958,0,5.188,0z"></path></svg>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    {/* Typing Indicator (Inside Flow) */}
                                    {otherUserTyping && (
                                        <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-sm rounded-2xl px-3 py-2 w-fit ml-4 mb-2">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Reply Preview Banner */}
                                {replyingTo && (
                                    <div className="bg-[#f0f2f5] border-l-4 border-l-gray-400 p-3 mx-4 mt-2 rounded-lg flex justify-between items-center relative z-20 shadow-sm mb-2">
                                        <div className="flex-1 overflow-hidden bg-white/50 p-2 rounded">
                                            <div className="text-sm font-medium text-black mb-0.5">
                                                {replyingTo.sender_user_id === currentUser.id ? "You" : replyingTo.sender?.name}
                                            </div>
                                            <div className="text-xs text-gray-600 truncate">
                                                {replyingTo.media_url ? "📷 Photo" : replyingTo.message}
                                            </div>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full ml-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}

                                {/* Typing Indicator (Above Input Bar) */}


                                {/* Input Area */}
                                <div className="bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 relative z-20 flex-shrink-0">
                                    <label className={`cursor-pointer p-2 text-black hover:bg-gray-200 rounded-full transition-colors ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={sending}
                                        />
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                        </svg>
                                    </label>

                                    <textarea
                                        ref={textareaRef}
                                        value={messageInput}
                                        onChange={(e) => {
                                            setMessageInput(e.target.value);
                                            // Auto-resize logic (simple)
                                            e.target.style.height = 'inherit';
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        placeholder="Type a message"
                                        rows={1}
                                        className="flex-1 bg-white px-6 py-2.5 rounded-none text-[15px] outline-none border-none placeholder-gray-500 max-h-[120px] resize-none overflow-y-auto"
                                    />

                                    <button onClick={() => sendMessage()} disabled={!messageInput.trim() || sending} className={`p-2.5 rounded-full transition-all flex items-center justify-center ${messageInput.trim() ? "text-black hover:bg-gray-200" : "text-black cursor-not-allowed"}`}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[#e5ddd5] opacity-30 z-0" style={{ backgroundImage: "url('https://repo.sourcelink.com/whatsapp-bg.png')", backgroundSize: "300px" }}></div>
                                <div className="z-10 bg-white/80 p-8 rounded-2xl shadow-sm max-w-md text-center mx-4">
                                    <div className="w-20 h-20 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    </div>
                                    <h2 className="text-3xl font-light text-gray-700 mb-4">Anokhi Reet Web</h2>
                                    <p className="text-gray-500 text-sm">Send and receive messages without keeping your phone online.<br />Use Anokhi Reet on up to 4 linked devices and 1 phone.</p>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Modals */}
            <ReportModal
                isOpen={isReportModalOpen}
                userName={selectedChat?.other_user?.name || "User"}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={async (reason, details) => {
                    if (!selectedChat || !currentUser) return;

                    try {
                        const { error } = await supabase
                            .from("reports")
                            .insert({
                                chat_id: selectedChat.id,
                                reporter_user_id: currentUser.id,
                                reported_user_id: selectedChat.other_user?.id,
                                reason,
                                details,
                                status: "new"
                            });

                        if (error) throw error;

                        setIsReportModalOpen(false);
                        setIsSuccessModalOpen(true);
                    } catch (error) {
                        console.error("Error submitting report:", error);
                        alert("Failed to submit report. Please try again.");
                    }
                }}
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Report Submitted"
                message="Thank you for your report. Our team will review this shortly."
            />

            {/* Booking Modal */}
            {showBookingModal && bookingData && (
                <BookingCalendarModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    dateRange={bookingData.dates}
                    onChange={(update: [Date | null, Date | null]) => {
                        // Disable changing dates if accepting an explicit inquiry request
                        if (bookingData.inquiryId) return;
                        setBookingData(prev => prev ? { ...prev, dates: update } : null);
                    }}
                    existingBookedDates={bookingData.existingBookedDates}
                    onConfirm={handleConfirmBooking}
                    readOnly={!!bookingData.inquiryId}
                    productDetails={bookingData.productDetails}
                />
            )}
        </div >
    );
}
