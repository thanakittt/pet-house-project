"use client";

import { useState, useTransition } from "react";
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
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  FileText,
  Search,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { InventoryItem } from "@/modules/inventories/types/inventory";
import {
  PurchaseOrderForm,
  PurchaseOrderItemForm,
} from "@/modules/inventories/types/purchase-order";
import { createPurchaseOrder } from "@/modules/inventories/actions/create-purchase-order";
import { cn } from "@/lib/utils";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { format } from "date-fns";

/**
 * PurchaseOrderFormPage — หน้าสร้างใบสั่งซื้อ
 * รับ inventoryItems จาก Server Component เพื่อใช้ใน Combobox ค้นหาสินค้า
 *
 * @param inventoryItems - รายการสินค้าทั้งหมดในระบบ
 */
export default function PurchaseOrderFormPage({
  inventoryItems,
}: {
  inventoryItems: InventoryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── State สำหรับ Combobox ค้นหาสินค้า ──
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  // ── State สำหรับรายการสินค้าในใบสั่งซื้อ ──
  const [orderItems, setOrderItems] = useState<PurchaseOrderItemForm[]>([]);

  // ── State สำหรับวันที่ ──
  const [orderDate, setOrderDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );

  // ── เพิ่มสินค้าลงตาราง ──
  const handleAddItem = (inventoryItemId: string) => {
    const product = inventoryItems.find((p) => p.id === inventoryItemId);
    if (!product) return;

    // ถ้ามีสินค้านี้อยู่แล้ว → เพิ่มจำนวน
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
          unitCost: 0,
        },
      ]);
    }

    // ปิด Combobox และ reset selection
    setComboboxOpen(false);
    setSelectedItemId("");
  };

  // ── แก้ไข field ในรายการสินค้า ──
  const updateItemField = (
    inventoryItemId: string,
    field: "quantity" | "unitCost",
    value: number,
  ) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.inventoryItemId === inventoryItemId
          ? { ...item, [field]: value }
          : item,
      ),
    );
  };

  // ── ลบรายการสินค้าออกจากตาราง ──
  const removeItem = (inventoryItemId: string) => {
    setOrderItems((prev) =>
      prev.filter((i) => i.inventoryItemId !== inventoryItemId),
    );
  };

  // ── คำนวณยอดรวม ──
  const totalAmount = orderItems.reduce(
    (acc, item) => acc + item.quantity * item.unitCost,
    0,
  );

  // ── Submit: ส่งคำสั่งซื้อ ──
  const handleSubmit = () => {
    if (orderItems.length === 0) {
      toast.error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    const formData: PurchaseOrderForm = {
      orderDate,
      items: orderItems,
    };

    startTransition(async () => {
      try {
        const result = await createPurchaseOrder(formData);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("สร้างใบสั่งซื้อเรียบร้อยแล้ว");
        // redirect กลับหน้า inventory พร้อม tab order
        router.push("/inventories?tab=order");
      } catch {
        toast.error("เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ");
      }
    });
  };

  return (
    <div className="w-full">
      <Card className="overflow-hidden">
        {/* ── Card Header ── */}
        <CardHeader className="border-b py-4">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
            <FileText size={16} /> ข้อมูลการสั่งซื้อสินค้า
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 md:px-8 py-2 bg-white">
          {/* ── ส่วนข้อมูลทั่วไป ── */}
          <FieldGroup className="pb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* วันที่สั่งซื้อ */}
            <Field>
              <FieldLabel className="font-medium text-muted-foreground text-xs md:text-sm uppercase">
                วันที่สั่งซื้อ
              </FieldLabel>
              <Input
                id="order-date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <Separator className="my-4" />

          {/* ── ส่วนค้นหาสินค้า ── */}
          <div className="py-4">
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm md:text-base font-bold text-muted-foreground uppercase flex items-center gap-2">
                <Search className="size-4" /> เพิ่มสินค้า
              </label>

              {/* Combobox ค้นหาสินค้า */}
              <div className="flex items-center gap-4 w-full">
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full max-w-sm justify-between"
                    >
                      {selectedItemId
                        ? inventoryItems.find((i) => i.id === selectedItemId)
                            ?.name
                        : "ค้นหาสินค้า..."}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-sm p-0">
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
                              <span className="ml-auto text-xs text-muted-foreground">
                                {item.inventoryCategoryName}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* ปุ่มเพิ่ม (กรณีเลือกสินค้าแล้ว) */}
                <Button
                  variant="default"
                  onClick={() =>
                    selectedItemId && handleAddItem(selectedItemId)
                  }
                  disabled={!selectedItemId}
                >
                  <Plus data-icon="inline-start" /> เพิ่มรายการ
                </Button>
              </div>
            </div>

            {/* ── ตารางรายการสินค้า ── */}
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
                        className="h-32 text-center text-muted-foreground italic"
                      >
                        ยังไม่มีรายการสินค้า — ค้นหาและเพิ่มสินค้าด้านบน
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderItems.map((item, index) => (
                      <TableRow key={item.inventoryItemId}>
                        {/* ลำดับ */}
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>

                        {/* ชื่อสินค้า */}
                        <TableCell className="font-medium">
                          {item.inventoryItemName}
                        </TableCell>

                        {/* จำนวน (editable) */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="w-20 text-right ml-auto"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemField(
                                item.inventoryItemId,
                                "quantity",
                                Math.max(1, Number(e.target.value)),
                              )
                            }
                          />
                        </TableCell>

                        {/* ราคา/หน่วย (editable) */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="w-24 text-right ml-auto"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateItemField(
                                item.inventoryItemId,
                                "unitCost",
                                Math.max(0, Number(e.target.value)),
                              )
                            }
                          />
                        </TableCell>

                        {/* ยอดรวมแถว */}
                        <TableCell className="text-right font-semibold tabular-nums">
                          ฿
                          {(item.quantity * item.unitCost).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </TableCell>

                        {/* ปุ่มลบแถว */}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-500"
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

          {/* ── สรุปยอดรวม ── */}
          <div className="pt-4 flex flex-col md:flex-row justify-end gap-10 bg-white">
            <div className="w-full md:w-80 flex flex-col gap-3">
              {/* ยอดสุทธิ */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary text-lg">
                  ยอดสุทธิรวม
                </span>
                <span className="text-2xl md:text-3xl font-bold text-primary tabular-nums">
                  ฿
                  {totalAmount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* ── Footer: ปุ่ม Submit ── */}
        <CardFooter className="flex justify-end border-t py-4">
          {/* ส่งคำสั่งซื้อ (สถานะ DRAFT → ผู้ใช้อัปเดตเองทีหลัง) */}
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isPending || orderItems.length === 0}
          >
            <Send data-icon="inline-start" />
            {isPending ? "กำลังส่ง..." : "สร้างใบสั่งซื้อ"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
