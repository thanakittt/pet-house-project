"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { createUser } from "@/modules/auth/actions/create-user";
import { UserForm } from "@/modules/auth/types/create-user-form";
import { UserFormFields } from "./UserFormFields";

const defaultValues: UserForm = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  gender: "",
  birthDate: "",
  role: "staff",
};

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<UserForm>({
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: UserForm) => {
    try {
      setServerError(null);

      const result = await createUser(data);

      if (!result.success) {
        setServerError(result.error ?? "เกิดข้อผิดพลาดในการสร้างผู้ใช้");
        return;
      }

      setOpen(false);
      form.reset(defaultValues);
      toast.success("สร้างผู้ใช้สำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateUser Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างผู้ใช้");
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
        setOpen(value);
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-user">
        <DialogTrigger asChild>
          <Button>
            <PlusIcon className="size-3.5" />
            เพิ่มผู้ใช้ใหม่
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มผู้ใช้ใหม่
            </DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลผู้ใช้ใหม่</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <UserFormFields control={form.control} passwordRequired />

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>
              <Button
                type="submit"
                form="create-user"
                disabled={form.formState.isSubmitting || !form.formState.isValid}
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
