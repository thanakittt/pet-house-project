import {
  ANNOUNCEMENT_TYPE_LABELS,
  type Announcement,
  type AnnouncementType,
} from "@/modules/announcement/types/announcement";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

const ANNOUNCEMENT_TAG_COLORS: Record<AnnouncementType, string> = {
  NEWS: "bg-blue-100 text-blue-600 border-blue-200",
  PROMOTION: "bg-orange-100 text-orange-600 border-orange-200",
  ALERT: "bg-red-100 text-red-600 border-red-200",
};

function formatAnnouncementDate(announcement: Announcement): string {
  const startDate = format(announcement.startDisplayAt, "d MMM yy", {
    locale: th,
  });

  if (!announcement.endDisplayAt) {
    return startDate;
  }

  const endDate = format(announcement.endDisplayAt, "d MMM yy", {
    locale: th,
  });

  return `${startDate} - ${endDate}`;
}

export default function AnnouncementList({
  announcements,
  className,
}: {
  announcements: Announcement[];
  className?: string;
}) {
  if (announcements.length === 0) {
    return (
      <div className="bg-white shadow-sm p-8 border border-slate-100 rounded-3xl text-center">
        <h2 className="font-bold text-primary text-base md:text-lg">
          ยังไม่มีประกาศในขณะนี้
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          โปรดกลับมาตรวจสอบข่าวสารและโปรโมชันใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Grid Container */}
      <div className={className}>
        {announcements.map((announcement) => (
          <Link
            key={announcement.id}
            href={`/news/${announcement.id}`}
            className="group block h-full"
          >
            <div className="relative flex justify-between items-center bg-white shadow-sm hover:shadow-md border border-slate-100 hover:border-primary/40 rounded-3xl h-full overflow-hidden transition-all duration-300">
              {/* Content Section */}
              <div className="flex flex-col gap-2 p-6 pr-0 w-full">
                {/* Tag & Category */}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 pt-1 pb-0.5 rounded-full border ${ANNOUNCEMENT_TAG_COLORS[announcement.type]} text-[10px] font-bold uppercase tracking-wider`}
                  >
                    {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-primary group-hover:text-primary text-base md:text-lg line-clamp-1 transition-colors">
                  {announcement.title}
                </h3>

                {/* Description */}
                <p className="pr-10 text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                  {announcement.content}
                </p>

                {/* Date */}
                <div className="flex items-center gap-1.5 mt-1 text-primary/50 text-xs md:text-sm">
                  <Calendar size={14} className="opacity-70" />
                  <span>{formatAnnouncementDate(announcement)}</span>
                </div>
              </div>

              {/* Action Icon Section */}
              <div className="flex pr-6">
                <div className="flex justify-center items-center bg-primary/5 group-hover:bg-primary shadow-inner border border-primary/10 group-hover:border-primary rounded-full size-9 text-primary/50 group-hover:text-white transition-all duration-300">
                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
