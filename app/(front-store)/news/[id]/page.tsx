import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  type Announcement,
  type AnnouncementType,
} from "@/modules/announcement/types/announcement";
import { getPublicAnnouncement } from "@/modules/announcement/queries/list-public-announcements";
import { formatThaiDateTime } from "@/lib/utils";
import { Calendar, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const ANNOUNCEMENT_TAG_COLORS: Record<AnnouncementType, string> = {
  NEWS: "bg-blue-100 text-blue-600 border-blue-200",
  PROMOTION: "bg-orange-100 text-orange-600 border-orange-200",
  ALERT: "bg-red-100 text-red-600 border-red-200",
};

type NewsDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายละเอียดข่าว",
  description: "รายละเอียดข่าวสาร โปรโมชั่น หรือประกาศจาก Pet House",
};

function formatAnnouncementDate(announcement: Announcement): string {
  const startDate = formatThaiDateTime(announcement.startDisplayAt);

  if (!announcement.endDisplayAt) {
    return startDate;
  }

  const endDate = formatThaiDateTime(announcement.endDisplayAt);

  return `${startDate} - ${endDate}`;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const result = await getPublicAnnouncement(id);

  if (!result.success) {
    throw new Error(result.error);
  }

  if (!result.data) {
    notFound();
  }

  const announcement = result.data;

  return (
    <main className="space-y-6 mx-auto p-4 md:p-8 max-w-5xl">
      <Button variant="outline" asChild>
        <Link href="/news">
          <ChevronLeft className="mr-2 w-4 h-4" />
          กลับ
        </Link>
      </Button>

      <article className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden">
        {announcement.imageUrl ? (
          <div className="relative bg-muted border-slate-100 border-b w-full aspect-video">
            <Image
              src={announcement.imageUrl}
              alt={announcement.title}
              fill
              className="p-2 object-contain"
              sizes="(max-width: 768px) 100vw, 960px"
              priority
            />
          </div>
        ) : null}

        <div className="space-y-5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-2.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wider ${ANNOUNCEMENT_TAG_COLORS[announcement.type]}`}
            >
              {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
            </span>

            <div className="flex items-center gap-1.5 text-primary/50 text-xs md:text-sm">
              <Calendar size={14} className="opacity-70" />
              <span>{formatAnnouncementDate(announcement)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-bold text-primary text-2xl md:text-4xl leading-tight">
              {announcement.title}
            </h1>
            <p className="text-muted-foreground leading-7 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
