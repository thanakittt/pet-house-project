"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { updateUser } from "@/modules/auth/actions/update-user";
import { UserForm } from "@/modules/auth/types/create-user-form";
import { AuthUserWithProfile } from "@/modules/auth/types/user";
import { UserFormFields } from "./UserFormFields";

type UpdateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUserWithProfile;
};

export function UpdateUserDialog({
  open,
  onOpenChange,
  user,
}: UpdateUserDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues = useMemo<UserForm>(
    () => ({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber ?? "",
      password: "",
      gender: user.gender ?? "",
      birthDate: user.birthDate ?? "",
      role: user.role ?? "",
    }),
    [user],
  );

  const roleOptions =
    user.role === "customer"
      ? [{ value: "customer", label: "ลูกค้า" }]
      : [
          { value: "admin", label: "ผู้ดูแลระบบ" },
          { value: "staff", label: "พนักงาน" },
          { value: "owner", label: "เจ้าของร้าน" },
        ];

  const form = useForm<UserForm>({
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = async (data: UserForm) => {
    try {
      setServerError(null);

      const dataUpdate = {
        userId: user.id,
        name: data.name === user.name ? undefined : data.name,
        nickname: data.name,
        email: data.email === user.email ? undefined : data.email,
        phoneNumber:
          data.phoneNumber === (user.phoneNumber ?? "")
            ? undefined
            : data.phoneNumber,
        password: data.password === "" ? undefined : data.password,
        gender: data.gender === (user.gender ?? "") ? undefined : data.gender,
        birthDate:
          data.birthDate === (user.birthDate ?? "")
            ? undefined
            : data.birthDate,
        role: data.role,
      };

      if (
        dataUpdate.name === undefined &&
        dataUpdate.email === undefined &&
        dataUpdate.phoneNumber === undefined &&
        dataUpdate.password === undefined &&
        dataUpdate.gender === undefined &&
        dataUpdate.birthDate === undefined &&
        dataUpdate.role === undefined
      ) {
        setServerError("กรุณาระบุข้อมูลที่ต้องการแก้ไข");
        return;
      }

      const result = await updateUser(dataUpdate);

      if (!result.success) {
        setServerError(result.error ?? "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้");
        return;
      }

      onOpenChange(false);
      form.reset(defaultValues);
      toast.success("แก้ไขข้อมูลผู้ใช้สำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdateUser Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset(defaultValues);
          setServerError(null);
        }
        onOpenChange(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id={`update-user-${user.id}`}
      >
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขข้อมูลผู้ใช้
            </DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลผู้ใช้</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <UserFormFields control={form.control} roleOptions={roleOptions} />

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>
              <Button
                type="submit"
                form={`update-user-${user.id}`}
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
