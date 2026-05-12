"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_CONFIG } from "@/lib/constants/appointment-status";
import { cn } from "@/lib/utils";
import { createCustomerReview } from "@/modules/appointment/actions/create-customer-review";
import type {
  CustomerAppointmentListItem,
  CustomerAppointmentsResult,
} from "@/modules/appointment/queries/get-customer-appointments";
import PetTypeBadge from "@/modules/pet/components/PetTypeBadge";
import LineNotificationAlert from "./LineNotificationAlert";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import {
  Calendar,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Eye,
  MessageSquare,
  Star,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type CustomerAppointmentProps = {
  appointmentData: CustomerAppointmentsResult;
};

function getPetTypeForBadge(species: CustomerAppointmentListItem["species"]) {
  return species.toLowerCase();
}

function formatAppointmentDate(date: string) {
  return format(parseISO(date), "d MMM yyyy", { locale: th });
}

function formatAppointmentTime(time: string) {
  if (!time) {
    return "-";
  }

  return format(parseISO(time), "HH:mm", { locale: th });
}

function CustomerReviewDialog({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setRating(5);
    setComment("");
    setError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  }

  function handleSubmit() {
    setError("");

    startTransition(async () => {
      const result = await createCustomerReview({
        appointmentId,
        rating,
        comment,
      });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("บันทึกรีวิวเรียบร้อย");
      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 hover:bg-primary/5 px-6 border-2 border-primary/30 border-dashed rounded-xl w-full sm:w-auto h-12 font-bold text-primary"
        >
          <MessageSquare className="size-4" />
          รีวิวบริการนี้
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>รีวิวบริการ</DialogTitle>
          <DialogDescription>
            ให้คะแนนและเล่าประสบการณ์หลังใช้บริการครั้งนี้
          </DialogDescription>
          {error ? (
            <DialogDescription className="text-destructive">
              {error}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>คะแนนบริการ</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="rounded-full p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setRating(star)}
                  aria-label={`ให้คะแนน ${star} ดาว`}
                >
                  <Star
                    className={cn(
                      "size-8",
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-comment-${appointmentId}`}>
              ความคิดเห็นเพิ่มเติม
            </Label>
            <Textarea
              id={`review-comment-${appointmentId}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="เล่าความประทับใจ หรือสิ่งที่อยากให้ร้านปรับปรุง"
              className="min-h-28 resize-none"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            ยกเลิก
          </Button>
          <LoadingButton
            type="button"
            onClick={handleSubmit}
            isLoading={isPending}
            loadingText="กำลังบันทึก..."
          >
            ส่งรีวิว
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerAppointment({
  appointmentData,
}: CustomerAppointmentProps) {
  const { appointments, page, pageSize, total, totalPages } = appointmentData;
  const resultStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const resultEnd = Math.min(page * pageSize, total);
  const hasPreviousPage = page > 1;
  const hasNextPage = totalPages > 0 && page < totalPages;

  return (
    <div className="space-y-6 mx-auto mt-5 p-4 max-w-5xl animate-in duration-700">
      <div className="flex flex-col space-y-2">
        <h1 className="font-extrabold text-primary text-2xl md:text-3xl tracking-tight">
          ประวัติการใช้บริการ
        </h1>
      </div>

      {!appointmentData.hasLineConnection ? <LineNotificationAlert /> : null}

      {appointments.length === 0 ? (
        <div className="bg-white shadow-sm p-10 border border-slate-200 border-dashed rounded-3xl text-center">
          <Calendar className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h2 className="font-bold text-primary text-xl">
            ยังไม่มีประวัติการใช้บริการ
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
            เมื่อลูกค้าจองคิวหรือใช้บริการแล้ว รายการทั้งหมดจะแสดงอยู่ที่หน้านี้
          </p>
          <Button asChild className="mt-6">
            <Link href="/appointments/new">จองคิวใหม่</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status];
            const review = item.review;
            const hasReview = item.status === "COMPLETED" && review;
            const canReview = item.status === "COMPLETED" && !item.review;

            return (
              <div
                key={item.id}
                className="group relative bg-white shadow-sm hover:shadow-primary/5 hover:shadow-xl border border-slate-100 rounded-3xl overflow-hidden transition-all duration-300"
              >
                <div className="top-6 right-6 absolute">
                  <Badge
                    variant="outline"
                    className={cn(
                      "shadow-none px-4 py-1.5 border rounded-full font-semibold transition-colors",
                      statusConfig.colorClass,
                    )}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="space-y-6 p-6 md:p-8">
                  <div className="flex md:flex-row flex-col items-start gap-6">
                    <div className="relative mt-2 md:mt-0 shrink-0">
                      <PetTypeBadge type={getPetTypeForBadge(item.species)} />
                    </div>

                    <div className="flex-1 space-y-3 w-full">
                      <div className="space-y-1 pr-28 md:pr-0">
                        <h3 className="font-bold text-primary text-xl md:text-2xl transition-colors">
                          {item.petName || "-"}
                          <span className="ml-3 font-medium text-muted-foreground text-sm uppercase tracking-widest">
                            {item.breed || "-"}
                          </span>
                        </h3>
                        <p className="font-medium text-md text-muted-foreground md:text-lg">
                          {item.services || "-"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                        <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg font-medium">
                          <Calendar className="size-4 text-primary" />
                          {formatAppointmentDate(item.date)}
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg font-medium">
                          <Clock className="size-4 text-primary" />
                          {formatAppointmentTime(item.time)} น.
                        </div>
                      </div>

                      <div className="md:hidden block pt-2">
                        <Button
                          asChild
                          variant="secondary"
                          className="hover:bg-primary/10 w-full text-muted-foreground hover:text-primary transition-all"
                        >
                          <Link href={`/appointments/${item.id}`}>
                            <Eye className="mr-2 size-4" />
                            ดูรายละเอียดนัดหมาย
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <Link
                      href={`/appointments/${item.id}`}
                      className="hidden md:flex self-center hover:bg-muted p-3 rounded-full text-muted-foreground hover:text-primary transition-all"
                      aria-label="ดูรายละเอียดนัดหมาย"
                    >
                      <ChevronRight className="size-8" />
                    </Link>
                  </div>

                  <Separator className="hidden md:block bg-slate-100" />

                  <div className="flex sm:flex-row flex-col justify-between items-center gap-6">
                    <div className="w-full sm:w-auto">
                      {hasReview ? (
                        <div className="space-y-2 bg-amber-50/50 p-4 border border-amber-100/50 rounded-2xl">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={cn(
                                  "size-4",
                                  index < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200",
                                )}
                              />
                            ))}
                          </div>
                          {review.comment ? (
                            <p className="text-muted-foreground text-sm italic leading-relaxed">
                              &quot;{review.comment}&quot;
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        canReview && (
                          <CustomerReviewDialog appointmentId={item.id} />
                        )
                      )}
                    </div>

                    <div className="flex justify-between sm:justify-end items-center gap-6 pt-4 sm:pt-0 sm:border-0 border-t w-full sm:w-auto">
                      <div className="text-right">
                        <p className="font-bold text-muted-foreground text-xs uppercase tracking-tighter">
                          ยอดสุทธิ
                        </p>
                        <p className="font-black text-primary text-2xl">
                          ฿{item.price.toLocaleString()}
                        </p>
                      </div>

                      {item.status === "PENDING_DEPOSIT" && (
                        <Button
                          asChild
                          variant="default"
                          size="default"
                          className="hover:bg-primary/80 transition-all"
                        >
                          <Link href="/appointments/new">
                            <Wallet className="size-4" />
                            ชำระเงิน
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 bg-white shadow-sm p-4 border border-slate-100 rounded-2xl">
            <p className="font-medium text-muted-foreground text-sm">
              แสดง {resultStart}-{resultEnd} จาก {total} รายการ
            </p>

            <div className="flex justify-between sm:justify-end items-center gap-3">
              {hasPreviousPage ? (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/appointments?page=${page - 1}`}>
                    <ChevronsLeft className="size-4" />
                    ก่อนหน้า
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  <ChevronsLeft className="size-4" />
                  ก่อนหน้า
                </Button>
              )}

              <span className="bg-muted px-3 py-1 rounded-full font-semibold text-primary text-sm">
                หน้า {totalPages === 0 ? 0 : page} จาก {totalPages}
              </span>

              {hasNextPage ? (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/appointments?page=${page + 1}`}>
                    ถัดไป
                    <ChevronsRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  ถัดไป
                  <ChevronsRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
