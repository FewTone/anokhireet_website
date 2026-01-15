"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName } from "@/lib/utils";
import { convertToWebPOptimized } from "@/lib/imageUtils";

interface Chat {
    id: string;
    inquiry_id: string;
    created_at: string;
    inquiry?: {
        product?: {
            title?: string;
            name?: string;
        };
        owner_user_id: string;
        renter_user_id: string;
    };
    other_user?: {
        id: string;
        name: string;
        phone?: string;
    };
    last_message?: {
        message: string;
        created_at: string;
        sender_user_id: string;
        is_read: boolean;
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
    read_at?: string;
    media_url?: string;
    media_type?: string;
    sender?: {
        name: string;
    };
}

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const chatChannelRef = useRef<any>(null);

    // Check login status and load chats
    useEffect(() => {
        checkLoginStatus();
    }, []);

    // Load chats when user is loaded
    useEffect(() => {
        if (currentUser) {
            loadChats();
        }
    }, [currentUser]);

    // Auto-select chat from URL parameter
    useEffect(() => {
        const chatId = searchParams.get('id');
        if (chatId && chats.length > 0 && !selectedChat) {
            const chatToSelect = chats.find(c => c.id === chatId);
            if (chatToSelect) {
                setSelectedChat(chatToSelect);
            }
        }
    }, [chats, searchParams, selectedChat]);

