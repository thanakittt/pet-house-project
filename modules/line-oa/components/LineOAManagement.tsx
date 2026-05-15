"use client";

import {
  LoadingButton,
  LoadingButtonContent,
} from "@/components/shared/LoadingButton";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  MegaphoneIcon,
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { broadcastLineText } from "../actions/broadcast-line-text";
import { updateAppointmentStatusTemplate } from "../actions/update-appointment-status-template";
import {
  LINE_TEMPLATE_PLACEHOLDERS,
  LINE_TEMPLATE_SAMPLE_DATA,
  MAX_LINE_TEMPLATE_LENGTH,
  DEFAULT_LINE_STATUS_ACTIVE,
  renderLineAppointmentStatusTemplate,
  validateLineTemplateInput,
  type LineAppointmentStatusTemplateView,
  type LineTemplatePlaceholder,
} from "../types/appointment-status-template";

type LineOAManagementProps = {
  templates: LineAppointmentStatusTemplateView[];
};

type TemplateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const placeholderLabels: Record<LineTemplatePlaceholder, string> = {
  statusLabel: "สถานะ",
  appointmentDate: "วันที่นัดหมาย",
  petNames: "รายชื่อสัตว์เลี้ยง",
  serviceNames: "รายการบริการ",
};

export function LineOAManagement({ templates }: LineOAManagementProps) {
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [templateStatusFilter, setTemplateStatusFilter] =
    useState<TemplateStatusFilter>("ALL");
  const [selectedTemplate, setSelectedTemplate] =
    useState<LineAppointmentStatusTemplateView | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const remainingCharacters = MAX_LINE_TEMPLATE_LENGTH - message.length;
  const filteredTemplates = useMemo(() => {
    if (templateStatusFilter === "ACTIVE") {
      return templates.filter((template) => template.isActive);
    }

    if (templateStatusFilter === "INACTIVE") {
      return templates.filter((template) => !template.isActive);
    }

    return templates;
  }, [templateStatusFilter, templates]);

  function validateMessage() {
    if (!trimmedMessage) {
      setMessageError("กรุณากรอกข้อความที่ต้องการส่ง");
      return false;
    }

    if (message.length > MAX_LINE_TEMPLATE_LENGTH) {
      setMessageError("ข้อความต้องไม่เกิน 5,000 ตัวอักษร");
      return false;
    }

    setMessageError(null);
    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateMessage()) {
      return;
    }

    setIsConfirmOpen(true);
  }

  function handleConfirmBroadcast() {
    startTransition(async () => {
      const result = await broadcastLineText({ text: trimmedMessage });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("ส่งข้อความ Broadcast ผ่าน LINE OA สำเร็จ");
      setMessage("");
      setMessageError(null);
      setIsConfirmOpen(false);
    });
  }

  return (
    <>
      <Tabs defaultValue="broadcast" className="hidden lg:flex flex-col gap-4">
        <TabsList size="lg" width="half" className="mb-2">
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="templates">Template แจ้งเตือน</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast">
          <div className="gap-4 grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHeader>
                <CardTitle>ส่งข้อความ Broadcast</CardTitle>
                <CardDescription>
                  ส่งข้อความ text ไปหาเพื่อนทั้งหมดของ LINE Official Account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  id="line-oa-broadcast-form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  <FieldGroup>
                    <Field data-invalid={Boolean(messageError)}>
                      <FieldLabel htmlFor="line-broadcast-message">
                        ข้อความ
                      </FieldLabel>
                      <Textarea
                        id="line-broadcast-message"
                        value={message}
                        onChange={(event) => {
                          setMessage(event.target.value);
                          setMessageError(null);
                        }}
                        placeholder="พิมพ์ข้อความที่ต้องการส่งให้ลูกค้าทาง LINE OA"
                        rows={8}
                        aria-invalid={Boolean(messageError)}
                        disabled={isPending}
                      />
                      <FieldDescription>
                        เหลือ {remainingCharacters.toLocaleString("th-TH")}{" "}
                        ตัวอักษร
                      </FieldDescription>
                      {messageError ? (
                        <FieldError errors={[{ message: messageError }]} />
                      ) : null}
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit" form="line-oa-broadcast-form">
                  <SendIcon data-icon="inline-start" />
                  ตรวจสอบและส่ง
                </Button>
              </CardFooter>
            </Card>

            <Alert>
              <MegaphoneIcon />
              <AlertTitle>Broadcast จะส่งถึงเพื่อน OA ทั้งหมด</AlertTitle>
              <AlertDescription>
                การส่งนี้นับรวมในโควตาข้อความของ LINE OA และ LINE จำกัด
                Broadcast 60 requests ต่อชั่วโมงต่อ Channel
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Template ข้อความแจ้งเตือนสถานะ</CardTitle>
              <CardDescription>
                ปรับข้อความ LINE ที่ลูกค้าจะได้รับเมื่อสถานะนัดหมายเปลี่ยน
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3">
                <ToggleGroup
                  type="single"
                  value={templateStatusFilter}
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setTemplateStatusFilter(value as TemplateStatusFilter);
                  }}
                  variant="outline"
                  size="sm"
                  aria-label="Filter LINE appointment status templates"
                >
                  <ToggleGroupItem value="ALL">ทั้งหมด</ToggleGroupItem>
                  <ToggleGroupItem value="ACTIVE">เปิดใช้งาน</ToggleGroupItem>
                  <ToggleGroupItem value="INACTIVE">ปิดใช้งาน</ToggleGroupItem>
                </ToggleGroup>
                <span className="text-muted-foreground text-sm">
                  แสดง {filteredTemplates.length.toLocaleString("th-TH")} จาก{" "}
                  {templates.length.toLocaleString("th-TH")} template
                </span>
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="flex justify-center items-center p-6 border border-dashed rounded-md min-h-40 text-muted-foreground text-sm text-center">
                  ไม่พบ template ในตัวกรองนี้
                </div>
              ) : (
                <div className="gap-3 grid md:grid-cols-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.status}
                      className="flex flex-col gap-3 p-4 border rounded-md"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-medium">{template.label}</span>
                          <span className="text-muted-foreground text-sm">
                            {template.description}
                          </span>
                        </div>
                        <Badge
                          variant={template.isActive ? "default" : "secondary"}
                        >
                          {template.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </Badge>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                        {renderLineAppointmentStatusTemplate(
                          template.messageTemplate,
                          LINE_TEMPLATE_SAMPLE_DATA,
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <AppointmentStatusBadge status={template.status} />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          แก้ไข
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการส่ง Broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              ข้อความนี้จะถูกส่งไปหาเพื่อนทั้งหมดของ LINE OA และจะนับรวมในโควตา
              Messaging API ของบัญชีร้าน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmBroadcast();
              }}
              disabled={isPending}
            >
              <LoadingButtonContent
                isLoading={isPending}
                loadingText="กำลังส่ง..."
              >
                ยืนยันส่ง Broadcast
              </LoadingButtonContent>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedTemplate ? (
        <UpdateTemplateDialog
          key={selectedTemplate.status}
          template={selectedTemplate}
          open={Boolean(selectedTemplate)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTemplate(null);
            }
          }}
        />
      ) : null}
    </>
  );
}

