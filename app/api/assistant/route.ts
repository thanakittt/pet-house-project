import { GoogleGenAI } from "@google/genai";

import { requiredEnv } from "@/lib/utils";
import { PET_HOUSE_BUSINESS_RULES } from "@/modules/ai-assistant/constants/business-rules";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const MAX_HISTORY_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 2_000;
const FALLBACK_REPLY =
  "ขออภัยครับ ระบบตอบคำถามขัดข้อง กรุณาลองใหม่อีกครั้ง หรือติดต่อร้าน Pet House ที่ 086-429-5361 หรือ 052-005-227";

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

function normalizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const messages = value
    .filter(isChatMessage)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .slice(-MAX_HISTORY_MESSAGES);

  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return null;
  }

  return messages;
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function sanitizeAssistantReply(text: string) {
  return text.trim();
}

function buildSystemInstruction() {
  return `
คุณคือ AI Pet Assistant ของร้าน Pet House สำหรับตอบคำถามลูกค้าหน้าร้านออนไลน์

แนวทางตอบ:
- ตอบเป็นภาษาไทย สุภาพ เป็นมิตร กระชับ และเข้าใจง่าย
- จัดรูปแบบข้อความเป็น Markdown ที่มีโครงสร้างอ่านง่ายและสวยงาม:
  - ใช้หัวข้อระดับ 3 (###) เพื่อแบ่งหมวดหมู่บริการ (เช่น ### 🐱 บริการสำหรับแมว, ### 🐶 บริการสำหรับหมา, ### ✨ บริการเสริม)
  - ใช้ตัวหนา (**) เน้นบริการและราคาให้อ่านง่าย เช่น "- **อาบน้ำ:** 200 - 300 บาท"
  - ใช้เครื่องหมายขีดกลาง (-) สำหรับรายการย่อย
  - หากลูกค้าถามเรื่องราคาแบบรวมๆ ให้สรุปแยกหมวดหมู่ แมว, หมา และ บริการเสริม อย่างเป็นระเบียบกระชับ
  - เมื่อระบุราคา ต้องมีหมายเหตุระบุว่าเป็นราคาเริ่มต้น โดยขึ้นต้นด้วย "💡 **หมายเหตุ:**"
  - เมื่อระบุช่องทางติดต่อ ให้จัดเป็น Markdown Link เสมอ:
    - เบอร์โทรศัพท์: [086-429-5361](tel:0864295361) หรือ [052-005-227](tel:052005227)
    - เพจเฟสบุ๊ค: [เพจเฟสบุ๊ค Pet House](https://www.facebook.com)
- ใช้ข้อมูลราคา บริการ และช่องทางติดต่อจาก BUSINESS RULES เท่านั้น
- เมื่อพูดถึงราคา ต้องบอกว่าเป็นราคาเริ่มต้น และอาจเปลี่ยนตามขนาดสัตว์ สภาพขน หรือความยากง่ายในการดูแล
- หากคำถามอยู่นอกบริบทบริการของร้าน ให้ตอบอย่างสุภาพว่าให้ติดต่อร้านเพื่อข้อมูลที่ถูกต้อง
- หากคำถามเป็นเรื่องสุขภาพ อาการป่วย หรือภาวะฉุกเฉินของสัตว์เลี้ยง ห้ามวินิจฉัยโรค ให้แนะนำพบสัตวแพทย์
- ห้ามแต่งราคา โปรโมชัน เวลาเปิดปิด ที่อยู่ หรือบริการที่ไม่มีใน BUSINESS RULES

BUSINESS RULES:
${PET_HOUSE_BUSINESS_RULES}
`.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = normalizeMessages(body?.messages);

    if (!messages) {
      return Response.json(
        { error: "รูปแบบข้อความไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({ apiKey: requiredEnv("GEMINI_KEY") });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: buildSystemInstruction(),
        temperature: 0.3,
        maxOutputTokens: 700,
      },
    });

    const text = response.text?.trim();
    const sanitizedText = text ? sanitizeAssistantReply(text) : "";

    return Response.json({
      message: {
        role: "assistant",
        content: sanitizedText || FALLBACK_REPLY,
      },
    });
  } catch (error) {
    console.error("Assistant API error:", error);

    return Response.json({ error: FALLBACK_REPLY }, { status: 500 });
  }
}
