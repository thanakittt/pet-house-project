"use client";

import {
  Waves,
  Scissors,
  Sparkles,
  Cat,
  Dog,
  Wind,
  ShieldCheck,
  Bug,
  Stethoscope,
} from "lucide-react";

const MAIN_SERVICES = [
  {
    title: "อาบน้ำ",
    description: "ทำความสะอาดล้ำลึก เพื่อผิวหนังและเส้นขนที่สุขภาพดี",
    icon: <Waves className="text-blue-600 dark:text-blue-300" size={24} />,
    color: "bg-blue-100 dark:bg-blue-950/40",
  },
  {
    title: "อาบน้ำตัดขน",
    description: "ตัดแต่งทรงมาตรฐานหรือทรงแฟชั่น โดยช่างมืออาชีพ",
    icon: <Scissors className="text-orange-600 dark:text-orange-300" size={24} />,
    color: "bg-orange-100 dark:bg-orange-950/40",
  },
];

const DOG_ADDONS = [
  { name: "แปรงฟัน", icon: <Sparkles size={18} /> },
  { name: "ไถยกเท้า", icon: <Scissors size={18} /> },
  { name: "อาบหมักเชื้อรา", icon: <ShieldCheck size={18} /> },
  { name: "หยอดยาเห็บหมัด", icon: <Bug size={18} /> },
  { name: "ทำทรีทเม้นท์", icon: <Stethoscope size={18} /> },
];

const CAT_ADDONS = [
  { name: "แปรงฟัน", icon: <Sparkles size={18} /> },
  { name: "อาบหมักเชื้อรา", icon: <ShieldCheck size={18} /> },
  { name: "หยอดยาเห็บหมัด", icon: <Bug size={18} /> },
  { name: "ทำทรีทเม้นท์", icon: <Stethoscope size={18} /> },
  { name: "ตู้อบแมว", icon: <Wind size={18} /> },
];

export default function ServiceSection() {
  return (
    <div className="mx-auto max-w-5xl font-noto-thai antialiased">
      {/* --- ส่วนบริการหลัก --- */}
      <section className="mb-10 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MAIN_SERVICES.map((service, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border bg-card p-8 text-card-foreground shadow-sm transition-all"
            >
              <div className={`${service.color} mb-6 flex size-14 items-center justify-center rounded-2xl transition-transform`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>

        {/* ตารางรายละเอียด (Detail Box) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="mb-3 flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
              <Dog size={20} />
              <span>บริการมาตรฐานสำหรับสุนัข</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ครอบคลุม: ตัดเล็บ, เช็ดหู, ถอนขนหู, ไถก้น/ท้อง/ใต้อุ้งเท้า, ตัดรอบเท้า และบีบต่อมก้น
            </p>
          </div>
          <div className="rounded-3xl border border-pink-100 bg-pink-50/50 p-6 dark:border-pink-800 dark:bg-pink-950/30">
            <div className="mb-3 flex items-center gap-2 font-bold text-pink-600 dark:text-pink-300">
              <Cat size={20} />
              <span>บริการมาตรฐานสำหรับแมว</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ครอบคลุม: ตัดเล็บ, เช็ดหู, ไถใต้อุ้งเท้า, ตัดรอบเท้า และบีบต่อมก้น (เน้นความอ่อนโยนเป็นพิเศษ)
            </p>
          </div>
        </div>
      </section>

      {/* --- ส่วนบริการเสริม --- */}
      <section>
        <div className="flex flex-col gap-6">
          {/* Dog Add-ons */}
          <div>
            <div className="mb-5 flex items-center gap-2 text-blue-600 dark:text-blue-300">
              <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-950/40"><Dog size={18} /></div>
              <span className="font-bold">บริการเสริมสำหรับสุนัข</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {DOG_ADDONS.map((addon, i) => (
                <div key={i} className="flex flex-col items-center rounded-2xl border bg-card p-5 text-center shadow-sm transition-colors">
                  <div className="mb-3 text-blue-500 dark:text-blue-300">{addon.icon}</div>
                  <span className="text-sm font-medium text-foreground/80">{addon.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cat Add-ons */}
          <div>
            <div className="mb-5 flex items-center gap-2 text-pink-500 dark:text-pink-300">
              <div className="rounded-lg bg-pink-100 p-1.5 dark:bg-pink-950/40"><Cat size={18} /></div>
              <span className="font-bold">บริการเสริมสำหรับแมว</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {CAT_ADDONS.map((addon, i) => (
                <div key={i} className="flex flex-col items-center rounded-2xl border bg-card p-5 text-center shadow-sm transition-colors">
                  <div className="mb-3 text-pink-400 dark:text-pink-300">{addon.icon}</div>
                  <span className="text-sm font-medium text-foreground/80">{addon.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