function UpdateTemplateDialog({
  template,
  open,
  onOpenChange,
}: {
  template: LineAppointmentStatusTemplateView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [messageTemplate, setMessageTemplate] = useState(
    template.messageTemplate,
  );
  const [isActive, setIsActive] = useState(template.isActive);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validationResult = useMemo(
    () => validateLineTemplateInput(messageTemplate),
    [messageTemplate],
  );

  const previewMessage = useMemo(() => {
    return renderLineAppointmentStatusTemplate(
      messageTemplate || template.defaultMessageTemplate,
      LINE_TEMPLATE_SAMPLE_DATA,
    );
  }, [messageTemplate, template.defaultMessageTemplate]);

  const remainingCharacters = MAX_LINE_TEMPLATE_LENGTH - messageTemplate.length;

  function insertPlaceholder(placeholder: LineTemplatePlaceholder) {
    setMessageTemplate((currentTemplate) => {
      const nextPart = `{${placeholder}}`;

      if (!currentTemplate) {
        return nextPart;
      }

      return `${currentTemplate}\n${nextPart}`;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    if (!validationResult.success) {
      setServerError(validationResult.error);
      return;
    }

    startTransition(async () => {
      const result = await updateAppointmentStatusTemplate({
        status: template.status,
        messageTemplate,
        isActive,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success("บันทึก template แจ้งเตือน LINE OA สำเร็จ");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>แก้ไข template: {template.label}</DialogTitle>
          <DialogDescription>
            ใช้ placeholder เพื่อให้ระบบเติมข้อมูลนัดหมายจริงก่อนส่ง LINE
          </DialogDescription>
          {serverError ? (
            <DialogDescription className="text-destructive">
              {serverError}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <form
          id={`line-template-${template.status}`}
          onSubmit={handleSubmit}
          className="gap-4 grid lg:grid-cols-[minmax(0,1fr)_280px]"
        >
          <FieldGroup>
            <Field data-invalid={!validationResult.success}>
              <FieldLabel htmlFor={`line-template-message-${template.status}`}>
                ข้อความ template
              </FieldLabel>
              <Textarea
                id={`line-template-message-${template.status}`}
                value={messageTemplate}
                onChange={(event) => {
                  setMessageTemplate(event.target.value);
                  setServerError(null);
                }}
                rows={10}
                aria-invalid={!validationResult.success}
                disabled={isPending}
              />
              <FieldDescription
                className={cn(remainingCharacters < 0 && "text-destructive")}
              >
                เหลือ {remainingCharacters.toLocaleString("th-TH")} ตัวอักษร
              </FieldDescription>
              {!validationResult.success ? (
                <FieldError errors={[{ message: validationResult.error }]} />
              ) : null}
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id={`line-template-active-${template.status}`}
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                disabled={isPending}
              />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor={`line-template-active-${template.status}`}>
                  เปิดใช้งานการส่ง LINE สำหรับสถานะนี้
                </FieldLabel>
                <FieldDescription>
                  ถ้าปิด ระบบจะไม่ส่ง LINE เมื่อสถานะนี้ถูกใช้งาน
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Placeholder</span>
              <div className="flex flex-wrap gap-2">
                {LINE_TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                  <Button
                    key={placeholder}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder)}
                    disabled={isPending}
                  >
                    {placeholderLabels[placeholder]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Preview</span>
              <div className="bg-muted/50 p-3 border rounded-md min-h-36 text-sm whitespace-pre-wrap">
                {previewMessage}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <div className="flex sm:flex-row flex-col sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMessageTemplate(template.defaultMessageTemplate);
                setIsActive(DEFAULT_LINE_STATUS_ACTIVE[template.status]);
                setServerError(null);
              }}
              disabled={isPending}
            >
              <RotateCcwIcon data-icon="inline-start" />
              Reset ค่าเริ่มต้น
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                ยกเลิก
              </Button>
            </DialogClose>
            <LoadingButton
              type="submit"
              form={`line-template-${template.status}`}
              isLoading={isPending}
              loadingText="กำลังบันทึก..."
            >
              <SaveIcon data-icon="inline-start" />
              บันทึก
            </LoadingButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
