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
  AlertCircleIcon,
  BellIcon,
  MegaphoneIcon,
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { broadcastLineText } from "../actions/broadcast-line-text";
import { multicastLineText } from "../actions/multicast-line-text";
import { updateAppointmentStatusTemplate } from "../actions/update-appointment-status-template";
import { updateStaffAppointmentStatusTemplate } from "../actions/update-staff-appointment-status-template";
import {
  addItemsToSet,
  removeItemsFromSet,
  toggleItemInSet,
} from "../types/multicast";
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
import {
  DEFAULT_STAFF_LINE_TEMPLATE_ACTIVE,
  STAFF_LINE_TEMPLATE_PLACEHOLDERS,
  STAFF_LINE_TEMPLATE_SAMPLE_DATA,
  renderStaffLineAppointmentStatusTemplate,
  validateStaffLineTemplateInput,
  type StaffLineAppointmentStatusTemplateView,
  type StaffLineTemplatePlaceholder,
} from "../types/staff-appointment-status-template";
import { LineConnectedCustomerTable } from "./LineConnectedCustomerTable";
import type { LineConnectedCustomer } from "../types/line-connected-customer";

type LineOAManagementProps = {
  templates: LineAppointmentStatusTemplateView[];
  staffTemplate: StaffLineAppointmentStatusTemplateView;
  customers: LineConnectedCustomer[];
};

type TemplateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const placeholderLabels: Record<LineTemplatePlaceholder, string> = {
  statusLabel: "สถานะ",
  appointmentDate: "วันที่นัดหมาย",
  petNames: "รายชื่อสัตว์เลี้ยง",
  serviceNames: "รายการบริการ",
};

const staffPlaceholderLabels: Record<StaffLineTemplatePlaceholder, string> = {
  appointmentDate: "วันที่นัดหมาย",
  customerName: "ชื่อลูกค้า",
  customerPhone: "เบอร์โทรลูกค้า",
  petNames: "รายชื่อสัตว์เลี้ยง",
  serviceNames: "รายการบริการ",
};

