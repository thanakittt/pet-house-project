import { SiteHeader } from "@/components/site-header";
import { requireAdminAndOwner } from "@/lib/session";
import { AnnouncementManagement } from "@/modules/announcement/components/AnnouncementManagement";
import {
  listAnnouncements,
  parseAnnouncementPage,
  parseAnnouncementStatusFilter,
  parseAnnouncementTypeFilter,
} from "@/modules/announcement/queries/list-announcements";

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
      <div className="p-6">
        <AnnouncementManagement {...announcements.data} />
      </div>
    </>
  );
}
