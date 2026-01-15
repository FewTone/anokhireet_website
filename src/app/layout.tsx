import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import WebsiteGuard from "@/components/WebsiteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

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
    title: "Anokhi Reet",
    description: "Buy Fashion for Men online in India",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body suppressHydrationWarning className={`${inter.variable} ${playfairDisplay.variable} ${inter.className} antialiased w-full mx-auto bg-gray-100 md:bg-white h-dvh overflow-hidden overscroll-none`}>
                <div id="app-shell-scroll" className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide overscroll-y-none relative">
                    <ErrorBoundary>
                        <WebsiteGuard>
                            {children}
                        </WebsiteGuard>
                    </ErrorBoundary>
                </div>
            </body>
        </html>
    );
}
