import AnnouncementList from "@/modules/announcement/components/AnnouncementList";
import { listPublicAnnouncements } from "@/modules/announcement/queries/list-public-announcements";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const result = await listPublicAnnouncements();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <div className="space-y-4 mx-auto p-4 md:p-8 max-w-5xl">
      <AnnouncementList
        announcements={result.data}
        className="gap-4 grid grid-cols-1"
      />
    </div>
  );
}
