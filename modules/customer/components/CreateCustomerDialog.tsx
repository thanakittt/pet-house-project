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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerForm } from "../types/create-customer";
import { createCustomer } from "../actions/create-customer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


export function CreateCustomerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      nickname: "",
      walkInPhoneNumber: "",
      gender: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: CustomerForm) => {
    try {
      setServerError(null);

      const newCustomer = {
        nickname: data.nickname,
        walkInPhoneNumber: data.walkInPhoneNumber,
        gender: data.gender || "UNSPECIFIED",
      };

      const result = await createCustomer(newCustomer);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("สร้างลูกค้าสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateCustomer Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างลูกค้า");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-customer">
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button>
            {" "}
            <PlusIcon className="size-3.5" /> เพิ่มลูกค้าใหม่
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มลูกค้าใหม่
            </DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลลูกค้าใหม่</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Nickname Field */}
            <Controller
              name="nickname"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อลูกค้า",
                maxLength: {
                  value: 100,
                  message: "ชื่อลูกค้าไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อลูกค้า</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุชื่อลูกค้า"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex items-start gap-2">
              {/* Walk-in Phone Number Field */}
              <Controller
                name="walkInPhoneNumber"
                control={form.control}
                rules={{
                  required: "กรุณาระบุเบอร์โทรศัพท์",
                  validate: (value) => {
                    if (value.length !== 10) {
                      return "เบอร์โทรศัพท์ต้องมี 10 หลัก";
                    }
                    return true;
                  },
                  pattern: {
                    value: /^[0-9]+$/,
                    message: "เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>เบอร์โทรศัพท์</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="ระบุเบอร์โทรศัพท์"
                      autoComplete="off"
                      maxLength={10}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Gender Field */}
              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    orientation="responsive"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        <span>เพศ</span>
                        <span className="text-muted-foreground">
                          (ไม่บังคับ)
                        </span>
                      </FieldLabel>
                    </FieldContent>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="min-w-[120px]"
                      >
                        <SelectValue placeholder="เลือกเพศ" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        <SelectItem value="MALE">ชาย</SelectItem>
                        <SelectItem value="FEMALE">หญิง</SelectItem>
                        <SelectItem value="UNSPECIFIED">ไม่ระบุ</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="px-6 py-5 text-sm cursor-pointer"
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                form="create-customer"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
