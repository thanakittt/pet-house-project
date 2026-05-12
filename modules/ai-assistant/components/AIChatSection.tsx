"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, Sparkles, User, Loader2 } from "lucide-react"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area" // ใช้ ScrollArea จาก shadcn
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Message = {
    role: "user" | "assistant";
    content: string;
}

const ERROR_MESSAGE = "ขออภัยครับ ระบบตอบคำถามขัดข้อง กรุณาลองใหม่อีกครั้ง หรือติดต่อร้าน Pet House ที่ 086-429-5361 หรือ 052-005-227";
const QUICK_SUGGESTIONS = [
    "ขอดูราคา",
    "แมวอาบน้ำเท่าไหร่",
    "สุนัขไซส์ใหญ่ราคาเท่าไหร่",
    "อาบน้ำตัดขนเริ่มต้นเท่าไหร่",
    "มีบริการเสริมอะไรบ้าง",
    "แปรงฟันราคาเท่าไหร่",
    "ขนพันกันคิดเพิ่มไหม",
    "ติดต่อร้านได้ทางไหน",
    "บริการรวมอะไรบ้าง",
];

// --- Sub-component สำหรับ Chat Bubble ---
const ChatBubble = ({ msg, isLoading = false }: { msg?: Message; isLoading?: boolean }) => {
    const isUser = msg?.role === "user";

    return (
        <div className={cn(
            "slide-in-from-bottom-2 flex gap-3 max-w-[85%] md:max-w-[70%] animate-in duration-300 fade-in",
            isUser ? "ml-auto flex-row-reverse" : "mr-auto"
        )}>
            <div className={cn(
                "flex justify-center items-center border rounded-full size-8 transition-all shrink-0",
                isUser ? "bg-primary text-primary-foreground border-primary" : "bg-white border-primary/10 text-primary shadow-sm"
            )}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
                "shadow-sm p-4 rounded-2xl text-sm leading-relaxed",
                isUser
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
            )}>
                {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground italic">
                        <Loader2 size={14} className="animate-spin" /> กำลังคิดคำตอบให้ทาสแป๊บนึงนะ...
                    </div>
                ) : (
                    msg?.content
                )}
            </div>
        </div>
    );
};

export default function AIChatSection() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "สวัสดีครับ! ผม AI Pet Assistant มีอะไรให้ช่วยแนะนำเกี่ยวกับบริการของเราไหมครับ?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // ฟังก์ชัน Scroll (Memorized)
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            const scrollContainer =
                scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]') ||
                scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" });
            }
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInput("");
        setIsLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

            const response = await fetch("/api/assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
                body: JSON.stringify({ messages: nextMessages }),
            });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok || !data?.message?.content) {
                throw new Error(data?.error || "Assistant request failed");
            }

            const aiResponse: Message = {
                role: "assistant",
                content: data.message.content,
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("Assistant chat error:", error);
            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: ERROR_MESSAGE,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="px-4 w-full max-w-4xl">
            <div className="flex flex-col bg-background shadow-2xl shadow-primary/5 border rounded-2xl h-[min(650px,calc(100dvh-2rem))] overflow-hidden">

                {/* Header */}
                <header className="flex justify-between items-center bg-card p-6 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex justify-center items-center bg-primary shadow-lg shadow-primary/20 rounded-full size-11 text-primary-foreground">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">AI Pet Assistant</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="bg-green-500 rounded-full size-2 animate-pulse" />
                                <Badge variant="secondary" className="px-2 py-1 font-bold text-[10px] uppercase">Online</Badge>
                            </div>
                        </div>
                    </div>
                    <Sparkles className="text-primary/40" size={24} />
                </header>

                {/* Chat Area */}
                <ScrollArea ref={scrollRef} className="flex-1 bg-muted/30 p-6 min-h-0 overflow-hidden">
                    <div className="space-y-6 pb-4">
                        {messages.map((msg, idx) => (
                            <ChatBubble key={idx} msg={msg} />
                        ))}
                        {isLoading && <ChatBubble isLoading />}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <footer className="bg-card p-6 border-t shrink-0">
                    <div className="flex items-center gap-3">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="ถามเรื่องการดูแลน้องๆ ได้ที่นี่..."
                            className="flex-1 bg-muted/50 border-muted-foreground/20 rounded-2xl focus-visible:ring-primary h-10"
                        />
                        <LoadingButton
                            size="default"
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                            isLoading={isLoading}
                            loadingText={<span className="hidden md:inline ml-2">กำลังส่ง...</span>}
                            className="shadow-lg shadow-primary/10 active:scale-95 transition-all"
                        >
                            <Send data-icon="inline-start" />
                            <span className="hidden md:inline ml-2">ส่งข้อความ</span>
                        </LoadingButton>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="flex gap-2 mt-4 pb-1 overflow-x-auto scrollbar-hide">
                        {QUICK_SUGGESTIONS.map((text) => (
                            <Button
                                key={text}
                                variant="outline"
                                size="sm"
                                onClick={() => setInput(text)}
                                className="bg-background hover:bg-primary rounded-full hover:text-primary-foreground text-xs md:text-sm whitespace-nowrap transition-colors"
                            >
                                {text}
                            </Button>
                        ))}
                    </div>
                </footer>
            </div>
        </section>
    )
}
