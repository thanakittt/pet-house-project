"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { TableActionButton } from "@/components/shared/TableActionButton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Image from "next/image";
import { useState } from "react";
import { deleteAnnouncement } from "../actions/delete-announcement";
import type { ListAnnouncementsResult } from "../queries/list-announcements";
import {
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_TYPE_LABELS,
  getAnnouncementStatus,
  type Announcement,
  type AnnouncementStatus,
} from "../types/announcement";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { UpdateAnnouncementDialog } from "./UpdateAnnouncementDialog";

const typeOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกประเภท" },
  { value: "NEWS", label: ANNOUNCEMENT_TYPE_LABELS.NEWS },
  { value: "PROMOTION", label: ANNOUNCEMENT_TYPE_LABELS.PROMOTION },
  { value: "ALERT", label: ANNOUNCEMENT_TYPE_LABELS.ALERT },
];

const statusOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกสถานะ" },
  { value: "ACTIVE", label: ANNOUNCEMENT_STATUS_LABELS.ACTIVE },
  { value: "SCHEDULED", label: ANNOUNCEMENT_STATUS_LABELS.SCHEDULED },
  { value: "EXPIRED", label: ANNOUNCEMENT_STATUS_LABELS.EXPIRED },
  { value: "INACTIVE", label: ANNOUNCEMENT_STATUS_LABELS.INACTIVE },
];

const statusBadgeVariant: Record<
  AnnouncementStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  SCHEDULED: "secondary",
  EXPIRED: "outline",
  INACTIVE: "destructive",
};

function formatThaiDateTime(date: Date | null): string {
  if (!date) {
    return "-";
  }

  return format(date, "d MMM yyyy HH:mm", { locale: th });
}

export function AnnouncementManagement({
  announcements,
  total,
  page,
  pageSize,
  totalPages,
  q,
  type,
  status,
}: ListAnnouncementsResult) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาประกาศ",
          placeholder: "ค้นหาหัวข้อหรือเนื้อหาประกาศ",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองประเภทประกาศ",
            name: "type",
            options: typeOptions,
            placeholder: "ประเภท",
            value: type,
          },
          {
            ariaLabel: "กรองสถานะประกาศ",
            name: "status",
            options: statusOptions,
            placeholder: "สถานะ",
            value: status,
          },
        ]}
        createAction={<CreateAnnouncementDialog />}
      />

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>หัวข้อ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>เริ่มแสดง</TableHead>
              <TableHead>สิ้นสุด</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.length > 0 ? (
              announcements.map((announcement) => {
                const computedStatus = getAnnouncementStatus(announcement);

                return (
                  <TableRow key={announcement.id}>
                    <TableCell className="max-w-[260px]">
                      <div className="flex items-start gap-3">
                        {announcement.imageUrl && (
                          <div className="relative bg-muted/40 border rounded-md size-14 overflow-hidden shrink-0">
                            <Image
                              src={announcement.imageUrl}
                              alt=""
                              fill
                              sizes="56px"
                              className="p-0.5 object-contain"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-medium">
                            {announcement.title}
                          </span>
                          <span className="text-muted-foreground text-sm line-clamp-2">
                            {announcement.content}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[computedStatus]}>
                        {ANNOUNCEMENT_STATUS_LABELS[computedStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatThaiDateTime(announcement.startDisplayAt)}
                    </TableCell>
                    <TableCell>
                      {formatThaiDateTime(announcement.endDisplayAt)}
                    </TableCell>
                    <TableCell>
                      {formatThaiDateTime(announcement.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TableActionButton
                          aria-label="แก้ไขข้อมูล"
                          action="edit"
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
                            setIsUpdateDialogOpen(true);
                          }}
                        />

                        <TableActionButton
                          aria-label="ลบข้อมูล"
                          action="delete"
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
                            setIsDeleteDialogOpen(true);
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  ไม่พบข้อมูลประกาศ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ManagementPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />

      {selectedAnnouncement && (
        <>
          <UpdateAnnouncementDialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            announcement={selectedAnnouncement}
          />

          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบประกาศ"
            description={`คุณต้องการลบประกาศ "${selectedAnnouncement.title}" หรือไม่?`}
            onConfirm={() => deleteAnnouncement({ id: selectedAnnouncement.id })}
            successMessage="ลบประกาศเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบประกาศ"
            mode="delete"
          />
        </>
      )}
    </>
  );
}
