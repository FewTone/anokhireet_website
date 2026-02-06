import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import WebsiteGuard from "@/components/WebsiteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginModal from "@/components/LoginModal";
import { Suspense } from "react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Anokhi Reet | Unique Handcrafted Men's Fashion",
    description: "Discover timeless elegance and contemporary Indian styles at Anokhi Reet. Premium men's fashion handcrafted for the modern gentleman.",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
    },
    openGraph: {
        title: "Anokhi Reet | Unique Handcrafted Men's Fashion",
        description: "Discover timeless elegance and contemporary Indian styles at Anokhi Reet. Premium men's fashion handcrafted for the modern gentleman.",
        url: "https://anokhireet.in",
        siteName: "Anokhi Reet",
        images: [
            {
                url: "/favicon.svg",
                width: 800,
                height: 600,
            },
        ],
        locale: "en_IN",
        type: "website",
    },
};

import ScrollRestoration from "@/components/ScrollRestoration";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body suppressHydrationWarning className={`${inter.variable} ${playfairDisplay.variable} ${inter.className} antialiased w-full mx-auto bg-gray-100 md:bg-white overflow-x-hidden`}>
                <ErrorBoundary>
                    <WebsiteGuard>
                        <Suspense fallback={null}>
                            <ScrollRestoration />
                        </Suspense>
                        {children}
                        <Suspense fallback={null}>
                            <LoginModal />
                        </Suspense>
                    </WebsiteGuard>
                </ErrorBoundary>
                <div id="modal-root" />
            </body>
        </html>
    );
}
