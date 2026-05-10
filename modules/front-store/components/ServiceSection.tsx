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
    Stethoscope
} from "lucide-react";

const MAIN_SERVICES = [
    {
        title: "อาบน้ำ",
        icon: <Waves className="text-blue-500" size={20} />,
        color: "bg-blue-50"
    },
    {
        title: "อาบน้ำตัดขน",
        icon: <Scissors className="text-orange-500" size={20} />,
        color: "bg-orange-50"
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
        <div className="bg-white rounded-3xl p-6 md:p-12 border shadow-sm space-y-6 font-noto-thai ">

            {/* --- ส่วนบริการหลัก --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-primary rounded-full" />
                    <h2 className="text-lg md:text-xl font-bold text-primary">บริการหลัก</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:px-6">
                    <div className="grid grid-cols-2 gap-6 items-center justify-center">
                        {MAIN_SERVICES.map((service, index) => (
                            <div key={index} className="flex flex-col items-center  rounded-3xl border border-slate-100 shadow-sm py-4 group text-center">
                                <div className={`p-3 rounded-2xl ${service.color} mb-4 `}>
                                    {service.icon}
                                </div>
                                <h4 className="text-base md:text-lg font-bold text-primary">{service.title}</h4>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-4 w-full rounded-3xl p-6 border border-slate-100 shadow-sm">
                        {/* รายละเอียดสุนัข */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold">
                                <Dog size={16} /> <span className="text-sm md:text-base">สำหรับสุนัข:</span>
                            </div>
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                รวมตัดเล็บ เช็ดหู ถอนขนหู ไถก้น, ท้อง, ใต้อุ้งเท้า ตัดรอบเท้า และบีบต่อมก้น
                            </p>
                        </div>

                        {/* รายละเอียดแมว */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-pink-500 font-bold">
                                <Cat size={16} /> <span className="text-sm md:text-base">สำหรับแมว:</span>
                            </div>
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                รวมตัดเล็บ เช็ดหู ไถใต้อุ้งเท้า ตัดรอบเท้า และบีบต่อมก้น
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ส่วนบริการเสริม --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-primary rounded-full" />
                    <h3 className="text-lg md:text-xl font-bold text-primary">บริการเสริม</h3>
                </div>

                <div className="grid grid-cols-1">
                    {/* บริการเสริมสุนัข */}
                    <div className="grid grid-cols-1 gap-4 md:px-6">
                        <div className="flex items-center gap-2 text-blue-600 font-bold justify-start lg:justify-start ">
                            <Dog size={20} />
                            <span className="text-sm md:text-base">สำหรับสุนัข</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {DOG_ADDONS.map((addon, i) => (
                                <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all group">
                                    <div className="text-blue-500 bg-blue-50 p-2.5 rounded-xl transition-colors mb-3">
                                        {addon.icon}
                                    </div>
                                    <span className="text-sm md:text-base font-semibold text-foreground/70">{addon.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-pink-500 font-bold justify-start lg:justify-start mt-2">
                            <Cat size={20} />
                            <span className="text-sm md:text-base">สำหรับแมว</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3  lg:grid-cols-5 gap-3 ">
                            {CAT_ADDONS.map((addon, i) => (
                                <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all group">
                                    <div className="text-pink-500 bg-pink-50 p-2.5 rounded-xl transition-colors mb-3">
                                        {addon.icon}
                                    </div>
                                    <span className="text-sm md:text-base font-semibold text-foreground/70">{addon.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// เพิ่ม Icon ที่ขาดไป
function PlusCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
        </svg>
    );
}