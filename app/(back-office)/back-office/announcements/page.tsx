import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireAdminAndOwner } from "@/lib/session";
import { AnnouncementManagement } from "@/modules/announcement/components/AnnouncementManagement";
import {
  listAnnouncements,
  parseAnnouncementPage,
  parseAnnouncementStatusFilter,
  parseAnnouncementTypeFilter,
} from "@/modules/announcement/queries/list-announcements";

export const metadata: Metadata = {
  title: "จัดการประกาศ",
  description: "สร้าง แก้ไข และจัดการประกาศข่าวสารของร้าน",
};

type AnnouncementsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
    status?: string;
  }>;
};

export default async function AnnouncementsPage({
  searchParams,
}: AnnouncementsPageProps) {
  await requireAdminAndOwner();

  const query = await searchParams;
  const announcements = await listAnnouncements({
    page: parseAnnouncementPage(query.page),
    q: query.q,
    type: parseAnnouncementTypeFilter(query.type),
    status: parseAnnouncementStatusFilter(query.status),
  });

  if (!announcements.success) {
    throw new Error(announcements.error);
  }

  return (
    <>
      <SiteHeader title="จัดการประกาศ" />
      <BackOfficeContainer>
        <AnnouncementManagement {...announcements.data} />
      </BackOfficeContainer>
    </>
  );
}
