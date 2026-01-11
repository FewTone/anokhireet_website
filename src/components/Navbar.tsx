"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");

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
            <nav className="absolute md:fixed top-0 left-0 w-full z-[1000] bg-transparent md:bg-white shadow-none md:shadow-[0.1rem_0.1rem_0.2rem_rgb(119,118,118)] transition-all duration-300">
                {/* Desktop Layout */}
                <div className="hidden md:flex h-[70px] px-4 items-center justify-between">
                    {/* Left Section: My Products and Wish List */}
                    <div className="flex flex-1 items-center gap-6">
                        <Link
                            href="/my-products"
                            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <span className="text-sm font-medium">My Products</span>
                        </Link>
                        <Link
                            href="/wishlist"
                            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span className="text-sm font-medium">Wish List</span>
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
                                className="w-12 h-12 object-contain cursor-pointer brightness-0"
                                priority
                                suppressHydrationWarning
                            />
                            <Image
                                src="/anokhi-reet.svg"
                                alt="Anokhi Reet"
                                width={120}
                                height={18}
                                className="h-4.5 w-auto object-contain cursor-pointer brightness-0"
                                priority
                                suppressHydrationWarning
                            />
                        </Link>
                    </div>

                    {/* Right: Search & Profile */}
                    <div className="flex flex-1 justify-end items-center gap-4">
                        {!pathname?.startsWith("/chat") && (
                            <form onSubmit={handleSearch} className="flex max-w-[250px] h-[38px] border border-[#ccc] rounded text-sm items-center pl-2 bg-white">
                                <Image
                                    src="https://cdn-icons-png.flaticon.com/128/54/54481.png"
                                    alt="search"
                                    width={18}
                                    height={18}
                                    className="opacity-60"
                                    suppressHydrationWarning
                                />
                                <input
                                    type="search"
                                    placeholder="Search by Product ID or Name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className="h-full w-full text-[0.9rem] pl-2 border-none outline-none bg-transparent"
                                />
                                <button type="submit" className="hidden" aria-label="Search" />
                            </form>
                        )}
                        <button className="bg-transparent border-none cursor-pointer">
                            <Link href="/profile">
                                <Image
                                    src="https://cdn-icons-png.flaticon.com/128/9308/9308008.png"
                                    alt="profile"
                                    width={24}
                                    height={24}
                                    suppressHydrationWarning
                                />
                            </Link>
                        </button>
                        {!pathname?.startsWith("/chat") && (
                            <Link href="/chat" className="bg-transparent border-none cursor-pointer">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-black"
                                >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden pt-4 pb-12 px-4 bg-gradient-to-b from-black to-transparent">
                    {/* Search Bar and Chat Button - Same row */}
                    {!pathname?.startsWith("/chat") && (
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSearch} className="flex flex-1 h-[42px] border border-white/30 rounded backdrop-blur-sm bg-white/10 text-sm items-center pl-3">
                                <Image
                                    src="https://cdn-icons-png.flaticon.com/128/54/54481.png"
                                    alt="search"
                                    width={18}
                                    height={18}
                                    className="opacity-70 invert"
                                    suppressHydrationWarning
                                />
                                <input
                                    type="search"
                                    placeholder="Search by Product ID or Name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className="h-full w-full text-[0.95rem] pl-3 border-none outline-none bg-transparent text-white placeholder-white/70"
                                />
                                <button type="submit" className="hidden" aria-label="Search" />
                            </form>
                            <Link href="/chat" className="flex-shrink-0 p-2 text-white">
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
            {/* Spacer for fixed nav */}
            <div className="hidden md:block h-[70px]"></div>
        </>
    );
}
