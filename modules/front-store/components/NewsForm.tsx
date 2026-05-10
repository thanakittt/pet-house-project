import { Button } from '@/components/ui/button'
import { Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const PROMOTIONS = [
    {
        id: 1,
        title: "ฉลองเปิดสาขาใหม่! ลด 20%",
        desc: "เพียงพาเด็กๆ มาอาบน้ำตัดขนครั้งแรก รับส่วนลดทันที 20% ทุกรายการ",
        date: "วันนี้ - 30 เม.ย. 69",
        tag: "Promotion",
        tagColor: "bg-orange-100 text-orange-600 border-orange-200", // ปรับโทนสีให้อ่อนลง
    },
    {
        id: 2,
        title: "สปาน้ำอุ่น ลดกลิ่นตัว",
        desc: "แพ็คเกจอาบน้ำสปา 5 ครั้ง ฟรี! แปรงฟันและเช็ดหูทุกครั้ง",
        date: "15 เม.ย. - 15 พ.ค. 69",
        tag: "Hot Deal",
        tagColor: "bg-red-100 text-red-600 border-red-200",
    },
    {
        id: 3,
        title: "กิจกรรม Pet Workshop",
        desc: "เรียนรู้เทคนิคการดูแลขนเบื้องต้นด้วยตัวเอง โดยช่างมืออาชีพ",
        date: "25 เม.ย. 69",
        tag: "News",
        tagColor: "bg-blue-100 text-blue-600 border-blue-200",
    }
]

export default function NewsForm({ className }: { className?: string }) {
    return (
        <div className="w-full">
            {/* Grid Container */}
            <div className={className}>
                {PROMOTIONS.map((promo) => (
                    <Link href={`/news/${promo.id}`} key={promo.id} className="group h-full">
                        <div className="relative flex items-center justify-between bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40 overflow-hidden h-full">

                            {/* Content Section */}
                            <div className="p-6 flex flex-col gap-2 w-full pr-0">
                                {/* Tag & Category */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2.5 pt-1 pb-0.5 rounded-full border ${promo.tagColor} text-[10px] font-bold uppercase tracking-wider`}>
                                        {promo.tag}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-primary text-base md:text-lg group-hover:text-primary transition-colors line-clamp-1">
                                    {promo.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed pr-10">
                                    {promo.desc}
                                </p>

                                {/* Date */}
                                <div className="flex items-center gap-1.5 text-primary/50 text-xs md:text-sm mt-1">
                                    <Calendar size={14} className="opacity-70" />
                                    <span>{promo.date}</span>
                                </div>
                            </div>

                            {/* Action Icon Section */}
                            <div className="pr-6 flex ">
                                <div className="flex items-center justify-center size-9 rounded-full border border-primary/10 bg-primary/5 text-primary/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 shadow-inner">
                                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}