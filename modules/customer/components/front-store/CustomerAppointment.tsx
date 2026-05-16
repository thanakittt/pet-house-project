"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
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
import { cn, formatThaiDate } from "@/lib/utils";
import { createCustomerReview } from "@/modules/appointment/actions/create-customer-review";
import type { CustomerAppointmentsResult } from "@/modules/appointment/queries/get-customer-appointments";
import LineNotificationAlert from "./LineNotificationAlert";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import {
  Calendar,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock,
  MessageSquare,
  PawPrint,
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

function buildAppointmentPageHref(page: number): string {
  return page <= 1 ? "/appointments" : `/appointments?page=${page}`;
}

function formatAppointmentDate(date: string) {
  return formatThaiDate(date);
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
          size="lg"
          className="gap-2 hover:border-primary/30 hover:bg-primary/5 font-semibold text-muted-foreground transition-all duration-300"
        >
          <MessageSquare className="size-3.5" />
          เขียนรีวิวบริการ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">รีวิวบริการ</DialogTitle>
          <DialogDescription>
            ให้คะแนนและเล่าประสบการณ์หลังใช้บริการครั้งนี้ เพื่อให้เราพัฒนาให้ดียิ่งขึ้น
          </DialogDescription>
          {error ? (
            <DialogDescription className="text-destructive font-medium">
              {error}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-5 py-2 items-center justify-center">
          <div className="space-y-2">
            <Label className="text-primary font-medium text-sm">คะแนนบริการ</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="rounded-full p-0.5 transition hover:scale-110 focus-visible:outline-none"
                  onClick={() => setRating(star)}
                  aria-label={`ให้คะแนน ${star} ดาว`}
                >
                  <Star
                    className={cn(
                      "size-7 transition-colors",
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
            <Label htmlFor={`review-comment-${appointmentId}`} className="text-primary font-medium text-sm">
              ความคิดเห็นเพิ่มเติม
            </Label>
            <Textarea
              id={`review-comment-${appointmentId}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="เล่าความประทับใจ หรือสิ่งที่อยากให้ร้านปรับปรุง..."
              className="min-h-24 resize-none rounded-xl border-slate-200 focus-visible:ring-primary/20"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="rounded-xl"
          >
            ยกเลิก
          </Button>
          <LoadingButton
            type="button"
            onClick={handleSubmit}
            isLoading={isPending}
            loadingText="กำลังบันทึก..."
            className="rounded-xl px-5"
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
    <div className="space-y-6 mx-auto p-4 max-w-4xl animate-in duration-500 fade-in-50">
      <header className="mb-5 mt-3">
        <h1 className="text-pretty text-xl font-bold md:text-2xl">
          ประวัติการใช้บริการ
        </h1>
      </header>

      {!appointmentData.hasLineConnection ? <LineNotificationAlert /> : null}

      {appointments.length === 0 ? (
        <div className="bg-white p-12 border border-slate-100 rounded-2xl text-center shadow-sm">
          <div className="mx-auto mb-4 size-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
            <Calendar className="size-5 text-slate-400" />
          </div>
          <h2 className="font-semibold text-primary text-lg">
            ยังไม่มีประวัติการใช้บริการ
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-muted-foreground text-xs leading-relaxed">
            เมื่อคุณทำการนัดหมายหรือเข้าใช้บริการเสร็จสิ้น รายการนัดหมายจะแสดงขึ้นที่นี่
          </p>
          <Button asChild className="mt-5 rounded-xl px-5 shadow-sm">
            <Link href="/appointments/new">ทำการนัดหมายใหม่</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((item) => {
            const review = item.review;
            const hasReview = item.status === "COMPLETED" && review;
            const canReview = item.status === "COMPLETED" && !item.review;

            return (
              <div
                key={item.id}
                className="group relative bg-white border border-slate-100 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden shadow-sm hover:shadow-md"
              >
                {/* Main clickable area linking to details */}
                <Link href={`/appointments/${item.id}`} className="block p-5 md:p-6">
                  <div className="flex flex-col gap-5">

                    {/* Top block: Header info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="size-11 md:size-12 bg-taupe-100 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner text-taupe-800">
                          <PawPrint className="size-5 md:size-6 stroke-[1.5]" />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-semibold text-primary text-lg md:text-xl tracking-tight">
                            {item.petName || "-"}
                            {item.breed && (
                              <span className="ml-2 font-normal text-muted-foreground/80 text-xs md:text-sm tracking-normal">
                                ({item.breed})
                              </span>
                            )}
                          </h3>
                          <p className="text-muted-foreground/90 font-normal text-xs md:text-sm line-clamp-1">
                            {item.services || "ทั่วไป"}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        <AppointmentStatusBadge
                          status={item.status}
                          size="md"
                          className="shadow-none px-3.5 py-1 rounded-full text-xs font-medium"
                        />
                      </div>
                    </div>

                    {/* Middle block: DateTime tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 bg-muted/50 border border-primary/10 px-3 py-1.5 rounded-full font-medium">
                        <Calendar className="size-3.5" />
                        {formatAppointmentDate(item.date)}
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted/50 border border-primary/10 px-3 py-1.5 rounded-full font-medium">
                        <Clock className="size-3.5 text-" />
                        {formatAppointmentTime(item.time)} น.
                      </div>
                    </div>

                    <Separator className="bg-muted" />

                    {/* Bottom block: Price and Custom actions zone */}
                    <div className="flex flex-row justify-between items-center gap-">
                      {/* Left: Star Review Status */}
                      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        {hasReview ? (
                          <div className="flex items-center gap-1 bg-amber-50/40 border border-amber-100/50 px-2.5 py-1 rounded-lg w-fit">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={cn(
                                    "size-3",
                                    idx < review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200",
                                  )}
                                />
                              ))}
                            </div>
                            {review.comment && (
                              <span className="text-[11px] text-amber-700/80 font-medium ml-1 truncate max-w-[120px] md:max-w-[240px] hidden sm:inline">
                                &quot;{review.comment}&quot;
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Right: Net Total Price display */}
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          ยอดสุทธิ
                        </p>
                        <p className="font-bold text-primary text-xl md:text-2xl tracking-tight">
                          ฿{item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                  </div>
                </Link>

                {/* Floating Interactive Buttons Zone (To bypass main link trigger) */}
                <div
                  className="absolute bottom-6 left-5 flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {canReview && (
                    <CustomerReviewDialog appointmentId={item.id} />
                  )}

                  {item.status === "PENDING_DEPOSIT" && (
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="gap-1.5 rounded-xl shadow-sm text-xs h-10 px-4 transition-all"
                    >
                      <Link href="/appointments/new">
                        <Wallet className="size-3.5" />
                        ชำระเงิน
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="absolute right-10 top-20 my-auto flex opacity-100 pointer-events-none translate-x-2 group-hover:translate-x-0 transition-all duration-300 md:hidden">
                  <ChevronRightIcon className="size-6 text-primary" />
                </div>

              </div>
            );
          })}

          {/* Pagination Section */}
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
                    <Link href={buildAppointmentPageHref(page - 1)}>
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
                    <Link href={buildAppointmentPageHref(page + 1)}>
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
        </div>
      )}
    </div>
  );
}
