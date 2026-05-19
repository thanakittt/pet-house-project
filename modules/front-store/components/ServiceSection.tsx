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
    icon: <Waves className="text-blue-600" size={24} />,
    color: "bg-blue-100",
  },
  {
    title: "อาบน้ำตัดขน",
    description: "ตัดแต่งทรงมาตรฐานหรือทรงแฟชั่น โดยช่างมืออาชีพ",
    icon: <Scissors className="text-orange-600" size={24} />,
    color: "bg-orange-100",
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
      <section className="mb-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MAIN_SERVICES.map((service, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all"
            >
              <div className={`${service.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>

        {/* ตารางรายละเอียด (Detail Box) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold">
              <Dog size={20} />
              <span>บริการมาตรฐานสำหรับสุนัข</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ครอบคลุม: ตัดเล็บ, เช็ดหู, ถอนขนหู, ไถก้น/ท้อง/ใต้อุ้งเท้า, ตัดรอบเท้า และบีบต่อมก้น
            </p>
          </div>
          <div className="bg-pink-50/50 p-6 rounded-3xl border border-pink-100">
            <div className="flex items-center gap-2 mb-3 text-pink-600 font-bold">
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
        <div className="space-y-6">
          {/* Dog Add-ons */}
          <div>
            <div className="flex items-center gap-2 mb-5 text-blue-600">
              <div className="p-1.5 bg-blue-100 rounded-lg"><Dog size={18} /></div>
              <span className="font-bold">บริการเสริมสำหรับสุนัข</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {DOG_ADDONS.map((addon, i) => (
                <div key={i} className="flex flex-col items-center p-5 bg-white border border-slate-100 rounded-2xl transition-colors text-center shadow-sm">
                  <div className="text-blue-500 mb-3">{addon.icon}</div>
                  <span className="text-sm font-medium text-foreground/80">{addon.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cat Add-ons */}
          <div>
            <div className="flex items-center gap-2 mb-5 text-pink-500">
              <div className="p-1.5 bg-pink-100 rounded-lg"><Cat size={18} /></div>
              <span className="font-bold">บริการเสริมสำหรับแมว</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {CAT_ADDONS.map((addon, i) => (
                <div key={i} className="flex flex-col items-center p-5 bg-white border border-slate-100 rounded-2xl transition-colors text-center shadow-sm">
                  <div className="text-pink-400 mb-3">{addon.icon}</div>
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