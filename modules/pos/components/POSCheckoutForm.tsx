"use client";

import {
  Fragment,
  useState,
  useTransition,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  processPayment,
  ProcessPaymentInput,
} from "../actions/process-payment";
import {
  updateAppointmentItemPrice,
  addAppointmentItem,
  removeAppointmentItem,
} from "../actions/manage-pos-items";
import {
  Banknote,
  QrCode,
  Pencil,
  Plus,
  Trash2,
  X,
  User,
  Phone,
  ClipboardList,
  Receipt,
} from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";

interface POSCheckoutProps {
  appointment: {
    id: string;
    items: {
      id: string;
      price: string;
      pet: { id: string; name: string };
      serviceVariant: {
        id: string;
        size: string;
        petType: string;
        service: { name: string; serviceType: "MAIN" | "ADDON" };
      };
    }[];
    customer: {
      nickname: string;
      walkInPhoneNumber: string | null;
    };
  };
  availablePets: {
    id: string;
    name: string;
    breed: { type: "DOG" | "CAT"; size: "S" | "M" | "L" | "ALL" };
  }[];
  availableServices: {
    id: string;
    name: string;
    serviceType: "MAIN" | "ADDON";
    variants: {
      id: string;
      size: string;
      petType: string;
      minPrice: string;
    }[];
  }[];
  // [NEW] เพิ่ม Prop สำหรับรับค่ามัดจำจาก Server
  depositAmount?: number;
}

type AvailableService = POSCheckoutProps["availableServices"][number];
type AvailablePet = POSCheckoutProps["availablePets"][number];
type AvailableVariant = AvailableService["variants"][number];
type PaymentMethod = ProcessPaymentInput["paymentMethod"];

const paymentMethodStyles: Record<
  PaymentMethod,
  {
    selected: string;
    idle: string;
    confirmButton: string;
  }
> = {
  CASH: {
    selected:
      "border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-md ring-emerald-500/40 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300",
    idle:
      "border-muted text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300",
    confirmButton:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
  },
  TRANSFER: {
    selected:
      "border-blue-500 bg-blue-500/10 text-blue-700 shadow-md ring-blue-500/40 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300",
    idle:
      "border-muted text-muted-foreground hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:border-blue-500/40 dark:hover:text-blue-300",
    confirmButton:
      "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
  },
};

function findMatchingVariant(
  service: AvailableService | undefined,
  pet: AvailablePet | undefined,
): AvailableVariant | undefined {
  if (!service || !pet) return undefined;

  const variantsForPetType = service.variants.filter(
    (variant) => variant.petType === pet.breed.type,
  );

  // เลือกขนาดตรงกับ breed ก่อน ถ้า service ใช้ ALL จะถือว่าใช้ได้ทุก S/M/L
  return (
    variantsForPetType.find((variant) => variant.size === pet.breed.size) ??
    variantsForPetType.find((variant) => variant.size === "ALL")
  );
}

