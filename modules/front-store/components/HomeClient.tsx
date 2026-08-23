import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Heart,
  Scissors,
  Star,
  Sparkles,
  Newspaper,
  Phone,
  MessagesSquareIcon,
  Clock,
  CircleMinus,
  StarIcon,
  MapPinIcon,
} from "lucide-react";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  type Announcement,
  type AnnouncementType,
} from "@/modules/announcement/types/announcement";
import type { HomeReviewSummary } from "@/modules/front-store/queries/get-home-review-summary";
import { formatThaiDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import ServiceSection from "./ServiceSection";

const ANNOUNCEMENT_TAG_COLORS: Record<AnnouncementType, string> = {
  NEWS: "bg-blue-100 text-blue-600 border-blue-200 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  PROMOTION: "bg-orange-100 text-orange-600 border-orange-200 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  ALERT: "bg-red-100 text-red-600 border-red-200 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

const FEATURES = [
  {
    title: "ดูแลด้วยหัวใจ",
    desc: "เราปฏิบัติกับสัตว์เลี้ยงทุกตัวเหมือนเป็นสมาชิกในครอบครัวของเราเอง",
    icon: (
      <Heart
        className="size-5 md:size-6 text-pink-500"
        fill="currentColor"
        fillOpacity={0.2}
      />
    ),
    color: "bg-pink-50 dark:bg-pink-950/40",
  },
  {
    title: "ช่างมืออาชีพ",
    desc: "ทีมงานผ่านการฝึกอบรมและมีประสบการณ์ยาวนาน มั่นใจในฝีมือได้",
    icon: <Scissors className="size-5 md:size-6 text-orange-500" />,
    color: "bg-orange-50 dark:bg-orange-950/40",
  },
  {
    title: "ผลิตภัณฑ์คุณภาพ",
    desc: "เลือกใช้แชมพูและผลิตภัณฑ์ออร์แกนิก ปลอดภัยและอ่อนโยนต่อผิว",
    icon: (
      <Star
        className="size-5 md:size-6 text-emerald-500"
        fill="currentColor"
        fillOpacity={0.2}
      />
    ),
    color: "bg-emerald-50 dark:bg-emerald-950/40",
  },
];

type HomeClientProps = {
  announcements: Announcement[];
  reviewSummary: HomeReviewSummary;
};

function formatAnnouncementDate(announcement: Announcement): string {
  const startDate = formatThaiDate(announcement.startDisplayAt);

  if (!announcement.endDisplayAt) {
    return startDate;
  }

  const endDate = formatThaiDate(announcement.endDisplayAt);

  return `${startDate} - ${endDate}`;
}

function formatReviewCount(totalReviews: number): string {
  return `จากทั้งหมด ${totalReviews} รีวิว`;
}

export default function HomeClient({
  announcements,
  reviewSummary,
}: HomeClientProps) {
  const hasAnnouncements = announcements.length > 0;
  const hasReviews = reviewSummary.totalReviews > 0;
  const summaryStarCount = Math.floor(reviewSummary.averageRating);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 overflow-x-hidden p-4 font-noto-thai md:p-8">
      {/* --- Hero Banner Section --- */}
      <section className="w-full">
        <Link href="/appointments/new" className="group block">
          <div className="relative flex min-h-[200px] items-center overflow-hidden rounded-3xl border bg-linear-to-br from-blue-100 via-card to-blue-50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md md:min-h-[280px] dark:from-blue-950/50 dark:via-card dark:to-sky-950/30">
            {/* Content Section: ชิดซ้ายเสมอ */}
            <div className="z-10 flex flex-col items-start gap-1 md:gap-2 px-6 py-6 md:py-10 md:pl-10 w-full md:w-2/3 font-noto-thai">
              <div className="mb-2 flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 md:text-xs dark:text-blue-300">
                <Sparkles size={12} />{" "}
                <span className="pt-1 font-noto-thai">
                  Welcome to Pet House
                </span>
              </div>
              <div className="flex md:flex-row flex-col gap-1">
                <h2 className="font-black text-primary text-xl md:text-3xl">
                  บริการด้วยรัก
                </h2>
                <h2 className="text-xl font-black text-blue-600 md:text-3xl dark:text-blue-300">
                  เพื่อเพื่อนสี่ขา
                </h2>
              </div>

              <p className="max-w-[160px] md:max-w-[360px] font-medium text-muted-foreground text-xs md:text-base leading-relaxed">
                เราดูแลสัตว์เลี้ยงของคุณ เหมือนเป็นสมาชิกในครอบครัว
              </p>

              <div className="mt-2 hidden w-fit items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition-all group-hover:bg-primary/80 md:inline-flex md:px-6 md:py-3 md:text-sm">
                จองคิวเลย <ArrowRight size={16} />
              </div>
            </div>

            {/* Image Section: ชิดขวาล่าง */}
            <div className="right-0 bottom-0 absolute w-[140px] md:w-[300px] aspect-square group-hover:scale-105 transition-transform duration-500">
              <Image
                src="/images/dog-cat.png"
                alt="dog-cat"
                fill
                priority
                sizes="(max-width: 768px) 140px, 300px" // เพิ่มตามที่ Next.js แนะนำ
                style={{ objectFit: "contain", objectPosition: "right bottom" }}
              />
            </div>

            {/* ตกแต่งพื้นหลังเดิม */}
            <div className="absolute right-[-20px] top-[-20px] z-0 size-24 rounded-full bg-blue-200/40 blur-2xl dark:bg-blue-400/10" />
          </div>
        </Link>
      </section>

      {/* --- Features Section --- */}
      <section className="gap-6 grid grid-cols-1 md:grid-cols-3">
        {FEATURES.map((item, index) => (
          <div
            key={index}
            className="group flex h-full flex-col items-center rounded-3xl border bg-card p-6 text-center text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md md:p-8"
          >
            <div
              className={`mb-4 flex size-14 items-center justify-center rounded-2xl ${item.color} shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3`}
            >
              {item.icon}
            </div>
            <h3 className="mb-3 font-bold text-primary text-base md:text-lg">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </section>

      {/* --- News & Promotion Section --- */}
      {hasAnnouncements ? (
        <section className="flex flex-col gap-6">
          <div className="flex justify-between items-end px-2">
            <div className="flex items-center gap-2">
              <div className="flex justify-center items-center bg-purple-500 shadow-md rounded-xl size-10 text-white">
                <Newspaper size={20} />
              </div>
              <h2 className="font-bold text-primary text-xl md:text-2xl tracking-tight">
                ข่าวสารและโปรโมชั่น
              </h2>
            </div>
            <Button
              variant="ghost"
              size="default"
              asChild
              className="gap-1 hover:bg-primary/5 rounded-xl font-bold text-primary hover:text-primary"
            >
              <Link href="/news">
                ดูทั้งหมด <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="w-full">
            <div className="flex flex-col gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {announcements.map((announcement) => (
                <Link
                  href={`/news/${announcement.id}`}
                  key={announcement.id}
                  className="group h-full"
                >
                  <div className="relative flex h-full items-center justify-between overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-muted/30 hover:shadow-md">
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
        </section>
      ) : null}
      <section className="space-y-6">
        <div className="px-2">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex justify-center items-center bg-blue-500 shadow-md rounded-xl size-10 text-white">
                <Scissors size={20} />
              </div>
              <h2 className="font-bold text-primary text-xl md:text-2xl tracking-tight">
                บริการของเรา
              </h2>
            </div>
            <Button
              variant="ghost"
              size="default"
              className="gap-1 hover:bg-primary/5 rounded-xl font-bold text-primary hover:text-primary"
              asChild
            >
              <Link href="/services">
                ดูทั้งหมด <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
        <ServiceSection />
      </section>

      {/* --- Review Section --- */}
      {hasReviews ? (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-2">
            <div className="flex justify-center items-center bg-amber-300 shadow-md rounded-xl size-10 text-white">
              <StarIcon size={20} />
            </div>
            <h2 className="font-bold text-primary text-xl md:text-2xl tracking-tight">
              รีวิวจากลูกค้า
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm transition-all duration-300 md:grid-cols-3">
            {/* Rating Summary */}
            <div className="flex flex-col items-center justify-center border-b bg-muted/20 p-8 md:border-b-0 md:border-r">
              <span className="font-black text-primary text-5xl">
                {reviewSummary.averageRating.toFixed(1)}
              </span>
              <div className="flex gap-1 my-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < summaryStarCount
                        ? "text-amber-300"
                        : "text-muted-foreground/30"
                    }
                    fill={i < summaryStarCount ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="font-medium text-muted-foreground text-sm">
                {formatReviewCount(reviewSummary.totalReviews)}
              </p>
            </div>

            {/* Recent Reviews List */}
            <div className="md:col-span-2 divide-y">
              {reviewSummary.recentReviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-3 p-6">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex gap-0.5 mb-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < review.rating
                                ? "text-amber-300"
                                : "text-muted-foreground/30"
                            }
                            fill={i < review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <p className="pt-2 font-bold text-sm md:text-base">
                        {review.customerName}
                      </p>
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* --- Contact & Map Section --- */}
      <section className="space-y-6" id="contact">
        <div className="flex items-center gap-2 px-2">
          <div className="flex justify-center items-center bg-pink-400 shadow-md rounded-xl size-10 text-white">
            <Heart size={20} />
          </div>
          <h2 className="font-bold text-primary text-xl md:text-2xl tracking-tight">
            ติดต่อเรา
          </h2>
        </div>

        <div className="grid min-h-[300px] grid-cols-1 overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm transition-all duration-300 md:grid-cols-2">
          {/* Contact Info */}
          <div className="flex flex-col justify-between p-8">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-full bg-purple-50 p-2.5 text-purple-600 md:p-3 dark:bg-purple-950/40 dark:text-purple-300">
                  <MapPinIcon size={20} />
                </div>
                <span className="font-medium text-sm md:text-base">
                  181/262 ม.3 ถ.โพธาราม ต.ช้างเผือก อ.เมืองเชียงใหม่ จ.เชียงใหม่
                  50300
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-full bg-blue-50 p-2.5 text-blue-600 md:p-3 dark:bg-blue-950/40 dark:text-blue-300">
                  <Phone size={20} />
                </div>
                <span className="font-medium text-sm md:text-base">
                  02-123-4567
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-full bg-green-50 p-3 text-green-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <MessagesSquareIcon size={20} />
                </div>
                <span className="font-medium text-sm md:text-base">
                  Line: @pethouse
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-full bg-amber-50 p-2.5 text-amber-500 md:p-3 dark:bg-amber-950/40 dark:text-amber-300">
                  <Clock size={20} />
                </div>
                <span className="font-medium text-sm md:text-base">
                  เวลาทำการ: 09:00 - 18:00 น.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-full bg-red-50 p-2.5 text-red-600 md:p-3 dark:bg-red-950/40 dark:text-red-300">
                  <CircleMinus size={20} />
                </div>
                <span className="font-medium text-sm md:text-base">
                  หยุดทุกวันพุธ
                </span>
              </div>
            </div>
            <Link
              href="https://maps.app.goo.gl/8WKB4wQfbSdFzmsC8"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="default" variant="default" className="mt-6 w-full">
                นำทางด้วย Google Maps
              </Button>
            </Link>
          </div>

          {/* Map Placeholder */}
          <div className="relative flex min-h-[300px] items-center justify-center border-t bg-muted md:min-h-full md:border-l md:border-t-0">
            <div className="relative w-full h-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3776.5973276347704!2d98.97358009999999!3d18.816090300000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30da3a5e66946fef%3A0x65d0bf3f6cd81426!2zUGV0IGhvdXNlIOC4muC4o-C4tOC4geC4suC4o-C4reC4suC4muC4meC5ieC4s-C4leC4seC4lOC4guC4meC4quC4uOC4meC4seC4guC5geC4peC4sOC5geC4oeC4pw!5e0!3m2!1sth!2sth!4v1778316518466!5m2!1sth!2sth"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
