import type { Metadata } from "next";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  type Announcement,
  type AnnouncementType,
} from "@/modules/announcement/types/announcement";
import { getPublicAnnouncement } from "@/modules/announcement/queries/list-public-announcements";
import { formatThaiDateTime } from "@/lib/utils";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";

const ANNOUNCEMENT_TAG_COLORS: Record<AnnouncementType, string> = {
  NEWS: "bg-blue-100 text-blue-600 border-blue-200 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  PROMOTION: "bg-orange-100 text-orange-600 border-orange-200 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  ALERT: "bg-red-100 text-red-600 border-red-200 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
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
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
      <BackButton />

      <article className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
        {announcement.imageUrl ? (
          <div className="relative aspect-video w-full border-b bg-muted">
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

        <div className="flex flex-col gap-5 p-6 md:p-8">
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

          <div className="flex flex-col gap-3">
            <h1 className="font-bold text-primary text-2xl">
              {announcement.title}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-7 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
