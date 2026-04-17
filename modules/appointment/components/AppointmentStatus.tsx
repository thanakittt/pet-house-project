"use client"
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock4, Flag, LogIn, PackageCheck, RefreshCw, UserX, Wallet, XCircle } from "lucide-react";

const STATUS_CONFIG = {
    PENDING_DEPOSIT: { label: 'รอชำระมัดจำ', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Wallet size={14} /> },
    PENDING_APPROVAL: { label: 'รออนุมัติ', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <Clock4 size={14} /> },
    CONFIRMED: { label: 'ยืนยันแล้ว', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <CheckCircle2 size={14} /> },

    // 2. กลุ่ม Operation
    CHECKED_IN: { label: 'รับฝากแล้ว', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <LogIn size={14} /> },
    IN_PROGRESS: { label: 'กำลังดำเนินการ', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <RefreshCw size={14} className="animate-spin-slow" /> },
    READY_FOR_PICKUP: { label: 'รอรับกลับ', color: 'bg-green-100 text-green-700 border-green-200', icon: <PackageCheck size={14} /> },

    // 3. กลุ่ม Finished
    COMPLETED: { label: 'เสร็จสมบูรณ์', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Flag size={14} /> },
    CANCELLED: { label: 'ยกเลิก', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <XCircle size={14} /> },
    NO_SHOW: { label: 'ไม่มาตามนัด', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <UserX size={14} /> },
}

interface Props {
    status: keyof typeof STATUS_CONFIG;
}
export default function AppointmentStatus({ status }: Props) {
    const config = STATUS_CONFIG[status];
    return (
        <Badge
            variant="outline"
            className={`
                ${config.color} 
                p-3 md:p-4 transition-all 
            `}
        >
            <div className="flex flex-row items-center gap-1.5">
                {config.icon}
                <span className="text-xs md:text-sm">{config.label}</span>
            </div>
        </Badge>
    );
}
