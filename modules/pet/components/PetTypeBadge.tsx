"use client";

import { CatIcon, DogIcon, HelpCircle } from "lucide-react"; // เพิ่ม Icon สำรอง
import { Badge } from "@/components/ui/badge";

type PetType = "dog" | "cat";

type PetTypeConfig = {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
    border: string;
};

const PET_TYPE_CONFIG: Record<PetType, PetTypeConfig> = {
    dog: {
        label: "สุนัข",
        icon: DogIcon,
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200",
    },
    cat: {
        label: "แมว",
        icon: CatIcon,
        bg: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-200",
    },
};

interface Props {
    type: PetType | string; // ยืดหยุ่นให้รับ string ทั่วไปได้
    className?: string;
}

export default function PetTypeBadge({ type, className }: Props) {
    // ดึง Config ตาม type ถ้าไม่เจอให้ใช้ค่า Default
    const config = PET_TYPE_CONFIG[type as PetType] || {
        label: "ไม่ระบุ",
        icon: HelpCircle,
        bg: "bg-slate-50",
        text: "text-slate-500",
        border: "border-slate-200",
    };

    const { label, icon: Icon } = config;

    return (
        <Badge
            variant="outline"
            className={[
                className,
                config.bg,
                config.text,
                config.border,
                "py-1 px-2 transition-all hover:opacity-80 w-12 h-12"
            ].filter(Boolean).join(" ")}
        >
            <div className="flex flex-col items-center gap-1.5 font-bold">
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-sm leading-none">{label}</span>
            </div>
        </Badge>
    );
}