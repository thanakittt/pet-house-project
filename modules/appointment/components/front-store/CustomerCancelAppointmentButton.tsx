"use client";

import { LoadingButtonContent } from "@/components/shared/LoadingButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cancelCustomerAppointment } from "@/modules/appointment/actions/cancel-customer-appointment";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const CANCEL_APPOINTMENT_LABEL = "ยกเลิกการจอง";
const CANCEL_SUCCESS_MESSAGE = "ยกเลิกแล้ว";
const CONFIRM_TITLE = "ยืนยันการยกเลิก";
const CONFIRM_DESCRIPTION = "คิวนี้จะถูกยกเลิกและจองใหม่ได้";
const BACK_LABEL = "กลับไปก่อน";
const CANCELLING_LABEL = "กำลังยกเลิก...";
const CONFIRM_CANCEL_LABEL = "ยืนยันยกเลิก";

type CustomerCancelAppointmentButtonProps = {
  appointmentId: string;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  label?: string;
};

export default function CustomerCancelAppointmentButton({
  appointmentId,
  className,
  size = "sm",
  label = CANCEL_APPOINTMENT_LABEL,
}: CustomerCancelAppointmentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await cancelCustomerAppointment(appointmentId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(CANCEL_SUCCESS_MESSAGE);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size={size}
          className={cn("gap-1.5", className)}
        >
          <XCircle data-icon="inline-start" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{CONFIRM_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{CONFIRM_DESCRIPTION}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {BACK_LABEL}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
          >
            <LoadingButtonContent
              isLoading={isPending}
              loadingText={CANCELLING_LABEL}
            >
              {CONFIRM_CANCEL_LABEL}
            </LoadingButtonContent>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
