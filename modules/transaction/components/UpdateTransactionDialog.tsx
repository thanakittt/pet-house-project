"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Transaction, TransactionForm } from "../types/transaction";
import { updateTransaction } from "../actions/update-transaction";
import { TransactionCategory } from "@/modules/transaction-category/types/transaction-category";
import { format } from "date-fns";

interface UpdateTransactionDialogProps {
  transaction: Transaction | null;
  categories: TransactionCategory[];
  onClose: () => void;
}

export function UpdateTransactionDialog({
  transaction,
  categories,
  onClose,
}: UpdateTransactionDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TransactionForm>({
    defaultValues: {
      amount: undefined,
      transactionDate: new Date(),
      note: "",
      transactionCategoryId: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        note: transaction.note || "",
        transactionCategoryId: transaction.categoryId,
      });
    }
  }, [transaction, form]);

  const onSubmit = async (data: TransactionForm) => {
    if (!transaction) return;

    try {
      setServerError(null);
      const result = await updateTransaction(transaction.id, data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success("แก้ไขรายการเคลื่อนไหวสำเร็จ");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("UpdateTransaction Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขรายการ");
    }
  };

  return (
    <Dialog
      open={!!transaction}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setServerError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="md:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} id="update-transaction-form">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">แก้ไขรายการเคลื่อนไหว</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลรายรับหรือรายจ่าย</DialogDescription>
            {serverError && <DialogDescription className="text-destructive">{serverError}</DialogDescription>}
          </DialogHeader>
          <Separator />

          <FieldGroup className="gap-3 px-4 pb-3">
            <Controller
              name="transactionDate"
              control={form.control}
              rules={{ required: "กรุณาระบุวันที่" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-transactionDate">วันที่</FieldLabel>
                  <Input
                    type="date"
                    id="update-transactionDate"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const d = e.target.value ? new Date(e.target.value) : undefined;
                      field.onChange(d);
                    }}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="transactionCategoryId"
              control={form.control}
              rules={{ required: "กรุณาเลือกหมวดหมู่" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-transactionCategoryId">หมวดหมู่</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="update-transactionCategoryId" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({cat.type === "INCOME" ? "รายรับ" : "รายจ่าย"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="amount"
              control={form.control}
              rules={{
                required: "กรุณาระบุจำนวนเงิน",
                min: { value: 0.01, message: "จำนวนเงินต้องมากกว่า 0" },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-amount">จำนวนเงิน</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    id="update-amount"
                    value={field.value === undefined ? "" : field.value}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? undefined : val);
                    }}
                    aria-invalid={fieldState.invalid}
                    placeholder="0.00"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-note">รายการ / หมายเหตุ</FieldLabel>
                  <Input
                    {...field}
                    id="update-note"
                    value={field.value || ""}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุหมายเหตุ (ถ้ามี)"
                    autoComplete="off"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="px-6 py-5 text-sm cursor-pointer">
                  ยกเลิก
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                form="update-transaction-form"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
