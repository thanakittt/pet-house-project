import type { Metadata } from "next";
import AIChatSection from "@/modules/ai-assistant/components/AIChatSection";

export const metadata: Metadata = {
  title: "AI ผู้ช่วย",
  description: "ผู้ช่วยตอบคำถามเกี่ยวกับบริการและข้อมูลร้าน Pet House",
};

export default function AssistantPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <AIChatSection />
    </div>
  );
}
