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
  Field,
  // FieldContent ถูกลบออก — ไม่มี field ที่ต้องการ wrapper นี้ใน UpdatePetBreedDialog
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { PET_TYPE_OPTIONS } from "@/lib/constants/pet-type";
import { PET_SIZE_OPTIONS } from "@/lib/constants/service-type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PetBreed, PetBreedForm } from "../types/pet-breed";
import { updatePetBreed } from "../actions/update-pet-breed";

const petSizeOptions = PET_SIZE_OPTIONS.filter(
  (option) => option.value !== "ALL",
);

interface UpdatePetBreedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petBreed: PetBreed;
}

export function UpdatePetBreedDialog({
  open,
  onOpenChange,
  petBreed,
}: UpdatePetBreedDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      type: "",
      size: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (petBreed) {
      form.reset({
        name: petBreed.name,
        type: petBreed.type,
        size: petBreed.size,
      });
    }
  }, [petBreed, form]);

  const onSubmit = async (data: PetBreedForm) => {
    try {
      setServerError(null);

      const result = await updatePetBreed({
        ...data,
        id: petBreed.id,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }


      onOpenChange(false);
      form.reset();
      toast.success("แก้ไขข้อมูลพันธุ์สัตว์เลี้ยงสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdatePetBreed Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขข้อมูลพันธุ์สัตว์เลี้ยง");
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
        onOpenChange(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id={`update-pet-breed-${petBreed?.id}`}
      >
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขข้อมูลพันธุ์สัตว์เลี้ยง
            </DialogTitle>
            <DialogDescription>
              กรุณากรอกข้อมูลพันธุ์สัตว์เลี้ยง
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Pet Breed Name Field */}
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
                    <SelectTrigger>
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

            {/* Pet Size Field */}
            <Controller
              name="size"
              control={form.control}
              rules={{
                required: "กรุณาระบุขนาดสัตว์เลี้ยง",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ขนาดสัตว์เลี้ยง
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกขนาด" />
                    </SelectTrigger>
                    <SelectContent>
                      {petSizeOptions.map((option) => (
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
              <LoadingButton
                type="submit"
                className="px-6 py-5 text-sm cursor-pointer"
                form={`update-pet-breed-${petBreed.id}`}

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