    // Load messages when chat is selected
    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat.id);
            subscribeToMessages(selectedChat.id);
        }

        return () => {
            if (selectedChat) {
                unsubscribeFromMessages();
                if (chatChannelRef.current) {
                    chatChannelRef.current.unsubscribe();
                }
            }
        };
    }, [selectedChat]);

    // Handle typing status broadcast
    useEffect(() => {
        if (!selectedChat || !currentUser || !chatChannelRef.current) return;

        const broadcastTyping = async (status: boolean) => {
            if (chatChannelRef.current) {
                await chatChannelRef.current.track({
                    id: currentUser.id,
                    typing: status,
                    last_seen: new Date().toISOString()
                });
            }
        };

        if (messageInput.trim().length > 0) {
            if (!isTyping) {
                setIsTyping(true);
                broadcastTyping(true);
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                broadcastTyping(false);
            }, 3000);
        } else if (isTyping) {
            setIsTyping(false);
            broadcastTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [messageInput, selectedChat, currentUser]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Hide search bar in mobile when chat is selected
    useEffect(() => {
        if (selectedChat) {
            document.body.classList.add('chat-selected');
        } else {
            document.body.classList.remove('chat-selected');
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
                    .select("id, name, phone")
                    .eq("auth_user_id", session.user.id)
                    .single();

                if (userData && !error) {
                    setCurrentUser({ id: userData.id, name: userData.name || "User" });
                } else {
                    setCurrentUser({ id: session.user.id, name: "User" });
                }
            } else {
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            setCurrentUser(null);
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
                        .select("id, name, phone")
                        .eq("id", otherUserId)
                        .single();

                    let product = null;
                    if (inquiry.product_id) {
                        const { data: productData } = await supabase
                            .from("products")
                            .select("id, title, name")
                            .eq("id", inquiry.product_id)
                            .single();
                        product = productData;
                    }

                    const { data: lastMessages } = await supabase
                        .from("messages")
                        .select("message, created_at, sender_user_id, is_read")
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

                    return {
                        ...chat,
                        inquiry: {
                            ...inquiry,
                            product: product || null,
                        },
                        other_user: otherUser || { id: otherUserId, name: "Unknown User" },
                        last_message: lastMessages || undefined,
                        unread_count: unreadCount || 0,
                    };
                })
            );

            setChats(chatsWithDetails.filter((chat): chat is Chat => chat !== null));
        } catch (error) {
            console.error("Error loading chats:", error);
            setChats([]);
        }
    };

    const markAsRead = async (chatId: string) => {
        if (!currentUser) return;

        try {
            const { error } = await supabase
                .from("messages")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("chat_id", chatId)
                .eq("is_read", false)
                .neq("sender_user_id", currentUser.id);

            if (error) throw error;

            setChats(prev => prev.map(chat =>
                chat.id === chatId ? { ...chat, unread_count: 0 } : chat
            ));
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    const loadMessages = async (chatId: string) => {
        try {
            const { data: messagesData, error } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", chatId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            if (messagesData && messagesData.length > 0) {
                const uniqueSenderIds = [...new Set(messagesData.map((m: any) => m.sender_user_id))];
                const { data: sendersData } = await supabase
                    .from("users")
                    .select("id, name")
                    .in("id", uniqueSenderIds);

                const sendersMap = new Map(
                    (sendersData || []).map((s: any) => [s.id, { name: s.name }])
                );

                const messagesWithSenders = messagesData.map((message: any) => ({
                    ...message,
                    sender: sendersMap.get(message.sender_user_id) || { name: "Unknown" },
                }));

                setMessages(messagesWithSenders);
                markAsRead(chatId);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        }
    };

    const handleMessageRead = (chatId: string, messageId: string) => {
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, is_read: true } : m
        ));

        setChats(prev => prev.map(chat => {
            if (chat.id === chatId && chat.last_message) {
                return {
                    ...chat,
                    last_message: { ...chat.last_message, is_read: true }
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

                        if (newMessage.sender_user_id !== currentUser?.id) {
                            markAsRead(chatId);
                        }

                        setMessages((prev) => {
                            if (prev.some((m) => m.id === newMessage.id)) return prev;
                            const senderName = newMessage.sender_user_id === currentUser?.id
                                ? currentUser?.name
                                : "Loading...";
                            return [...prev, { ...newMessage, sender: { name: senderName || "Unknown" } }];
                        });

                        try {
                            const { data: senderData } = await supabase
                                .from("users")
                                .select("id, name")
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
                    } else if (payload.eventType === "UPDATE") {
                        const updatedMessage = payload.new as Message;
                        if (updatedMessage.is_read) {
                            handleMessageRead(chatId, updatedMessage.id);
                        }
                    }
                }
            )
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const otherUsers = Object.keys(state).filter(id => id !== currentUser?.id);
                // Check if any presence state for other users has typing: true
                const isAnyTyping = otherUsers.some(id => {
                    const presences = state[id] as any[];
                    return presences.some(p => p.typing === true);
                });
                setOtherUserTyping(isAnyTyping);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Start tracking ONLY after subscribed
                    chatChannelRef.current = channel;
                }
            });

        return channel;
    };

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
                    is_read: false
                }])
                .select()
                .single();

            if (msgError) throw msgError;

            if (msgData) {
                const newMessage = { ...msgData, sender: { name: currentUser.name || "Me" } };
                setMessages((prev) => [...prev, newMessage]);
            }
            loadChats();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setSending(false);
            // Clear input
            e.target.value = '';
        }
    };

    const sendMessage = async () => {
        if (!selectedChat || !currentUser || !messageInput.trim()) {
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
                    message: messageInput.trim(),
                }])
                .select()
                .single();

            if (error) throw error;
            setMessageInput("");

            if (data) {
                const newMessage = { ...data, sender: { name: currentUser.name || "Me" } };
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    const renderMessageContent = (msg: Message) => {
        if (msg.media_url && msg.media_type === "image") {
            return (
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
            return (
                <div className="mb-1 w-full">
                    <div className="bg-gray-50 rounded p-2 mb-2 flex gap-3 border border-gray-200 overflow-hidden w-full max-w-[300px]">
                        {cardData.product.image && (
                            <div className="w-16 h-20 relative flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                                <img src={cardData.product.image} alt={cardData.product.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-semibold text-sm truncate text-gray-900 leading-tight">{cardData.product.name}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">ID: {cardData.product.productId}</p>
                            {cardData.product.price && <p className="text-xs font-medium mt-1 text-gray-900">Price: {cardData.product.price}</p>}
                        </div>
                    </div>
                </div>
            );
        }

        return <p className="text-[14.5px] leading-[19px] whitespace-pre-wrap break-words">{messageContent}</p>;
    };

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
                    <button onClick={() => router.push("/profile")} className="bg-black text-white px-6 py-2 rounded-full font-semibold hover:opacity-90">
                        Log In
                    </button>
                </div>
                <Footer />
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-white">
            <Navbar />
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <div className="flex-1 flex bg-white overflow-hidden">
                    {/* Chat List Sidebar */}
                    <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-semibold">{currentUser.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <h2 className="text-xl font-bold text-[#111b21]">Chats</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {chats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                    <p className="text-gray-500">No chats yet</p>
                                </div>
                            ) : (
                                chats.map((chat) => {
                                    const isSelected = selectedChat?.id === chat.id;
                                    const productName = chat.inquiry?.product?.title || chat.inquiry?.product?.name || "Product";
                                    return (
                                        <div key={chat.id} onClick={() => setSelectedChat(chat)} className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? "bg-gray-50" : "bg-white hover:bg-gray-50"}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-semibold text-lg">{chat.other_user?.name?.charAt(0).toUpperCase()}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-[15px] font-semibold text-gray-900 truncate">{chat.other_user?.name}</h3>
                                                        {chat.last_message && <span className={`text-[12px] ${chat.unread_count > 0 ? "text-black" : "text-gray-500"}`}>{formatChatTimestamp(chat.last_message.created_at)}</span>}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[13.5px] text-gray-500 truncate">
                                                            {(() => {
                                                                const msg = chat.last_message?.message;
                                                                if (!msg) return productName;
                                                                try {
                                                                    if (msg.trim().startsWith('{') && msg.trim().endsWith('}')) {
                                                                        const parsed = JSON.parse(msg);
                                                                        if (parsed.type === 'inquiry_card') {
                                                                            return `Inquiry for ${parsed.product.name}`;
                                                                        }
                                                                        return parsed.text || "Sent an attachment";
                                                                    }
                                                                } catch (e) { }
                                                                return msg;
                                                            })()}
                                                        </p>
                                                        {chat.unread_count > 0 && <div className="bg-black text-white text-[11px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1">{chat.unread_count}</div>}
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
                    <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
                        {selectedChat ? (
                            <>
                                <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                                    <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 -ml-2 text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>
                                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold">{selectedChat.other_user?.name?.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h3 className="text-[15px] font-semibold text-gray-900">{selectedChat.other_user?.name}</h3>
                                        <p className="text-[12px] text-gray-500">
                                            {otherUserTyping ? (
                                                <span className="text-black font-medium animate-pulse">typing...</span>
                                            ) : "Online"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 relative">
                                    <div className="space-y-1">
                                        {messages.map((message, index) => {
                                            const isSent = message.sender_user_id === currentUser.id;
                                            const showAvatar = index === 0 || messages[index - 1].sender_user_id !== message.sender_user_id;
                                            const showDateSeparator = index === 0 ||
                                                new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString();

                                            return (
                                                <div key={message.id}>
                                                    {showDateSeparator && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="bg-[#d1d7db] text-[#54656f] text-[12.5px] px-3 py-1 rounded-md shadow-sm uppercase font-medium">
                                                                {formatDateSeparator(message.created_at)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                                                        <div className={`relative min-w-[100px] max-w-[85%] md:max-w-[65%] px-4 py-2 shadow-sm ${index > 0 && messages[index - 1].sender_user_id === message.sender_user_id && !showDateSeparator ? "mt-0.5" : "mt-1"} ${isSent ? "bg-gray-100 text-gray-900 rounded-2xl rounded-tr-sm" : "bg-white border border-gray-100 rounded-2xl rounded-tl-sm"}`}>
                                                            {renderMessageContent(message)}
                                                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                                                <span className="text-[10px] text-gray-500 uppercase">{formatTime(message.created_at)}</span>
                                                                {isSent && (
                                                                    <span className={message.is_read ? "text-blue-500" : "text-gray-400"}>
                                                                        {message.is_read ? (
                                                                            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M10.0001 0.5L6.00006 4.5L4.50006 3L3.50006 4L6.00006 6.5L11.0001 1.5L10.0001 0.5Z" fill="currentColor" />
                                                                                <path d="M15.0001 0.5L7.50006 8L4.50006 5L3.50006 6L7.50006 10L16.0001 1.5L15.0001 0.5Z" fill="currentColor" />
                                                                                <path d="M6.00006 6.5L3.50006 4L2.00006 5.5L6.00006 9.5L6.00006 6.5Z" fill="currentColor" />
                                                                                <path d="M6.00006 6.5L3.50006 4L2.00006 5.5L6.00006 9.5L6.00006 6.5Z" fill="currentColor" />
                                                                                <path d="M1.35339 6.146L0.646729 6.853L5.07006 11.276L6.01673 10.33L1.35339 6.146Z" fill="currentColor" />
                                                                            </svg>
                                                                        ) : (
                                                                            <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M11.0001 0.5L3.50006 8L0.500061 5L-0.499939 6L3.50006 10L12.0001 1.5L11.0001 0.5Z" fill="currentColor" />
                                                                            </svg>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                                <div className="bg-white p-3 flex items-center gap-3 border-t border-gray-200">
                                    <label className={`cursor-pointer p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={sending}
                                        />
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.19 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                    </label>
                                    <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="flex-1 bg-gray-100 px-4 py-2 rounded-full text-[15px] outline-none border-none shadow-sm focus:ring-1 focus:ring-black" />
                                    <button onClick={sendMessage} disabled={!messageInput.trim() || sending} className="bg-black text-white p-2.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-all">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Chats</h2>
                                <p className="text-gray-500 text-sm max-w-[300px] text-center">Select a conversation from the sidebar to start messaging.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
