"use client";

import Image from "next/image";

interface SidebarProps {
    userName: string;
    userAvatar: string;
    navItems: { label: string; id: string }[];
    activeView: string;
    onNavigate: (id: string) => void;
}

export default function Sidebar({
    userName,
    userAvatar,
    navItems,
    activeView,
    onNavigate,
}: SidebarProps) {
    return (
        <div className="bg-white border border-gray-200 w-full mb-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-medium relative overflow-hidden border border-gray-100">
                        {userAvatar ? (
                            <Image
                                src={userAvatar}
                                alt={userName || "User"}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U"
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Hello,</p>
                        <p className="text-sm font-semibold text-gray-900">{userName || "User"}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col">
                {navItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center justify-between px-5 py-4 text-[13px] font-semibold tracking-wide uppercase transition-colors w-full text-left border-b border-gray-50 last:border-0 ${activeView === item.id
                            ? "bg-gray-100 text-black"
                            : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <span>{item.label}</span>

                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                ))}
                <a
                    href="https://wa.me/918200647176"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-5 py-4 text-[13px] font-semibold tracking-wide uppercase transition-colors w-full text-left border-b border-gray-50 bg-gray-100 text-black hover:bg-gray-200"
                >
                    <div className="flex items-center gap-2">
                        <span>Quick chat</span>
                    </div>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </a>
            </nav>
        </div>
    );
}
