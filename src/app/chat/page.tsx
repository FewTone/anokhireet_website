"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { formatUserDisplayName } from "@/lib/utils";

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
    };
}

interface Message {
    id: string;
    chat_id: string;
    sender_user_id: string;
    message: string;
    created_at: string;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

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
            }
        };
    }, [selectedChat]);

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
                    // Fallback if user record not found but auth exists
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
            // Get all inquiries where user is owner or renter
            const { data: inquiries, error: inquiriesError } = await supabase
                .from("inquiries")
                .select(`
                    id,
                    owner_user_id,
                    renter_user_id,
                    product_id
                `)
                .or(`owner_user_id.eq.${currentUser.id},renter_user_id.eq.${currentUser.id}`)
                .order("created_at", { ascending: false });

            if (inquiriesError) throw inquiriesError;

            if (!inquiries || inquiries.length === 0) {
                setChats([]);
                return;
            }

            const inquiryIds = inquiries.map((i: any) => i.id);

            // Get all chats for these inquiries
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

            // Get the other user, product, and last message for each chat
            const chatsWithDetails = await Promise.all(
                chatsData.map(async (chat: any) => {
                    const inquiry = inquiries.find((i: any) => i.id === chat.inquiry_id);
                    if (!inquiry) return null;

                    const otherUserId =
                        inquiry.owner_user_id === currentUser.id
                            ? inquiry.renter_user_id
                            : inquiry.owner_user_id;

                    // Get other user details
                    const { data: otherUser } = await supabase
                        .from("users")
                        .select("id, name, phone")
                        .eq("id", otherUserId)
                        .single();

                    // Get product details
                    let product = null;
                    if (inquiry.product_id) {
                        const { data: productData } = await supabase
                            .from("products")
                            .select("id, title, name")
                            .eq("id", inquiry.product_id)
                            .single();
                        product = productData;
                    }

                    // Get last message
                    const { data: lastMessages } = await supabase
                        .from("messages")
                        .select("message, created_at")
                        .eq("chat_id", chat.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        ...chat,
                        inquiry: {
                            ...inquiry,
                            product: product || null,
                        },
                        other_user: otherUser || { id: otherUserId, name: "Unknown User" },
                        last_message: lastMessages || undefined,
                    };
                })
            );

            setChats(chatsWithDetails.filter((chat): chat is Chat => chat !== null));
        } catch (error) {
            console.error("Error loading chats:", error);
            setChats([]);
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

            // Fetch sender information for each message
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
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        }
    };

    const subscribeToMessages = (chatId: string) => {
        const channel = supabase
            .channel(`messages:${chatId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chatId}`,
                },
                async (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newMessage = payload.new as Message;

                        // Check if message already exists
                        // Optimistically add message with unknown sender (will update later)
                        // Or just wait for the fetch?
                        // Let's just remove the no-op and let the async fetch handle it, OR add a fallback immediately ?
                        // Better: Check if sender is me, if so add immediately with my details.
                        // Actually, let's just delete the no-op block. The catch block handles the fallback.
                        // But wait! If we delete lines 275-280, the code proceeds to fetch. 
                        // If fetch hangs, user waits.
                        // Best UX: Add immediately. 

                        setMessages((prev) => {
                            if (prev.some((m) => m.id === newMessage.id)) return prev;

                            // If sender is me, I know who I am
                            const senderName = newMessage.sender_user_id === currentUser?.id
                                ? currentUser?.name
                                : "Loading...";

                            return [...prev, { ...newMessage, sender: { name: senderName || "Unknown" } }];
                        });

                        // Fetch sender information for the new message
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
                                // If exists, update it with sender info
                                if (prev.some((m) => m.id === newMessage.id)) {
                                    return prev.map(m => m.id === newMessage.id ? messageWithSender : m);
                                }
                                return [...prev, messageWithSender];
                            });
                        } catch (error) {
                            console.error("Error fetching sender info:", error);
                            // Add message without sender info if fetch fails
                            // Update or add with Unknown if fetch fails
                            setMessages((prev) => {
                                const fallbackMessage = { ...newMessage, sender: { name: "Unknown" } };
                                if (prev.some((m) => m.id === newMessage.id)) {
                                    return prev.map(m => m.id === newMessage.id ? fallbackMessage : m);
                                }
                                return [...prev, fallbackMessage];
                            });
                        }
                    }
                }
            )
            .subscribe();

        return channel;
    };

    const unsubscribeFromMessages = () => {
        supabase.removeAllChannels();
    };

    const sendMessage = async () => {
        if (!selectedChat || !currentUser || !messageInput.trim()) {
            if (!currentUser) {
                alert("Please log in to send messages");
            }
            return;
        }

        setSending(true);

        try {
            const { data, error } = await supabase
                .from("messages")
                .insert([
                    {
                        chat_id: selectedChat.id,
                        sender_user_id: currentUser.id,
                        message: messageInput.trim(),
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            setMessageInput("");

            // Manually add message to UI immediately for better responsiveness
            if (data) {
                const newMessage = {
                    ...data,
                    sender: { name: currentUser.name || "Me" }
                };
                setMessages((prev) => [...prev, newMessage]);
            }

            // Reload chats to update last message
            loadChats();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const renderMessageContent = (msg: Message) => {
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
        } catch (e) {
            // Not JSON
        }

        if (isInquiryCard && cardData) {
            return (
                <div className="mb-1 w-full">
                    <div className="bg-gray-50 rounded p-2 mb-2 flex gap-3 border border-gray-200 overflow-hidden w-full max-w-[300px]">
                        {cardData.product.image && (
                            <div className="w-16 h-20 relative flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                                { /* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={cardData.product.image}
                                    alt={cardData.product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-semibold text-sm truncate text-gray-900 leading-tight">{cardData.product.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                {cardData.dates.start} - {cardData.dates.end}
                            </p>

                            {/* Product ID Display */}
                            <p className="text-[10px] text-gray-400 mt-0.5" title="Product ID">
                                ID: {cardData.product.productId}
                            </p>

                            {cardData.product.price && (
                                <p className="text-xs font-medium mt-1 text-gray-900">Price: {cardData.product.price}</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {messageContent}
            </p>
        );
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="fixed inset-0 top-[95px] md:top-[70px] bg-gray-100">
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <style jsx global>{`
                @media (max-width: 767px) {
                    body.chat-selected nav .md\\:hidden > div:last-child form {
                        display: none !important;
                    }
                }
            `}</style>
            <main className="fixed inset-0 top-[95px] md:top-[70px] bg-gray-100">
                <div className="h-full w-full">
                    <div className="flex h-full bg-white overflow-hidden relative">
                        {/* Chat List Sidebar */}
                        <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                            {/* Chat List */}
                            <div className="flex-1 overflow-y-auto bg-white">
                                {chats.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                        <svg
                                            width="64"
                                            height="64"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-gray-300 mb-4"
                                        >
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                        </svg>
                                        <p className="text-gray-500 text-sm">No chats yet</p>
                                        <p className="text-gray-400 text-xs mt-1">Start a conversation by making an inquiry</p>
                                    </div>
                                ) : (
                                    <div>
                                        {chats.map((chat, index) => {
                                            const isSelected = selectedChat?.id === chat.id;
                                            const isFirstItem = index === 0;
                                            const productName =
                                                chat.inquiry?.product?.title ||
                                                chat.inquiry?.product?.name ||
                                                "Product";

                                            return (
                                                <div
                                                    key={chat.id}
                                                    onClick={() => setSelectedChat(chat)}
                                                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${isSelected
                                                        ? "bg-[#e9edef]"
                                                        : "bg-white hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center flex-shrink-0">
                                                            <span className="text-white font-semibold text-lg">
                                                                {chat.other_user?.name?.charAt(0).toUpperCase() || "U"}
                                                            </span>
                                                        </div>

                                                        {/* Chat Info */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Mobile: Stack name and timestamp vertically, Desktop: Side by side */}
                                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                                                                <h3 className="text-base md:text-sm font-semibold text-gray-800 break-words md:truncate">
                                                                    {formatUserDisplayName(chat.other_user?.name) || "Unknown User"}
                                                                </h3>
                                                                {chat.last_message && (
                                                                    <span className="text-xs text-gray-500 md:ml-2 md:flex-shrink-0 mt-0.5 md:mt-0">
                                                                        {formatTime(chat.last_message.created_at)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate mb-1">
                                                                {productName}
                                                            </p>
                                                            {chat.last_message && (
                                                                <p className="text-sm text-gray-600 truncate">
                                                                    {(() => {
                                                                        const msg = chat.last_message.message.trim();
                                                                        if (msg.startsWith('{') && msg.endsWith('}')) {
                                                                            try {
                                                                                const parsed = JSON.parse(msg);
                                                                                if (parsed.type === 'inquiry_card') {
                                                                                    return `Inquiry: ${parsed.product.name}`;
                                                                                }
                                                                            } catch (e) {
                                                                                // ignore
                                                                            }
                                                                        }
                                                                        return msg;
                                                                    })()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat View */}
                        <div className="hidden md:flex md:w-2/3 flex-col">
                            {selectedChat ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="bg-[#f0f2f5] px-6 py-3 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center">
                                                <span className="text-white font-semibold">
                                                    {selectedChat.other_user?.name?.charAt(0).toUpperCase() || "U"}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-800">
                                                    {selectedChat.other_user?.name || "Unknown User"}
                                                </h3>
                                                <p className="text-xs text-gray-500">Online</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div
                                        ref={messagesContainerRef}
                                        className="flex-1 overflow-y-auto bg-[#efeae2] p-4"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23efeae2'/%3E%3Cpath d='M0 0l50 50L100 0v50H0z' fill='%23dddad5' opacity='0.4'/%3E%3C/svg%3E")`,
                                            backgroundSize: "100px 100px",
                                        }}
                                    >
                                        {messages.length === 0 ? (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                                            </div>
                                        ) : (
                                            <>
                                                {messages.map((message, index) => {
                                                    const isSent = message.sender_user_id === currentUser?.id;
                                                    const showAvatar = index === 0 || messages[index - 1].sender_user_id !== message.sender_user_id;
                                                    const showTime = index === messages.length - 1 ||
                                                        new Date(message.created_at).getTime() - new Date(messages[index + 1].created_at).getTime() > 300000; // 5 minutes

                                                    return (
                                                        <div key={message.id} className={`flex mb-1 ${isSent ? "justify-end" : "justify-start"}`}>
                                                            <div className={`flex items-end gap-2 max-w-[70%] ${isSent ? "flex-row-reverse" : "flex-row"}`}>
                                                                {/* Avatar for received messages */}
                                                                {!isSent && (
                                                                    <div className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ${showAvatar ? "visible" : "invisible"}`}>
                                                                        <span className="text-gray-600 text-xs font-semibold">
                                                                            {message.sender?.name?.charAt(0).toUpperCase() || "U"}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Message Bubble */}
                                                                <div className={`rounded-lg px-3 py-2 ${isSent
                                                                    ? "bg-[#dcf8c6] rounded-tr-none"
                                                                    : "bg-white rounded-tl-none"
                                                                    }`}>
                                                                    {!isSent && showAvatar && (
                                                                        <p className="text-xs font-semibold text-[#128c7e] mb-1">
                                                                            {message.sender?.name || "Unknown"}
                                                                        </p>
                                                                    )}
                                                                    {renderMessageContent(message)}
                                                                    {showTime && (
                                                                        <p className={`text-xs mt-1 ${isSent ? "text-gray-500" : "text-gray-400"}`}>
                                                                            {formatTime(message.created_at)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    {/* Input Area */}
                                    <div className="bg-[#f0f2f5] px-4 py-3 border-t border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-gray-400 bg-white text-sm"
                                                disabled={sending}
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={!messageInput.trim() || sending}
                                                className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center text-white hover:bg-[#20ba5a] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {sending ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                ) : (
                                                    <svg
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-[#efeae2]">
                                    <div className="text-center">
                                        <svg
                                            width="96"
                                            height="96"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-gray-300 mx-auto mb-4"
                                        >
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                        </svg>
                                        <p className="text-gray-500 text-lg">Select a chat to start messaging</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Chat View - Show when chat is selected */}
                        {selectedChat && (
                            <div className="md:hidden fixed inset-0 top-[95px] bottom-0 bg-white z-20 flex flex-col">
                                {/* Mobile Header */}
                                <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 text-white">
                                    <button
                                        onClick={() => setSelectedChat(null)}
                                        className="mr-2"
                                    >
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="15 18 9 12 15 6"></polyline>
                                        </svg>
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                        <span className="text-[#075e54] font-semibold">
                                            {selectedChat.other_user?.name?.charAt(0).toUpperCase() || "U"}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold">
                                            {formatUserDisplayName(selectedChat.other_user?.name) || "Unknown User"}
                                        </h3>
                                        <p className="text-xs text-white/80">Online</p>
                                    </div>
                                </div>

                                {/* Mobile Messages Area */}
                                <div
                                    ref={messagesContainerRef}
                                    className="flex-1 overflow-y-auto bg-[#efeae2] p-4"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23efeae2'/%3E%3Cpath d='M0 0l50 50L100 0v50H0z' fill='%23dddad5' opacity='0.4'/%3E%3C/svg%3E")`,
                                        backgroundSize: "100px 100px",
                                    }}
                                >
                                    {messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message, index) => {
                                                const isSent = message.sender_user_id === currentUser?.id;
                                                const showAvatar = index === 0 || messages[index - 1].sender_user_id !== message.sender_user_id;
                                                const showTime = index === messages.length - 1 ||
                                                    new Date(message.created_at).getTime() - new Date(messages[index + 1].created_at).getTime() > 300000;

                                                return (
                                                    <div key={message.id} className={`flex mb-1 ${isSent ? "justify-end" : "justify-start"}`}>
                                                        <div className={`flex items-end gap-2 max-w-[75%] ${isSent ? "flex-row-reverse" : "flex-row"}`}>
                                                            {!isSent && (
                                                                <div className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ${showAvatar ? "visible" : "invisible"}`}>
                                                                    <span className="text-gray-600 text-xs font-semibold">
                                                                        {message.sender?.name?.charAt(0).toUpperCase() || "U"}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className={`rounded-lg px-3 py-2 ${isSent
                                                                ? "bg-[#dcf8c6] rounded-tr-none"
                                                                : "bg-white rounded-tl-none"
                                                                }`}>
                                                                {!isSent && showAvatar && (
                                                                    <p className="text-xs font-semibold text-[#128c7e] mb-1">
                                                                        {formatUserDisplayName(message.sender?.name) || "Unknown"}
                                                                    </p>
                                                                )}
                                                                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                                                    {message.message}
                                                                </p>
                                                                {showTime && (
                                                                    <p className={`text-xs mt-1 ${isSent ? "text-gray-500" : "text-gray-400"}`}>
                                                                        {formatTime(message.created_at)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Mobile Input Area */}
                                <div className="bg-[#f0f2f5] px-3 py-2 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-gray-400 bg-white text-sm"
                                            disabled={sending}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!messageInput.trim() || sending}
                                            className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center text-white hover:bg-[#20ba5a] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {sending ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            ) : (
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
