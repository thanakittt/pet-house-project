"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TransactionForm } from "../types/transaction";
import { createTransaction } from "../actions/create-transaction";
import { TransactionCategory } from "@/modules/transaction-category/types/transaction-category";
import { format } from "date-fns";

interface CreateTransactionDialogProps {
  categories: TransactionCategory[];
}

export function CreateTransactionDialog({ categories }: CreateTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  const onSubmit = async (data: TransactionForm) => {
    try {
      setServerError(null);
      const result = await createTransaction(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("สร้างรายการเคลื่อนไหวสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateTransaction Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างรายการ");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset();
          setServerError(null);
        }
        setOpen(value);
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-transaction-form">
        <DialogTrigger asChild>
          <Button type="button">
            <PlusIcon className="size-3.5 mr-2" /> สร้างรายการ
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">เพิ่มรายการเคลื่อนไหว</DialogTitle>
            <DialogDescription>บันทึกรายรับหรือรายจ่ายแบบ Manual</DialogDescription>
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
                  <FieldLabel htmlFor="transactionDate">วันที่</FieldLabel>
                  <Input
                    type="date"
                    id="transactionDate"
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
                  <FieldLabel htmlFor="transactionCategoryId">หมวดหมู่</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="transactionCategoryId" aria-invalid={fieldState.invalid}>
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
                  <FieldLabel htmlFor="amount">จำนวนเงิน</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    id="amount"
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
                  <FieldLabel htmlFor="note">รายการ / หมายเหตุ</FieldLabel>
                  <Input
                    {...field}
                    id="note"
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
              <Button
                type="submit"
                form="create-transaction-form"
                className="px-6 py-5 text-sm cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
