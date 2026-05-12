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
  // DialogTrigger ไม่ได้ใช้ — Dialog นี้ถูกควบคุมด้วย open prop จากภายนอก
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Field,
  // FieldContent ถูกลบออกเนื่องจากไม่ได้ใช้งานในคอมโพเนนต์นี้
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
// PencilIcon ถูกลบออก — ไม่ได้ใช้ภายใน UpdatePetDialog (trigger อยู่ที่ parent component)
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { CreatePetForm } from "@/modules/pet/types/pet";
import { Textarea } from "@/components/ui/textarea";
import { PetBreed } from "@/modules/pet-breed/types/pet-breed";
import { Pet } from "../types/pet";
import { updatePet } from "../actions/update-pet";
import { updateCustomerPet } from "../actions/customer-pet";

type PetActionMode = "staff" | "customer";

interface UpdatePetDialogProps {
  petBreeds: PetBreed[];
  pet: Pet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionMode?: PetActionMode;
}

export function UpdatePetDialog({
  petBreeds,
  pet,
  open,
  onOpenChange,
  actionMode = "staff",
}: UpdatePetDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      petType: "",
      medicalNotes: "",
      petBreedId: "",
    },
    mode: "onBlur",
  });
  const selectedPetType = useWatch({
    control: form.control,
    name: "petType",
  });

  useEffect(() => {
    if (pet) {
      form.reset({
        name: pet.name,
        medicalNotes: pet.medicalNotes || "",
        petType: pet.breed.type,
        petBreedId: pet.petBreedId,
      });
    }
  }, [pet, form]);

  const onSubmit = async (data: CreatePetForm) => {
    try {
      setServerError(null);

      const payload = {
        petId: pet.id,
        name: data.name,
        petBreedId: data.petBreedId,
        medicalNotes: data.medicalNotes,
      };

      const result =
        actionMode === "customer"
          ? await updateCustomerPet(payload)
          : await updatePet(payload);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      onOpenChange(false);
      form.reset();
      toast.success("แก้ไขสัตว์เลี้ยงสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdatePet Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขสัตว์เลี้ยง");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="update-pet">
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขข้อมูลสัตว์เลี้ยง
            </DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลสัตว์เลี้ยง</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <Separator />

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Name Field */}
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อ",
                maxLength: {
                  value: 100,
                  message: "ชื่อไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อ</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุชื่อ"
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
              name="petType"
              control={form.control}
              rules={{
                validate: (value) => {
                  if (value === "") {
                    return "กรุณาระบุประเภท";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ประเภท
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      form.setValue("petBreedId", "");
                      field.onChange(value);
                    }}
                  >
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

            {/* Pet Breed Field */}
            <Controller
              name="petBreedId"
              control={form.control}
              rules={{
                validate: (value) => {
                  if (value === "") {
                    return "กรุณาระบุสายพันธุ์";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    สายพันธุ์
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสายพันธุ์" />
                    </SelectTrigger>
                    <SelectContent>
                      {petBreeds
                        .filter((breed) => breed.type === selectedPetType)
                        .map((breed) => (
                          <SelectItem key={breed.id} value={breed.id}>
                            {breed.name}
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

            {/* Medical Notes Field */}
            <Controller
              name="medicalNotes"
              control={form.control}
              rules={{
                maxLength: {
                  value: 500,
                  message: "หมายเหตุไม่เกิน 500 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    หมายเหตุ (ถ้ามี)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุข้อมูลการแพ้ / โรคประจำตัว"
                    autoComplete="off"
                  />
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
                form="update-pet"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
