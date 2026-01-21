"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTotalUnreadCount } from "@/hooks/useTotalUnreadCount";

export default function Navbar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const isHomePage = pathname === "/";
    const [searchQuery, setSearchQuery] = useState("");
    const unreadCount = useTotalUnreadCount();


    // Initialize search query from URL if on products page
    useEffect(() => {
        if (typeof window !== "undefined") {
            const path = window.location.pathname;
            if (path === "/products") {
                const query = searchParams?.get("search") || "";
                setSearchQuery(query);
            }
        }
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push("/products");
        }
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch(e);
        }
    };

    return (
        <>
            <nav
                className={`
                    left-0 w-full z-[1000] transition-all duration-300
                    ${isHomePage
                        ? 'md:sticky md:top-0 absolute bg-transparent shadow-none border-none md:bg-white md:shadow-sm md:border-b md:border-gray-100'
                        : 'md:sticky md:top-0 relative bg-white shadow-sm border-b border-gray-100'
                    }
                `}
            >
                {/* Desktop Layout */}
                <div className="hidden md:flex h-[70px] px-4 items-center justify-between relative">
                    {/* Left Section: Profile, Products, Wishlist */}
                    <div className="flex flex-1 items-center gap-6">
                        <Link href="/?login=true" className="text-black hover:opacity-70 transition-opacity" title="My Profile">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </Link>
                        <Link href="/user?view=my-products" className="text-black hover:opacity-70 transition-opacity" title="My Products">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                        </Link>
                        <Link href="/user?view=wishlist" className="text-black hover:opacity-70 transition-opacity" title="Wishlist">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </Link>
                    </div>

                    {/* Center: Logo */}
                    <div className="flex flex-1 justify-center items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/Anokhi reet Logo.svg"
                                alt="Anokhi Reet Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10 object-contain cursor-pointer brightness-0"
                                priority
                                suppressHydrationWarning
                            />
                            <Image
                                src="/anokhi-reet.svg"
                                alt="Anokhi Reet"
                                width={120}
                                height={18}
                                className="h-4 w-auto object-contain cursor-pointer brightness-0"
                                style={{ width: "auto" }}
                                priority
                                suppressHydrationWarning
                            />
                        </Link>
                    </div>

                    {/* Right: Search & Chat */}
                    <div className="flex flex-1 justify-end items-center gap-4 relative">
                        {!pathname?.startsWith("/chat") && (
                            <form onSubmit={handleSearch} className="flex w-full max-w-[300px] h-[40px] border border-[#ccc] text-sm items-center pl-2 bg-white">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-gray-500">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    type="search"
                                    placeholder="Search by Product ID or Name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className="h-full flex-1 text-[12px] font-light pl-2 border-none outline-none bg-transparent min-w-0"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="p-2 text-gray-500 hover:text-black transition-colors focus:outline-none"
                                        aria-label="Clear search"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                )}
                                <button type="submit" className="hidden" aria-label="Search" />
                            </form>
                        )}

                        <Link href="/chat" className="bg-transparent border-none cursor-pointer relative">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-black"
                            >
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[#25D366] text-white text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 border border-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Mobile Layout */}
                {/* Mobile Layout */}
                {/* Mobile Layout */}
                <div className={`md:hidden px-4 transition-all duration-300 ${isHomePage
                    ? "bg-gradient-to-b from-black via-black to-transparent pt-4 pb-12"
                    : "bg-white border-b border-gray-100 pt-3 pb-2"
                    }`}>
                    <div className="flex flex-col gap-3 w-full">
                        {/* Top Row: Logo - ALWAYS VISIBLE */}
                        <div className="flex justify-center items-center">
                            <Link href="/" className="flex items-center gap-2">
                                <Image
                                    src="/Anokhi reet Logo.svg"
                                    alt="Anokhi Reet Logo"
                                    width={40}
                                    height={40}
                                    className={`w-10 h-10 object-contain cursor-pointer ${isHomePage ? 'grayscale brightness-0 invert' : 'brightness-0'}`}
                                    priority
                                    suppressHydrationWarning
                                />
                                <Image
                                    src="/anokhi-reet.svg"
                                    alt="Anokhi Reet"
                                    width={120}
                                    height={18}
                                    className={`h-4 w-auto object-contain cursor-pointer ${isHomePage ? 'grayscale brightness-0 invert' : 'brightness-0'}`}
                                    style={{ width: "auto" }}
                                    priority
                                    suppressHydrationWarning
                                />
                            </Link>
                        </div>

                        {/* Bottom Row: Search & Chat - HIDDEN IN CHAT */}
                        {!pathname?.startsWith("/chat") && (
                            <div className="flex items-center gap-3 w-full">
                                <form onSubmit={handleSearch} className={`flex flex-1 h-[40px] border text-sm items-center pl-3 rounded-none ${isHomePage ? 'border-white/30 backdrop-blur-sm bg-white/10' : 'border-[#ccc] bg-white'}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`opacity-70 ${isHomePage ? 'text-white' : 'text-gray-500'}`}>
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input
                                        type="search"
                                        placeholder="Search by Product ID or Name"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleSearchKeyPress}
                                        className={`h-full flex-1 text-[12px] font-light pl-3 border-none outline-none bg-transparent min-w-0 ${isHomePage ? 'text-white placeholder-white/70' : 'text-black placeholder-gray-400'}`}
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className={`p-2 transition-colors focus:outline-none ${isHomePage ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                            aria-label="Clear search"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                    <button type="submit" className="hidden" aria-label="Search" />
                                </form>
                                <Link href="/chat" className={`flex-shrink-0 p-2 relative ${isHomePage ? 'text-white' : 'text-black'}`}>
                                    <svg
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-0.5 bg-[#25D366] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 border border-white">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
