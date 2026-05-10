import type { Metadata } from "next";
import HomeClient from "@/modules/front-store/components/HomeClient";
import { listLatestPublicAnnouncements } from "@/modules/announcement/queries/list-public-announcements";
import { getHomeReviewSummary } from "@/modules/front-store/queries/get-home-review-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "หน้าหลัก",
  description: "เข้าสู่หน้าหลักของ Pet House",
};

export default async function HomePage() {
  // ดึงข้อมูลหน้าแรกแบบขนาน เพราะข่าวและรีวิวไม่ต้องรอกัน
  const [announcementsResult, reviewSummary] = await Promise.all([
    listLatestPublicAnnouncements({ limit: 3 }),
    getHomeReviewSummary(2),
  ]);

  if (!announcementsResult.success) {
    throw new Error(announcementsResult.error);
  }

  return (
    <HomeClient
      announcements={announcementsResult.data}
      reviewSummary={reviewSummary}
    />
  );
}
