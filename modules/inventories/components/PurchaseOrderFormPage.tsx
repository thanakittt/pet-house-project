"use client";

import { useState, useTransition } from "react";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Trash2,
  Send,
  FileText,
  Search,
  ChevronsUpDown,
  Check,
  MinusIcon,
  PlusIcon,
  Building2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InventoryItem } from "@/modules/inventories/types/inventory";
import {
  PurchaseOrderForm,
  PurchaseOrderItemForm,
} from "@/modules/inventories/types/purchase-order";
import { Vendor } from "@/modules/vendors/types/vendor";
import { createPurchaseOrder } from "@/modules/inventories/actions/create-purchase-order";
import { cn } from "@/lib/utils";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { format } from "date-fns";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

// 1. สร้าง Type สำหรับ Local State เพื่อรองรับค่าว่าง (Empty String)
interface OrderItemState extends Omit<PurchaseOrderItemForm, "unitCost"> {
  unitCost: number | "";
}

function adjustOrderQuantity(quantity: number, change: 1 | -1): number {
  return Math.max(1, quantity + change);
}

/**
 * PurchaseOrderFormPage — หน้าสร้างใบสั่งซื้อ
 */
export default function PurchaseOrderFormPage({
  inventoryItems,
  vendors = [],
}: {
  inventoryItems: InventoryItem[];
  vendors?: Vendor[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  // State สำหรับ Vendor และ Snapshot
  const [vendorComboboxOpen, setVendorComboboxOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("");
  const [vendorAddress, setVendorAddress] = useState<string>("");
  const [vendorPhone, setVendorPhone] = useState<string>("");
  const [vendorTaxId, setVendorTaxId] = useState<string>("");

  // 2. ใช้ Local Type ที่รองรับค่าว่างกับ State ของตาราง
  const [orderItems, setOrderItems] = useState<OrderItemState[]>([]);

  const [orderDate, setOrderDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );

  const handleSelectVendor = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    setSelectedVendorId(vendor.id);
    // Autofill ข้อมูลลงในฟิลด์ Snapshot ของฟอร์มโดยอัตโนมัติ
    setVendorName(vendor.name);
    setVendorAddress(vendor.address || "");
    setVendorPhone(vendor.phone || "");
    setVendorTaxId(vendor.taxId || "");
    setVendorComboboxOpen(false);
  };

  const handleAddItem = (inventoryItemId: string) => {
    const product = inventoryItems.find((p) => p.id === inventoryItemId);
    if (!product) return;

    const existing = orderItems.find(
      (i) => i.inventoryItemId === inventoryItemId,
    );
    if (existing) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.inventoryItemId === inventoryItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          inventoryItemId: product.id,
          inventoryItemName: product.name,
          quantity: 1,
          unitCost: "", // 3. เซ็ตค่า Default เป็น "" (ว่าง) ทันที
        },
      ]);
    }

    setComboboxOpen(false);
    setSelectedItemId("");
  };

  // 4. ปรับ Type ของ Value ให้รับค่าว่างได้
  const updateItemField = (
    inventoryItemId: string,
    field: "quantity" | "unitCost",
    value: number | "",
  ) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.inventoryItemId === inventoryItemId
          ? { ...item, [field]: value }
          : item,
      ),
    );
  };

  const removeItem = (inventoryItemId: string) => {
    setOrderItems((prev) =>
      prev.filter((i) => i.inventoryItemId !== inventoryItemId),
    );
  };

  // 5. แปลง string เป็นตัวเลข (ถ้าว่างให้เป็น 0) สำหรับการคำนวณยอดรวม
  const totalAmount = orderItems.reduce(
    (acc, item) => acc + item.quantity * (Number(item.unitCost) || 0),
    0,
  );

  const handleSubmit = () => {
    if (!selectedVendorId || !vendorName.trim()) {
      toast.error("กรุณาเลือกผู้จำหน่ายก่อนบันทึกใบสั่งซื้อ");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    // ตรวจสอบว่ามีรายการไหนลืมใส่ราคาหรือไม่ (Optional)
    const hasEmptyCost = orderItems.some((item) => item.unitCost === "");
    if (hasEmptyCost) {
      toast.error("กรุณาระบุราคาต่อหน่วยให้ครบทุกรายการ");
      return;
    }

    // 6. Map ข้อมูลเพื่อเตรียมส่ง แปลง unitCost ให้เป็นตัวเลขล้วนเพื่อความปลอดภัย
    const formData: PurchaseOrderForm = {
      orderDate,
      vendorId: selectedVendorId,
      vendorName: vendorName.trim(),
      vendorAddress: vendorAddress.trim() || undefined,
      vendorPhone: vendorPhone.trim() || undefined,
      vendorTaxId: vendorTaxId.trim() || undefined,
      items: orderItems.map((item) => ({
        ...item,
        unitCost: Number(item.unitCost) || 0,
      })) as PurchaseOrderItemForm[],
    };

    startTransition(async () => {
      try {
        const result = await createPurchaseOrder(formData);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("สร้างใบสั่งซื้อเรียบร้อยแล้ว");
        router.push("/back-office/inventories?tab=order");
      } catch {
        toast.error("เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ");
      }
    });
  };

  return (
    <div className="w-full">
      <Card className="overflow-hidden">
        <CardHeader className="py-4 border-b">
          <CardTitle className="flex items-center gap-2 font-bold text-muted-foreground text-sm uppercase">
            <FileText size={16} /> ข้อมูลการสั่งซื้อสินค้า
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-card px-6 md:px-8 py-2">
          <FieldGroup className="gap-6 grid grid-cols-1 md:grid-cols-2 pb-4">
            <Field>
              <FieldLabel className="font-medium text-muted-foreground text-xs md:text-sm uppercase">
                วันที่สั่งซื้อ <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="order-date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel className="flex justify-between items-center font-medium text-muted-foreground text-xs md:text-sm uppercase">
                <span>
                  ผู้จำหน่าย / คู่ค้า <span className="text-destructive">*</span>
                </span>
                <Link
                  href="/back-office/vendors"
                  target="_blank"
                  className="inline-flex items-center gap-1 font-normal text-primary text-xs hover:underline"
                >
                  <Building2 className="size-3" />
                  จัดการผู้จำหน่าย
                  <ExternalLink className="size-2.5 opacity-60" />
                </Link>
              </FieldLabel>
              <Popover
                open={vendorComboboxOpen}
                onOpenChange={setVendorComboboxOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="vendor-select-button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={vendorComboboxOpen}
                    className={cn(
                      "justify-between w-full font-normal",
                      !selectedVendorId && "text-muted-foreground",
                    )}
                  >
                    {selectedVendorId ? (
                      <span className="font-medium text-foreground truncate">
                        {vendorName}
                      </span>
                    ) : (
                      "เลือกผู้จำหน่าย..."
                    )}
                    <ChevronsUpDown className="opacity-50 ml-2 size-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[350px] sm:w-[450px]" align="start">
                  <Command>
                    <CommandInput placeholder="พิมพ์ค้นหาชื่อผู้จำหน่าย หรือเบอร์โทร..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-4 text-center">
                          <p className="text-muted-foreground text-sm">
                            ไม่พบผู้จำหน่ายที่เปิดใช้งานอยู่
                          </p>
                          <Link
                            href="/back-office/vendors"
                            target="_blank"
                            className="inline-flex items-center gap-1 mt-2 text-primary text-xs hover:underline"
                          >
                            เพิ่มผู้จำหน่ายใหม่
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {vendors.map((vendor) => (
                          <CommandItem
                            key={vendor.id}
                            value={`${vendor.name} ${vendor.phone || ""} ${vendor.taxId || ""}`}
                            onSelect={() => handleSelectVendor(vendor.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4 shrink-0",
                                selectedVendorId === vendor.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate">
                                {vendor.name}
                              </span>
                              {(vendor.contactName || vendor.phone) && (
                                <span className="text-muted-foreground text-xs truncate">
                                  {vendor.contactName && `ติดต่อ: ${vendor.contactName} `}
                                  {vendor.phone && `(${vendor.phone})`}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>
          </FieldGroup>

          {/* การ์ดแสดงและแก้ไขข้อมูล Vendor Snapshot สำหรับใบสั่งซื้อนี้ */}
          {selectedVendorId && (
            <div className="bg-muted/40 mb-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="size-4 text-primary" />
                <span className="font-semibold text-foreground text-xs uppercase tracking-wide">
                  ข้อมูลผู้จำหน่ายในใบสั่งซื้อ (Snapshot)
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  บันทึก snapshot แยกจากประวัติหลัก
                </span>
              </div>
              <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 text-xs">
                <Field>
                  <FieldLabel className="text-muted-foreground text-[11px]">
                    ชื่อผู้จำหน่าย
                  </FieldLabel>
                  <Input
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="ชื่อผู้จำหน่าย"
                    className="h-8 text-xs"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-muted-foreground text-[11px]">
                    เบอร์โทรศัพท์
                  </FieldLabel>
                  <Input
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="เบอร์โทรศัพท์"
                    className="h-8 text-xs"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-muted-foreground text-[11px]">
                    เลขประจำตัวผู้เสียภาษี
                  </FieldLabel>
                  <Input
                    value={vendorTaxId}
                    onChange={(e) => setVendorTaxId(e.target.value)}
                    placeholder="เลขประจำตัวผู้เสียภาษี"
                    className="h-8 text-xs"
                  />
                </Field>
                <Field className="sm:col-span-2 md:col-span-3">
                  <FieldLabel className="text-muted-foreground text-[11px]">
                    ที่อยู่
                  </FieldLabel>
                  <Input
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="ที่อยู่ผู้จำหน่าย"
                    className="h-8 text-xs"
                  />
                </Field>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="py-4">
            <div className="flex flex-col gap-2 mb-6">
              <label className="flex items-center gap-2 font-bold text-muted-foreground text-sm md:text-base uppercase">
                <Search className="size-4" /> เพิ่มสินค้า
              </label>

              <div className="flex items-center gap-4 w-full">
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="justify-between w-full max-w-sm"
                    >
                      {selectedItemId
                        ? inventoryItems.find((i) => i.id === selectedItemId)
                            ?.name
                        : "ค้นหาสินค้า..."}
                      <ChevronsUpDown className="opacity-50 ml-2 size-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-sm">
                    <Command>
                      <CommandInput placeholder="พิมพ์ชื่อสินค้า..." />
                      <CommandList>
                        <CommandEmpty>ไม่พบสินค้าที่ค้นหา</CommandEmpty>
                        <CommandGroup>
                          {inventoryItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.name}
                              onSelect={() => {
                                setSelectedItemId(item.id);
                                handleAddItem(item.id);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  selectedItemId === item.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span>{item.name}</span>
                              <span className="ml-auto text-muted-foreground text-xs">
                                {item.inventoryCategoryName}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>รายการสินค้า</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ราคา/หน่วย (฿)</TableHead>
                    <TableHead className="text-right">ยอดรวม (฿)</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-muted-foreground text-center italic"
                      >
                        ยังไม่มีรายการสินค้า — ค้นหาและเพิ่มสินค้าด้านบน
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderItems.map((item, index) => (
                      <TableRow key={item.inventoryItemId}>
                        <TableCell className="text-muted-foreground text-xs text-center">
                          {index + 1}
                        </TableCell>

                        <TableCell className="font-medium">
                          {item.inventoryItemName}
                        </TableCell>

                        <TableCell className="text-right">
                          <InputGroup className="ml-auto w-28">
                            <InputGroupAddon>
                              <InputGroupButton
                                size="icon-xs"
                                aria-label="ลดจำนวนสินค้า"
                                disabled={item.quantity <= 1}
                                onClick={() =>
                                  updateItemField(
                                    item.inventoryItemId,
                                    "quantity",
                                    adjustOrderQuantity(item.quantity, -1),
                                  )
                                }
                              >
                                <MinusIcon />
                              </InputGroupButton>
                            </InputGroupAddon>
                            <InputGroupInput
                              type="number"
                              className="text-right"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemField(
                                  item.inventoryItemId,
                                  "quantity",
                                  Math.max(1, Number(e.target.value)),
                                )
                              }
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton
                                size="icon-xs"
                                aria-label="เพิ่มจำนวนสินค้า"
                                onClick={() =>
                                  updateItemField(
                                    item.inventoryItemId,
                                    "quantity",
                                    adjustOrderQuantity(item.quantity, 1),
                                  )
                                }
                              >
                                <PlusIcon />
                              </InputGroupButton>
                            </InputGroupAddon>
                          </InputGroup>
                        </TableCell>

                        {/* 7. Input ของราคารองรับค่าว่าง */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="ml-auto w-24 text-right"
                            min="0"
                            step="1"
                            value={item.unitCost}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateItemField(
                                item.inventoryItemId,
                                "unitCost",
                                val === "" ? "" : Math.max(0, Number(val)),
                              );
                            }}
                          />
                        </TableCell>

                        <TableCell className="font-semibold tabular-nums text-right">
                          ฿
                          {(
                            item.quantity * (Number(item.unitCost) || 0)
                          ).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.inventoryItemId)}
                            aria-label={`ลบรายการ ${item.inventoryItemName}`}
                            title="ลบรายการ"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex md:flex-row flex-col justify-end gap-10 bg-card pt-4">
            <div className="flex flex-col gap-3 w-full md:w-80">
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary text-lg">
                  ยอดสุทธิรวม
                </span>
                <span className="font-bold tabular-nums text-primary text-2xl md:text-3xl">
                  ฿
                  {totalAmount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end py-4 border-t">
          <LoadingButton
            variant="default"
            onClick={handleSubmit}
            disabled={isPending || orderItems.length === 0}
            isLoading={isPending}
            loadingText="กำลังส่ง..."
          >
            <Send data-icon="inline-start" />
            สร้างใบสั่งซื้อ
          </LoadingButton>
        </CardFooter>
      </Card>
    </div>
  );
}
