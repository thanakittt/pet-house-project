"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { SearchableCombobox } from "@/components/shared/SearchableCombobox";
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
import type { ReactNode } from "react";
import { useRef, useState } from "react";
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
import { createPet } from "../actions/create-pet";
import { createCustomerPet } from "../actions/customer-pet";
import { createPetBreedComboboxOptions } from "../utils/pet-breed-combobox-options";
import { PetImageUploadField } from "./PetImageUploadField";

type PetActionMode = "staff" | "customer";

interface CreatePetDialogProps {
  petBreeds: PetBreed[];
  customerId: string;
  actionMode?: PetActionMode;
  trigger?: ReactNode;
}

export function CreatePetDialog({
  petBreeds,
  customerId,
  actionMode = "staff",
  trigger,
}: CreatePetDialogProps) {
  const router = useRouter();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [petImageFile, setPetImageFile] = useState<File | null>(null);

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
  const petBreedOptions = createPetBreedComboboxOptions(
    petBreeds,
    selectedPetType,
  );
  const isPetBreedDisabled = selectedPetType === "";

  const onSubmit = async (data: CreatePetForm) => {
    try {
      setServerError(null);

      const formData = buildPetFormData({
        data,
        customerId,
        petImageFile,
      });
      const result =
        actionMode === "customer"
          ? await createCustomerPet(formData)
          : await createPet(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      setPetImageFile(null);
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
          setPetImageFile(null);
        }
        setOpen(value);
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-pet">
        <DialogTrigger asChild>
          {trigger ?? (
            <Button type="button" className="px-6 py-5 text-sm cursor-pointer">
              {" "}
              <PlusIcon className="size-4" /> เพิ่มสัตว์เลี้ยง
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <div ref={dialogContentRef} className="contents">
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

            <FieldGroup className="gap-3 px-4 pb-3">
            <PetImageUploadField
              imageFile={petImageFile}
              onImageFileChange={setPetImageFile}
            />

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
                  <FieldLabel htmlFor={field.name}>ชื่อ</FieldLabel>
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
                    return "กรุณาระบุพันธุ์สัตว์เลี้ยง";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  data-disabled={isPetBreedDisabled}
                >
                  <FieldLabel htmlFor={field.name}>
                    สายพันธุ์
                  </FieldLabel>
                  <SearchableCombobox
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={petBreedOptions}
                    contentContainerRef={dialogContentRef}
                    placeholder="เลือกสายพันธุ์"
                    searchPlaceholder="ค้นหาสายพันธุ์"
                    emptyMessage="ไม่พบสายพันธุ์ที่ค้นหา"
                    disabled={isPetBreedDisabled}
                    aria-invalid={fieldState.invalid}
                    onBlur={field.onBlur}
                  />
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
                  form="create-pet"
                  className="px-6 py-5 text-sm cursor-pointer"

                 isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}

function buildPetFormData({
  data,
  customerId,
  petImageFile,
}: {
  data: CreatePetForm;
  customerId: string;
  petImageFile: File | null;
}) {
  const formData = new FormData();

  formData.set("name", data.name);
  formData.set("petType", data.petType);
  formData.set("petBreedId", data.petBreedId);
  formData.set("medicalNotes", data.medicalNotes);
  formData.set("customerId", customerId);

  if (petImageFile) {
    formData.set("petImage", petImageFile);
  }

  return formData;
}
