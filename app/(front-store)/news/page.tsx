import { Button } from "@/components/ui/button";
import AnnouncementList from "@/modules/announcement/components/AnnouncementList";
import {
  listPublicAnnouncements,
  parsePublicAnnouncementPage,
  type ListPublicAnnouncementsResult,
} from "@/modules/announcement/queries/list-public-announcements";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type NewsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

function buildNewsPageHref(page: number): string {
  return page <= 1 ? "/news" : `/news?page=${page}`;
}

function NewsPagination({
  page,
  pageSize,
  total,
  totalPages,
}: Pick<
  ListPublicAnnouncementsResult,
  "page" | "pageSize" | "total" | "totalPages"
>) {
  if (total === 0) {
    return null;
  }

  const resultStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const resultEnd = Math.min(page * pageSize, total);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        แสดง {resultStart}-{resultEnd} จาก {total} รายการ
      </p>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span>
          หน้า {page} จาก {totalPages}
        </span>
        <div className="flex gap-2">
          {hasPreviousPage ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildNewsPageHref(page - 1)}>
                <ChevronLeftIcon data-icon="inline-start" />
                ก่อนหน้า
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeftIcon data-icon="inline-start" />
              ก่อนหน้า
            </Button>
          )}

          {hasNextPage ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildNewsPageHref(page + 1)}>
                ถัดไป
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              ถัดไป
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page } = await searchParams;
  const result = await listPublicAnnouncements({
    page: parsePublicAnnouncementPage(page),
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <div className="space-y-4 mx-auto p-4 md:p-8 max-w-5xl">
      <AnnouncementList
        announcements={result.data.announcements}
        className="gap-4 grid grid-cols-1"
      />
      <NewsPagination
        page={result.data.page}
        pageSize={result.data.pageSize}
        total={result.data.total}
        totalPages={result.data.totalPages}
      />
    </div>
  );
}