export function LineOAManagement({
  templates,
  staffTemplate,
  customers,
}: LineOAManagementProps) {
  const [deliveryMode, setDeliveryMode] = useState<"broadcast" | "multicast">(
    "broadcast",
  );
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    new Set(),
  );
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [templateStatusFilter, setTemplateStatusFilter] =
    useState<TemplateStatusFilter>("ALL");
  const [selectedTemplate, setSelectedTemplate] =
    useState<LineAppointmentStatusTemplateView | null>(null);
  const [isStaffTemplateOpen, setIsStaffTemplateOpen] = useState(false);
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

  function validateForm() {
    let hasError = false;

    if (!trimmedMessage) {
      setMessageError("กรุณากรอกข้อความที่ต้องการส่ง");
      hasError = true;
    } else if (message.length > MAX_LINE_TEMPLATE_LENGTH) {
      setMessageError("ข้อความต้องไม่เกิน 5,000 ตัวอักษร");
      hasError = true;
    } else {
      setMessageError(null);
    }

    if (deliveryMode === "multicast" && selectedCustomerIds.size === 0) {
      setRecipientError(
        "กรุณาเลือกลูกค้าอย่างน้อย 1 คนสำหรับส่งข้อความ Multicast",
      );
      toast.error("กรุณาเลือกลูกค้าอย่างน้อย 1 คนสำหรับส่งข้อความ Multicast");
      hasError = true;
    } else {
      setRecipientError(null);
    }

    return !hasError;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsConfirmOpen(true);
  }

  function handleConfirmSend() {
    startTransition(async () => {
      if (deliveryMode === "broadcast") {
        const result = await broadcastLineText({ text: trimmedMessage });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("ส่งข้อความ Broadcast ผ่าน LINE OA สำเร็จ");
        setMessage("");
        setMessageError(null);
        setIsConfirmOpen(false);
      } else {
        const targetLineUserIds = customers
          .filter((c) => selectedCustomerIds.has(c.id))
          .map((c) => c.lineUserId);

        const result = await multicastLineText({
          text: trimmedMessage,
          targetUserIds: targetLineUserIds,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        const count = result.data?.recipientCount ?? targetLineUserIds.length;
        toast.success(
          `ส่งข้อความ Multicast สำเร็จ (${count.toLocaleString("th-TH")} คน)`,
        );
        setMessage("");
        setMessageError(null);
        setSelectedCustomerIds(new Set());
        setRecipientError(null);
        setIsConfirmOpen(false);
      }
    });
  }

  return (
    <>
      <Tabs defaultValue="broadcast" className="flex flex-col gap-4">
        <TabsList size="lg" width="half" className="mb-2">
          <TabsTrigger value="broadcast">ส่งข้อความ</TabsTrigger>
          <TabsTrigger value="templates">Template แจ้งเตือน</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="flex flex-col gap-4">
          <div className="gap-4 grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHeader>
                <CardTitle>
                  {deliveryMode === "broadcast"
                    ? "ส่งข้อความ Broadcast"
                    : "ส่งข้อความ Multicast"}
                </CardTitle>
                <CardDescription>
                  {deliveryMode === "broadcast"
                    ? "ส่งข้อความ text ไปหาเพื่อนทั้งหมดของ LINE Official Account"
                    : "ส่งข้อความ text เจาะจงไปยังรายชื่อลูกค้าที่เลือก (Line Connected Customers)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <FieldLabel>รูปแบบการส่งข้อความ (Delivery Mode)</FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={deliveryMode}
                    onValueChange={(val) => {
                      if (val) {
                        setDeliveryMode(val as "broadcast" | "multicast");
                        setRecipientError(null);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    aria-label="เลือกรูปแบบการส่งข้อความ"
                  >
                    <ToggleGroupItem value="broadcast" className="gap-2 px-3">
                      <MegaphoneIcon className="size-4" />
                      Broadcast Message
                    </ToggleGroupItem>
                    <ToggleGroupItem value="multicast" className="gap-2 px-3">
                      <UsersIcon className="size-4" />
                      Multicast Message
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {deliveryMode === "multicast" && (
                  <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-2 p-3 border rounded-md bg-muted/40 text-sm">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="size-4 text-primary" />
                      <span>
                        ผู้รับที่เลือก:{" "}
                        <strong className="font-semibold text-foreground">
                          {selectedCustomerIds.size.toLocaleString("th-TH")}
                        </strong>{" "}
                        คน
                      </span>
                    </div>
                    {selectedCustomerIds.size > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelectedCustomerIds(new Set())}
                        className="p-0 h-auto text-muted-foreground hover:text-foreground text-xs"
                      >
                        ล้างการเลือกทั้งหมด
                      </Button>
                    )}
                  </div>
                )}

                {recipientError && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircleIcon className="size-4" />
                    <AlertDescription className="text-sm">
                      {recipientError}
                    </AlertDescription>
                  </Alert>
                )}

                <form
                  id="line-oa-message-form"
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
                        placeholder={
                          deliveryMode === "broadcast"
                            ? "พิมพ์ข้อความที่ต้องการส่งให้ลูกค้าทาง LINE OA"
                            : "พิมพ์ข้อความที่ต้องการส่งให้ลูกค้าที่เลือกทาง LINE OA"
                        }
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
                <Button type="submit" form="line-oa-message-form">
                  <SendIcon data-icon="inline-start" />
                  ตรวจสอบและส่ง
                </Button>
              </CardFooter>
            </Card>

            {deliveryMode === "broadcast" ? (
              <Alert className="p-4">
                <MegaphoneIcon />
                <AlertTitle>Broadcast จะส่งถึงเพื่อน OA ทั้งหมด</AlertTitle>
                <AlertDescription>
                  การส่งนี้นับรวมในโควตาข้อความของ LINE OA และ LINE จำกัด
                  Broadcast 60 requests ต่อชั่วโมงต่อ Channel
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="p-4">
                <UsersIcon />
                <AlertTitle>Multicast จะส่งเฉพาะลูกค้าที่เลือก</AlertTitle>
                <AlertDescription>
                  ระบบจะส่งข้อความไปยัง LINE User ID ของลูกค้าที่เลือกโดยอัตโนมัติ
                  และแบ่งชุดคำสั่งละไม่เกิน 500 คนตามมาตรฐานของ LINE Multicast API
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Card
            className={cn(
              deliveryMode === "multicast" && "ring-1 ring-primary/20",
            )}
          >
            <CardHeader>
              <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>ลูกค้าที่เชื่อมต่อบัญชี LINE</CardTitle>
                  <CardDescription>
                    {deliveryMode === "multicast"
                      ? "ทำเครื่องหมายถูกที่หน้ารายชื่อลูกค้าเพื่อเลือกผู้รับข้อความ Multicast"
                      : "รายชื่อลูกค้าที่มีการผูกบัญชี LINE กับทางร้าน (Line Connected Customers)"}
                  </CardDescription>
                </div>
                {deliveryMode === "multicast" && (
                  <Badge
                    variant={
                      selectedCustomerIds.size > 0 ? "default" : "secondary"
                    }
                  >
                    เลือกผู้รับแล้ว{" "}
                    {selectedCustomerIds.size.toLocaleString("th-TH")} คน
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <LineConnectedCustomerTable
                customers={customers}
                selectable={deliveryMode === "multicast"}
                selectedCustomerIds={selectedCustomerIds}
                onToggleSelectCustomer={(id) => {
                  setSelectedCustomerIds((prev) => toggleItemInSet(prev, id));
                  setRecipientError(null);
                }}
                onSelectAllFiltered={(ids) => {
                  setSelectedCustomerIds((prev) => addItemsToSet(prev, ids));
                  setRecipientError(null);
                }}
                onDeselectAllFiltered={(ids) => {
                  setSelectedCustomerIds((prev) => removeItemsFromSet(prev, ids));
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="flex flex-col gap-4">
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
            <Card>
              <CardHeader>
                <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-3">
                  <div className="flex flex-col gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <BellIcon className="size-5" />
                      Template แจ้งเตือนพนักงาน
                    </CardTitle>
                    <CardDescription>{staffTemplate.description}</CardDescription>
                  </div>
                  <Badge variant={staffTemplate.isActive ? "default" : "secondary"}>
                    {staffTemplate.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <AppointmentStatusBadge status={staffTemplate.status} />
                  {staffTemplate.isDefault ? (
                    <Badge variant="outline">ค่าเริ่มต้น</Badge>
                  ) : null}
                </div>
                <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                  {renderStaffLineAppointmentStatusTemplate(
                    staffTemplate.messageTemplate,
                    STAFF_LINE_TEMPLATE_SAMPLE_DATA,
                  )}
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStaffTemplateOpen(true)}
                >
                  แก้ไข
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deliveryMode === "broadcast"
                ? "ยืนยันการส่งข้อความ Broadcast"
                : "ยืนยันการส่งข้อความ Multicast"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              โปรดตรวจสอบรายละเอียดก่อนยืนยันการส่งข้อความผ่าน LINE OA
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-2 text-sm">
            <div className="flex justify-between items-center bg-muted/40 p-2.5 border rounded-md">
              <span className="text-muted-foreground">รูปแบบการส่ง:</span>
              <Badge variant="outline" className="font-normal">
                {deliveryMode === "broadcast" ? (
                  <span className="flex items-center gap-1">
                    <MegaphoneIcon className="size-3" /> Broadcast Message
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3" /> Multicast Message
                  </span>
                )}
              </Badge>
            </div>

            <div className="flex justify-between items-center bg-muted/40 p-2.5 border rounded-md">
              <span className="text-muted-foreground">จำนวนผู้รับ:</span>
              <span className="font-semibold text-foreground">
                {deliveryMode === "broadcast"
                  ? "เพื่อนทั้งหมดใน LINE OA"
                  : `${selectedCustomerIds.size.toLocaleString("th-TH")} คน`}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                ตัวอย่างข้อความที่ส่ง:
              </span>
              <div className="bg-muted/50 p-3 border rounded-md max-h-48 overflow-y-auto text-sm whitespace-pre-wrap break-words">
                {trimmedMessage}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmSend();
              }}
              disabled={isPending}
            >
              <LoadingButtonContent
                isLoading={isPending}
                loadingText="กำลังส่ง..."
              >
                {deliveryMode === "broadcast"
                  ? "ยืนยันส่ง Broadcast"
                  : `ยืนยันส่ง Multicast (${selectedCustomerIds.size} คน)`}
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

      <UpdateStaffTemplateDialog
        template={staffTemplate}
        open={isStaffTemplateOpen}
        onOpenChange={setIsStaffTemplateOpen}
      />
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

function UpdateStaffTemplateDialog({
  template,
  open,
  onOpenChange,
}: {
  template: StaffLineAppointmentStatusTemplateView;
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
    () => validateStaffLineTemplateInput(messageTemplate),
    [messageTemplate],
  );

  const previewMessage = useMemo(() => {
    return renderStaffLineAppointmentStatusTemplate(
      messageTemplate || template.defaultMessageTemplate,
      STAFF_LINE_TEMPLATE_SAMPLE_DATA,
    );
  }, [messageTemplate, template.defaultMessageTemplate]);

  const remainingCharacters = MAX_LINE_TEMPLATE_LENGTH - messageTemplate.length;

  function insertPlaceholder(placeholder: StaffLineTemplatePlaceholder) {
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
      const result = await updateStaffAppointmentStatusTemplate({
        messageTemplate,
        isActive,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success("บันทึก template แจ้งเตือนพนักงานสำเร็จ");
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
            ให้พนักงาน
          </DialogDescription>
          {serverError ? (
            <DialogDescription className="text-destructive">
              {serverError}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <form
          id="line-staff-confirmed-template"
          onSubmit={handleSubmit}
          className="gap-4 grid lg:grid-cols-[minmax(0,1fr)_280px]"
        >
          <FieldGroup>
            <Field data-invalid={!validationResult.success}>
              <FieldLabel htmlFor="line-staff-confirmed-template-message">
                ข้อความ template
              </FieldLabel>
              <Textarea
                id="line-staff-confirmed-template-message"
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
                id="line-staff-confirmed-template-active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                disabled={isPending}
              />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="line-staff-confirmed-template-active">
                  เปิดใช้งานการส่ง LINE ให้พนักงาน
                </FieldLabel>
                <FieldDescription>
                  ถ้าปิด ระบบจะไม่ส่ง LINE ให้พนักงานเมื่อ appointment เป็น
                  CONFIRMED
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Placeholder</span>
              <div className="flex flex-wrap gap-2">
                {STAFF_LINE_TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                  <Button
                    key={placeholder}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder)}
                    disabled={isPending}
                  >
                    {staffPlaceholderLabels[placeholder]}
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
                setIsActive(DEFAULT_STAFF_LINE_TEMPLATE_ACTIVE);
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
              form="line-staff-confirmed-template"
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
