# 0004. AI Assistant Rich Response Formatting

## Context
ระบบ AI Pet Assistant หน้าร้านออนไลน์ (`/assistant`) เดิมมีปัญหาการแสดงผล:
1. ฝั่ง Client (`AIChatSection.tsx`) แสดงผลข้อความแบบ Plain Text ใน JSX โดยไม่มี `whitespace-pre-wrap` หรือ Markdown Parser ส่งผลให้ข้อความทุกบรรทัดยุบรวมเป็นข้อความก้อนเดียว ทำให้อ่านยาก
2. ฝั่ง Server (`app/api/assistant/route.ts`) มีคำสั่งห้ามใช้ Markdown ใน System Instruction พร้อมฟังก์ชัน `sanitizeAssistantReply` ที่ตัดสัญลักษณ์ `*` ออกทั้งหมด ทำให้ข้อความขาดความเด่นชัดของข้อมูลสำคัญ เช่น ราคา และหัวข้อบริการ
3. ช่องทางติดต่อ (เบอร์โทร, เพจเฟสบุ๊ค) เป็นเพียงข้อความธรรมดา ลูกค้าไม่สามารถกดคลิกเพื่อโทรออกหรือเปิดหน้าเพจได้ทันที

## Decision
1. **Frontend Rich Markdown Rendering**: ติดตั้ง `react-markdown` และ `remark-gfm` ใน Client Component เพื่อแปลง Markdown เป็น Rich HTML ภายใน Chat Bubble ของ Assistant
2. **Custom Component Styling**:
   - ปรับแต่งการแสดงผลลิงก์ (`a`) ให้เปิดแท็บใหม่พร้อมรองรับ `tel:` และ `https://`
   - จัดระยะห่างรายการ (`ul`, `ol`, `li`), หัวข้อ (`h3`, `h4`), และตัวหนา (`strong`) ให้กระชับ สวยงาม และเข้ากับโทนสีของแอป
   - รองรับ `whitespace-pre-wrap` บนข้อความฝั่ง User
3. **Backend System Instruction Alignment**:
   - ปรับปรุง System Instruction ใน `app/api/assistant/route.ts` ให้อนุญาตและส่งเสริมการใช้ Markdown เชิงโครงสร้าง (หัวข้อ `###`, รายการ `-`, ตัวหนา `**` สำหรับเน้นราคาและบริการสำคัญ)
   - ยกเลิกการลบเครื่องหมายดอกจัน (`*`) ใน `sanitizeAssistantReply`
   - จัดรูปแบบช่องทางติดต่อให้เป็น Markdown Link: เบอร์โทรเป็น `[086-429-5361](tel:0864295361)` และ Facebook Page เป็นลิงก์ที่เข้าถึงได้
4. **Structured Price Summary**: กำหนดรูปแบบการตอบกลับเมื่อมีการสอบถามราคา ให้จัดกลุ่มแยกตามหมวดหมู่อย่างเป็นระเบียบ (แมว, สุนัข, บริการเสริม) พร้อมหมายเหตุเงื่อนไขราคาเริ่มต้น