export function POSCheckoutForm({
  appointment,
  availablePets,
  availableServices,
  depositAmount = 0, // ค่าเริ่มต้นเป็น 0 หากไม่มีการส่งมา
}: POSCheckoutProps) {
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] =
    useState<ProcessPaymentInput["paymentMethod"]>("CASH");
  const error: string | null = null;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newPetId, setNewPetId] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // [NEW] 0. คำนวณยอดเงินต่างๆ
  const subTotal = appointment.items.reduce(
    (sum, item) => sum + Number(item.price),
    0,
  );
  // ยอดสุทธิ (ต้องไม่ต่ำกว่า 0)
  const netTotal = Math.max(0, subTotal - depositAmount);

  // 1. จัดกลุ่มรายการตามสัตว์เลี้ยง
  const groupedItems = useMemo(() => {
    const groups: Record<
      string,
      { petName: string; items: typeof appointment.items }
    > = {};
    appointment.items.forEach((item) => {
      if (!groups[item.pet.id]) {
        groups[item.pet.id] = { petName: item.pet.name, items: [] };
      }
      groups[item.pet.id].items.push(item);
    });
    return Object.entries(groups);
  }, [appointment]);

  const selectedPet = useMemo(
    () => availablePets.find((p) => p.id === newPetId),
    [newPetId, availablePets],
  );

  // 2. ดึง ID ของบริการ (Variants) ที่ถูกจองไปแล้ว
  const existingVariantIds = useMemo(() => {
    if (!newPetId) return new Set<string>();
    return new Set(
      appointment.items
        .filter((item) => item.pet.id === newPetId)
        .map((item) => item.serviceVariant.id),
    );
  }, [appointment.items, newPetId]);

  // 2.1 ตรวจสอบว่าสัตว์เลี้ยงตัวนี้มีบริการหลัก (MAIN) อยู่ในตะกร้าแล้วหรือยัง
  const hasMainService = useMemo(() => {
    if (!newPetId) return false;
    return appointment.items.some(
      (item) =>
        item.pet.id === newPetId &&
        item.serviceVariant.service.serviceType === "MAIN",
    );
  }, [appointment.items, newPetId]);

  // 3. กรอง Services
  const filteredServices = useMemo(() => {
    if (!selectedPet) return [];

    return availableServices.filter((service) => {
      if (hasMainService && service.serviceType === "MAIN") {
        return false;
      }
      const variant = findMatchingVariant(service, selectedPet);
      return Boolean(variant && !existingVariantIds.has(variant.id));
    });
  }, [selectedPet, availableServices, existingVariantIds, hasMainService]);

  // 4. กรอง Variants
  const selectedService = useMemo(
    () => availableServices.find((service) => service.id === newServiceId),
    [newServiceId, availableServices],
  );

  const selectedVariant = useMemo(
    () => findMatchingVariant(selectedService, selectedPet),
    [selectedService, selectedPet],
  );
  const filteredVariants = selectedVariant ? [selectedVariant] : [];

  useEffect(() => {
    if (editingItemId && inputRef.current) inputRef.current.focus();
  }, [editingItemId]);

  const handleSavePrice = (itemId: string) => {
    if (editingItemId !== itemId) return;
    const numPrice = Number(tempPrice);
    if (isNaN(numPrice) || numPrice < 0) return;

    setEditingItemId(null);
    startTransition(async () => {
      await updateAppointmentItemPrice(itemId, numPrice);
    });
  };

  const handleAddNewItem = () => {
    if (!newPetId || !newServiceId || !selectedVariant || !newPrice) return;

    const parsedPrice = Number(newPrice);
    if (isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    startTransition(async () => {
      await addAppointmentItem({
        appointmentId: appointment.id,
        petId: newPetId,
        serviceId: newServiceId,
        price: parsedPrice,
      });
      setIsAddingItem(false);
      setNewPetId("");
      setNewServiceId("");
      setNewPrice("");
    });
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = availableServices.find((item) => item.id === serviceId);
    const variant = findMatchingVariant(service, selectedPet);

    setNewServiceId(serviceId);
    setNewPrice(variant?.minPrice ?? "");
  };

  return (
    <>
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-12">
        {/* --- ฝั่งซ้าย --- */}
        <div className=" space-y-6 lg:col-span-8">
          {/* Customer Info Card */}
          <Card className="shadow-sm border-muted/60">
            <CardContent className="flex flex-row justify-between sm:items-center gap-4 p-4 ">
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-primary/10 rounded-full w-10 h-10 text-primary">
                  <User size={20} />
                </div>
                <div>
                  <p className="mb-2 font-semibold text-[12px] text-muted-foreground">
                    ลูกค้า
                  </p>
                  <p className="font-bold text-lg leading-none">
                    {appointment.customer.nickname}
                  </p>
                </div>
              </div>
              {appointment.customer.walkInPhoneNumber && (
                <div className="flex items-center gap-2 pl-3 pr-3 border-l text-muted-foreground">
                  <Phone size={16} />
                  <span className="font-medium">
                    {formatPhoneNumber(appointment.customer.walkInPhoneNumber)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Items Card */}
          <Card className="gap-0 shadow-sm border-muted/60">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <ClipboardList size={18} className="text-primary " /> รายการบริการทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {groupedItems.length === 0 ? (
                  <div className="p-6 text-muted-foreground text-base text-center">
                    ไม่มีรายการบริการ
                  </div>
                ) : (
                  groupedItems.map(([petId, group]) => (
                    <div key={petId} className="flex flex-col">
                      <div className="px-4 pt-2 font-bold text-foreground text-base border-t ">
                        น้อง: {group.petName}
                      </div>
                      <div>
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="group flex flex-row gap-4 hover:bg-muted/10 p-3 pl-6"
                          >
                            <div className="flex w-full justify-between items-center ">
                              <p className="flex items-center font-medium text-sm md:text-base w-full">
                                {item.serviceVariant.service.name}
                                {item.serviceVariant.service.serviceType ===
                                  "MAIN" && (
                                    <Badge
                                      variant="secondary"
                                  className="ml-2"
                                    >
                                      บริการหลัก
                                    </Badge>
                                  )}
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  {
                                    PET_SIZE_LABELS[
                                    item.serviceVariant
                                      .size as keyof typeof PET_SIZE_LABELS
                                    ]
                                  }
                                </Badge>
                              </p>
                            </div>
                            <div className="flex justify-end items-center gap-4 w-auto">
                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    ref={inputRef}
                                    type="number"
                                    value={tempPrice}
                                    onChange={(e) =>
                                      setTempPrice(e.target.value)
                                    }
                                    onBlur={() => handleSavePrice(item.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSavePrice(item.id);
                                      }
                                    }}
                                    className="border-primary w-28 font-bold text-right"
                                  />
                                  <Button
                                    size="lg"
                                    onClick={() => handleSavePrice(item.id)}
                                  >
                                    บันทึก
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <span className="min-w-[80px] font-bold text-lg text-right">
                                    ฿{Number(item.price).toLocaleString()}
                                  </span>
                                  <div className="hidden lg:flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="hover:bg-primary/10 w-8 h-8 text-muted-foreground hover:text-primary"
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setTempPrice(
                                          Number(item.price).toString(),
                                        );
                                      }}
                                    >
                                      <Pencil size={14} />
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="hover:bg-destructive/10 w-8 h-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        setDeleteItemId(item.id);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Item Section */}
              <div className="hidden lg:block bg-muted/5 p-6 border-t">
                {!isAddingItem ? (
                  <Button
                    variant="outline"
                    className="hover:bg-primary/5 hover:border-primary/50 border-dashed w-full h-12 text-muted-foreground hover:text-primary"
                    onClick={() => setIsAddingItem(true)}
                  >
                    <Plus size={16} className="mr-2" /> เพิ่มบริการ
                  </Button>
                ) : (
                  <div className="relative bg-background shadow-sm p-4 border border-primary/20 rounded-xl">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="top-2 right-2 absolute w-6 h-6 text-muted-foreground"
                      onClick={() => setIsAddingItem(false)}
                    >
                      <X size={14} />
                    </Button>
                    <p className="mb-4 font-bold text-primary text-base">
                      เพิ่มรายการบริการใหม่
                    </p>

                    <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      <Select
                        value={newPetId}
                        onValueChange={(v) => {
                          setNewPetId(v);
                          setNewServiceId("");
                          setNewPrice("");
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="สัตว์เลี้ยง" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePets.map((pet) => (
                            <SelectItem key={pet.id} value={pet.id}>
                              {pet.name} ({PET_TYPE_LABELS[pet.breed.type]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={newServiceId}
                        onValueChange={handleServiceSelect}
                        disabled={!newPetId || filteredServices.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              filteredServices.length === 0 && newPetId
                                ? "ไม่มีบริการว่าง"
                                : "บริการ"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredServices.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}{" "}
                              {s.serviceType === "ADDON" ? "(บริการเสริม)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="hidden">
                        <Select value="" onValueChange={() => { }} disabled>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="ขนาด/รูปแบบ" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredVariants.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {
                                  PET_SIZE_LABELS[
                                  v.size as keyof typeof PET_SIZE_LABELS
                                  ]
                                }{" "}
                                (฿{Number(v.minPrice).toLocaleString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 w-full">
                        <Input
                          disabled={!newServiceId}
                          type="number"
                          placeholder="ราคา"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                        />
                        <Button
                          onClick={handleAddNewItem}
                          disabled={
                            isPending || !newServiceId || !selectedVariant
                          }
                          className="px-4"
                        >
                          เพิ่ม
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- ฝั่งขวา: สรุปยอด & ชำระเงิน --- */}
        <div className="lg:col-span-4">
          <Card className="top-6 sticky shadow-lg border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Receipt className="text-primary" size={18} />
                สรุปการสั่งซื้อ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* [NEW] UI แสดงยอดรวมแบบแยกบรรทัด */}
              <div className="space-y-4">
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>จำนวนรายการทั้งหมด</span>
                  <span className="font-bold text-foreground">
                    {appointment.items.length} รายการ
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>ยอดรวมบริการ</span>
                  <span className="font-bold text-foreground">
                    ฿{subTotal.toLocaleString()}
                  </span>
                </div>

                {/* แสดงส่วนลด/หักมัดจำเฉพาะเมื่อมีค่ามัดจำมากกว่า 0 */}
                {depositAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-sm">
                    <span>หักมัดจำล่วงหน้า</span>
                    <span className="font-bold">
                      -฿{depositAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-base uppercase">
                    ยอดชำระสุทธิ
                  </span>
                  <span className="font-black text-primary text-4xl tracking-tight">
                    ฿{netTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="hidden lg:block space-y-3 border-t pt-4">
                <p className="font-semibold text-foreground text-sm">
                  วิธีชำระเงิน
                </p>
                <div className="gap-3 grid grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex flex-col gap-3 border-2 rounded-xl h-24 transition-all",
                      paymentMethod === "CASH"
                        ? paymentMethodStyles.CASH.selected
                        : paymentMethodStyles.CASH.idle,
                    )}
                    onClick={() => setPaymentMethod("CASH")}
                  >
                    <Banknote size={28} />
                    <span className="font-bold text-sm">เงินสด</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex flex-col gap-3 border-2 rounded-xl h-24 transition-all",
                      paymentMethod === "TRANSFER"
                        ? paymentMethodStyles.TRANSFER.selected
                        : paymentMethodStyles.TRANSFER.idle,
                    )}
                    onClick={() => setPaymentMethod("TRANSFER")}
                  >
                    <QrCode size={28} />
                    <span className="font-bold text-sm">โอนเงิน</span>
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 p-3 border border-destructive/20 rounded-lg font-bold text-destructive text-sm">
                  {error}
                </div>
              )}
            </CardContent>

            <CardFooter className="hidden lg:block">
              <LoadingButton
                size="lg"
                onClick={() => setIsConfirmDialogOpen(true)}
                disabled={isPending || appointment.items.length === 0}
                isLoading={isPending}
                loadingText="กำลังบันทึก..."
                className={cn(
                  "max-lg:hidden shadow-lg mt-4 rounded-xl w-full h-16 font-bold text-lg transition-colors",
                  paymentMethodStyles[paymentMethod].confirmButton,
                )}
              >
                ยืนยันชำระเงิน
              </LoadingButton>
            </CardFooter>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="ยืนยันการลบ"
        description="คุณต้องการลบข้อมูลหรือไม่?"
        onConfirm={async () => {
          if (deleteItemId) {
            return await removeAppointmentItem(deleteItemId);
          }
          return { success: false, error: "ไม่พบข้อมูล" };
        }}
        successMessage="ลบข้อมูลเรียบร้อย"
        errorMessage="เกิดข้อผิดพลาดในการดำเนินการ"
        mode="delete"
      />

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="ยืนยันการชำระเงิน"
        description={`คุณต้องการยืนยันการชำระยอดสุทธิ ฿${netTotal.toLocaleString()} หรือไม่?`}
        onConfirm={() =>
          processPayment({
            appointmentId: appointment.id,
            amount: netTotal, // [NEW] ส่งค่ายอดสุทธิ (netTotal) แทนยอดรวมเดิม
            paymentMethod,
          })
        }
        successMessage="ชำระเงินเรียบร้อย"
        errorMessage="เกิดข้อผิดพลาดในการดำเนินการ"
        redirectPath={`/back-office/appointments/${appointment.id}`}
      />
    </>
  );
}
