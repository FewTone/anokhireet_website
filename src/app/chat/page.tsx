import { Suspense } from "react";
import ChatClient from "./ClientPage";

export const dynamic = "force-dynamic";

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading chat...</div>}>
            <ChatClient />
        </Suspense>
    );
}
