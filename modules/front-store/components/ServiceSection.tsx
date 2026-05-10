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
    icon: <Waves className="text-blue-500" size={20} />,
    color: "bg-blue-50",
  },
  {
    title: "อาบน้ำตัดขน",
    icon: <Scissors className="text-orange-500" size={20} />,
    color: "bg-orange-50",
  },
];

const DOG_ADDONS = [
  { name: "แปรงฟัน", icon: <Sparkles size={16} /> },
  { name: "ไถยกเท้า", icon: <Scissors size={16} /> },
  { name: "อาบหมักเชื้อรา", icon: <ShieldCheck size={16} /> },
  { name: "หยอดยาเห็บหมัด", icon: <Bug size={16} /> },
  { name: "ทำทรีทเม้นท์", icon: <Stethoscope size={16} /> },
];

const CAT_ADDONS = [
  { name: "แปรงฟัน", icon: <Sparkles size={16} /> },
  { name: "อาบหมักเชื้อรา", icon: <ShieldCheck size={16} /> },
  { name: "หยอดยาเห็บหมัด", icon: <Bug size={16} /> },
  { name: "ทำทรีทเม้นท์", icon: <Stethoscope size={16} /> },
  { name: "ตู้อบแมว", icon: <Wind size={16} /> },
];

export default function ServiceSection() {
  return (
    <div className="space-y-6 bg-white shadow-sm p-6 md:p-12 border rounded-3xl font-noto-thai">
      {/* --- ส่วนบริการหลัก --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-full w-1.5 h-8" />
          <h2 className="font-bold text-primary text-lg md:text-xl">
            บริการหลัก
          </h2>
        </div>

        <div className="gap-6 grid grid-cols-1 md:px-6">
          <div className="justify-center items-center gap-6 grid grid-cols-2">
            {MAIN_SERVICES.map((service, index) => (
              <div
                key={index}
                className="group flex flex-col items-center shadow-sm py-4 border border-slate-100 rounded-3xl text-center"
              >
                <div className={`p-3 rounded-2xl ${service.color} mb-4 `}>
                  {service.icon}
                </div>
                <h4 className="font-bold text-primary text-base md:text-lg">
                  {service.title}
                </h4>
              </div>
            ))}
          </div>
          <div className="gap-4 grid grid-cols-1 shadow-sm p-6 border border-slate-100 rounded-3xl w-full">
            {/* รายละเอียดสุนัข */}
            <div>
              <div className="flex items-center gap-2 mb-2 font-bold text-blue-600">
                <Dog size={16} />{" "}
                <span className="text-sm md:text-base">สำหรับสุนัข:</span>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                รวมตัดเล็บ เช็ดหู ถอนขนหู ไถก้น, ท้อง, ใต้อุ้งเท้า ตัดรอบเท้า
                และบีบต่อมก้น
              </p>
            </div>

            {/* รายละเอียดแมว */}
            <div>
              <div className="flex items-center gap-2 mb-2 font-bold text-pink-500">
                <Cat size={16} />{" "}
                <span className="text-sm md:text-base">สำหรับแมว:</span>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                รวมตัดเล็บ เช็ดหู ไถใต้อุ้งเท้า ตัดรอบเท้า และบีบต่อมก้น
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ส่วนบริการเสริม --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-full w-1.5 h-8" />
          <h3 className="font-bold text-primary text-lg md:text-xl">
            บริการเสริม
          </h3>
        </div>

        <div className="grid grid-cols-1">
          {/* บริการเสริมสุนัข */}
          <div className="gap-4 grid grid-cols-1 md:px-6">
            <div className="flex justify-start lg:justify-start items-center gap-2 font-bold text-blue-600">
              <Dog size={20} />
              <span className="text-sm md:text-base">สำหรับสุนัข</span>
            </div>
            <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {DOG_ADDONS.map((addon, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center bg-white shadow-sm p-4 border border-slate-100 rounded-2xl transition-all"
                >
                  <div className="bg-blue-50 mb-3 p-2.5 rounded-xl text-blue-500 transition-colors">
                    {addon.icon}
                  </div>
                  <span className="font-semibold text-foreground/70 text-sm md:text-base">
                    {addon.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-start lg:justify-start items-center gap-2 mt-2 font-bold text-pink-500">
              <Cat size={20} />
              <span className="text-sm md:text-base">สำหรับแมว</span>
            </div>
            <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {CAT_ADDONS.map((addon, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center bg-white shadow-sm p-4 border border-slate-100 rounded-2xl transition-all"
                >
                  <div className="bg-pink-50 mb-3 p-2.5 rounded-xl text-pink-500 transition-colors">
                    {addon.icon}
                  </div>
                  <span className="font-semibold text-foreground/70 text-sm md:text-base">
                    {addon.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
