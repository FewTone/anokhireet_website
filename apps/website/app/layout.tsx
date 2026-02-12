import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import WebsiteGuard from "@/components/WebsiteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginModal from "@/components/LoginModal";
import { Suspense } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";

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
    metadataBase: new URL("https://anokhireet.in"),
    title: "Anokhi Reet",
    description: "Discover timeless elegance and contemporary Indian styles at Anokhi Reet. Premium men's fashion handcrafted for the modern gentleman.",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
    },
    openGraph: {
        title: "Anokhi Reet",
        description: "Discover timeless elegance and contemporary Indian styles at Anokhi Reet. Premium men's fashion handcrafted for the modern gentleman.",
        url: "https://anokhireet.in",
        siteName: "Anokhi Reet",
        images: [
            {
                url: "/share-image.svg",
                width: 800,
                height: 600,
            },
        ],
        locale: "en_IN",
        type: "website",
    },
    // Security Headers (Meta Tags for Static Export)
    other: {
        "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.supabase.in;",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
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
                        <AuthProvider>
                            <Suspense fallback={null}>
                                <ScrollRestoration />
                            </Suspense>
                            {children}
                            <Suspense fallback={null}>
                                <LoginModal />
                            </Suspense>
                        </AuthProvider>
                    </WebsiteGuard>
                </ErrorBoundary>
                <div id="modal-root" />
            </body>
        </html>
    );
}
