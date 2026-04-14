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
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm } from "react-hook-form";
import { PET_TYPE_OPTIONS } from "@/lib/constants/pet-type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PetBreedForm } from "../types/pet-breed";
import { createPetBreed } from "../actions/create-pet-breed";

export function CreatePetBreedDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      type: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: PetBreedForm) => {
    try {
      setServerError(null);

      const result = await createPetBreed(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("สร้างพันธุ์สัตว์เลี้ยงสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreatePetBreed Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างพันธุ์สัตว์เลี้ยง");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-pet-breed">
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button type="button">
            {" "}
            <PlusIcon className="size-3.5" /> เพิ่มสายพันธุ์สัตว์เลี้ยง
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มสายพันธุ์สัตว์เลี้ยง
            </DialogTitle>
            <DialogDescription>
              กรุณากรอกข้อมูลสายพันธุ์สัตว์เลี้ยง
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Nickname Field */}
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อสายพันธุ์",
                maxLength: {
                  value: 100,
                  message: "ชื่อสายพันธุ์ไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อสายพันธุ์</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุชื่อพันธุ์"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Pet Type Field */}
            <Controller
              name="type"
              control={form.control}
              rules={{
                required: "กรุณาระบุประเภทสัตว์เลี้ยง",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ประเภทสัตว์เลี้ยง
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {PET_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
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
              <Button
                type="submit"
                form="create-pet-breed"
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
