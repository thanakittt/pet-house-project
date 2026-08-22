# Pet House Project 🐾

ระบบบริหารจัดการร้านและคลินิกสัตว์เลี้ยง (Pet Care & Clinic Management System) พัฒนาด้วย Next.js 16 (App Router), React 19, Drizzle ORM และ PostgreSQL / Supabase

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2 (App Router), React 19
- **Database & ORM**: PostgreSQL (Supabase), Drizzle ORM
- **Authentication**: Better Auth (รองรับ Email/Password, Google OAuth, LINE Login)
- **Styling & UI**: Tailwind CSS v4, shadcn/ui, Radix UI, Lucide Icons
- **Integrations**: LINE Messaging API, LINE LIFF, Google Gemini AI, Nodemailer

---

## 📋 ข้อกำหนดเบื้องต้น (Prerequisites)

- [Node.js](https://nodejs.org/) v20.x ขึ้นไป
- [pnpm](https://pnpm.io/) v9.x ขึ้นไป (แนะนำ)
- บัญชี [Supabase](https://supabase.com/) หรือฐานข้อมูล PostgreSQL

---

## 🚀 ขั้นตอนการติดตั้งและเริ่มใช้งาน (Installation Guide)

### 1. ติดตั้ง Dependencies

รันคำสั่งเพื่อติดตั้งแพ็กเกจทั้งหมดผ่าน `pnpm`:

```bash
pnpm install
```

### 2. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:

```bash
cp .env.example .env
```

จากนั้นแก้ไขค่าในไฟล์ `.env` ให้ตรงกับระบบของคุณ:

```env
# Database (PostgreSQL / Supabase Connection String)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Better Auth Configuration
BETTER_AUTH_SECRET="สร้างคีย์ความปลอดภัยสุ่มความยาวอย่างน้อย 32 ตัวอักษร"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth Authentication (Google & LINE)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
LINE_CLIENT_ID=""
LINE_CLIENT_SECRET=""

# Supabase (Storage & Client SDK)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Email Notifications (Gmail SMTP / Nodemailer)
GOOGLE_APP_USER="your-email@gmail.com"
GOOGLE_APP_PASSWORD="your-gmail-app-password"

# AI & Verification APIs
GEMINI_KEY=""
THUNDER_API_KEY=""

# LINE Official Account & LIFF
NEXT_PUBLIC_LIFF_ID=""
LINE_CHANNEL_ACCESS_TOKEN=""
```

### 3. ซิงค์ Database Schema ด้วย Drizzle

ดัน Schema เข้าฐานข้อมูล PostgreSQL / Supabase:

```bash
# Push schema ไปยังฐานข้อมูลโดยตรง
pnpm db:push

# หรือ Generate migration files
pnpm db:generate
pnpm db:migrate
```

### 4. รันโปรเจกต์ในโหมด Development

```bash
pnpm dev
```

เปิดเว็บเบราว์เซอร์แล้วเข้าใช้งานที่ [http://localhost:3000](http://localhost:3000)

---

## 💻 คำสั่งที่มีในโปรเจกต์ (Available Scripts)

| คำสั่ง | รายละเอียด |
| :--- | :--- |
| `pnpm dev` | เริ่มต้น Development Server ที่พอร์ต 3000 |
| `pnpm build` | ทำการ Build โปรเจกต์สำหรับ Production |
| `pnpm start` | รันเซิร์ฟเวอร์โหมด Production หลัง Build |
| `pnpm lint` | ตรวจสอบโค้ดด้วย ESLint |
| `pnpm db:push` | อัปเดต Schema เข้าฐานข้อมูลโดยตรง |
| `pnpm db:generate` | สร้าง Migration files จาก Drizzle Schema |
| `pnpm db:migrate` | รัน Migration files ไปยังฐานข้อมูล |
| `pnpm db:studio` | เปิด Drizzle Studio ดูข้อมูล Database ผ่านเว็บ UI |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── app/                  # Next.js App Router (หน้าเว็บและ Route Handlers)
├── components/           # UI Components (shadcn/ui & Shared components)
├── db/                   # Database connection & Drizzle schemas
│   └── schema/           # ตารางข้อมูลต่างๆ (users, pets, appointments, ฯลฯ)
├── hooks/                # Custom React Hooks
├── lib/                  # Auth, Supabase client, Utility functions
├── modules/              # Feature modules (POS, Pets, Appointments, AI, LINE)
├── public/               # Static assets (รูปภาพ, ไอคอน)
├── supabase/             # Supabase migrations & config
└── types/                # TypeScript type definitions
```
