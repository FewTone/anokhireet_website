"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <>
            <nav className="fixed top-0 left-0 w-full z-[1000] bg-white shadow-[0.1rem_0.1rem_0.2rem_rgb(119,118,118)] px-4 py-2 flex justify-between items-center transition-all duration-300 md:h-[70px] flex-wrap md:flex-nowrap">
                {/* Left Section: Menu Button */}
                <div className="hidden md:flex flex-1 items-center relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="px-2 cursor-pointer"
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
                            className="text-black"
                        >
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="py-2">
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors"
                                >
                        <Image
                                        src="https://cdn-icons-png.flaticon.com/128/9308/9308008.png"
                                        alt="profile"
                                        width={20}
                                        height={20}
                                        className="mr-3"
                                        suppressHydrationWarning
                                    />
                                    <span className="text-sm font-medium text-gray-700">Profile</span>
                                </Link>
                                <Link
                                    href="/chat"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors"
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
                                        className="text-gray-700 mr-3"
                                    >
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Chat</span>
                                </Link>
                                <Link
                                    href="/my-products"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors"
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
                                        className="text-gray-700 mr-3"
                                    >
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">My Products</span>
                                </Link>
                                <Link
                                    href="/wishlist"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors"
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
                                        className="text-gray-700 mr-3"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Wish List</span>
                                </Link>
                    </div>
                    </div>
                    )}
                </div>

                {/* Center: Logo */}
                <div className="flex justify-center md:flex-1 w-full md:w-auto order-1 md:order-none mb-2 md:mb-0 items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/group-190.svg"
                            alt="Logo Icon"
                            width={40}
                            height={40}
                            className="w-10 h-10 md:w-12 md:h-12 object-contain cursor-pointer brightness-0"
                            priority
                            suppressHydrationWarning
                        />
                        <Image
                            src="/anokhi-reet.svg"
                            alt="Anokhi Reet"
                            width={120}
                            height={18}
                            className="h-4 md:h-4.5 w-auto object-contain cursor-pointer brightness-0"
                            priority
                            suppressHydrationWarning
                        />
                    </Link>
                </div>

                {/* Right: Search & Profile */}
                <div className="flex w-full md:w-auto md:flex-1 justify-between md:justify-end items-center gap-4 px-4 md:px-0 order-2 md:order-none -mt-4 md:mt-0">
                    <div className="flex w-full md:max-w-[250px] h-[38px] border border-[#ccc] rounded text-sm items-center pl-2 bg-white">
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
                            placeholder="Search Jeans"
                            className="h-full w-full text-[0.9rem] pl-2 border-none outline-none bg-transparent"
                        />
                    </div>
                    <div className="flex">
                        <button className="bg-transparent border-none ml-4 cursor-pointer">
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
                        <Link href="/chat" className="bg-transparent border-none ml-4 cursor-pointer">
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
                    </div>
                </div>
            </nav>
            {/* Spacer for fixed nav */}
            <div className="h-[95px] md:h-[80px]"></div>
        </>
    );
}
