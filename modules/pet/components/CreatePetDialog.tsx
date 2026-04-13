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
import { CreatePetForm } from "@/modules/pet/types/pet";
import { Textarea } from "@/components/ui/textarea";
import { PetBreed } from "@/modules/pet-breed/types/pet-breed";
import { createPet } from "../actions/create-pet";

interface CreatePetDialogProps {
  petBreeds: PetBreed[];
  customerId: string;
}

export function CreatePetDialog({
  petBreeds,
  customerId,
}: CreatePetDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  const onSubmit = async (data: CreatePetForm) => {
    try {
      setServerError(null);

      const result = await createPet({
        name: data.name,
        medicalNotes: data.medicalNotes,
        petBreedId: data.petBreedId,
        customerId,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("สร้างสัตว์เลี้ยงสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreatePet Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างสัตว์เลี้ยง");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-pet">
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button>
            {" "}
            <PlusIcon className="size-3.5" /> เพิ่มสัตว์เลี้ยง
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มสัตว์เลี้ยง
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
                required: "กรุณาระบุชื่อสัตว์เลี้ยง",
                maxLength: {
                  value: 100,
                  message: "ชื่อสัตว์เลี้ยงไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อสัตว์เลี้ยง</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุชื่อสัตว์เลี้ยง"
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
                    return "กรุณาระบุประเภทสัตว์เลี้ยง";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ประเภทสัตว์เลี้ยง
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
                    return "กรุณาระบุพันธุ์สัตว์เลี้ยง";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    พันธุ์สัตว์เลี้ยง
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกพันธุ์" />
                    </SelectTrigger>
                    <SelectContent>
                      {petBreeds
                        .filter((breed) => breed.type === form.watch("petType"))
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
                  message: "ข้อมูลการแพ้ / โรคประจำตัวไม่เกิน 500 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ข้อมูลการแพ้ / โรคประจำตัว (ถ้ามี)
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
              <Button
                type="submit"
                form="create-pet"
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
