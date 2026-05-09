"use client";

import {
  Package,
  User,
  Calendar,
  Hash,
  Receipt,
  ShoppingCart,
  Pencil,
  Check,
  X,
  Trash2,
  ChevronsUpDown,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import StatusUpdate from "@/modules/inventories/components/StatusUpdate";
import {
  PURCHASE_ORDER_STATUS_CONFIG,
  PurchaseOrderStatus,
} from "@/modules/inventories/constants/purchase-order-status";
import {
  PurchaseOrderDetail,
  PurchaseOrderItemForm,
} from "@/modules/inventories/types/purchase-order";
import { updatePurchaseOrderItems } from "@/modules/inventories/actions/update-purchase-order-items";
import { InventoryItem } from "@/modules/inventories/types/inventory";
import { cn } from "@/lib/utils";

// 1. สร้าง Type สำหรับ Local State เพื่อรองรับค่าว่างใน Edit Mode
interface OrderItemEditState extends Omit<PurchaseOrderItemForm, "unitCost"> {
  unitCost: number | string;
}

// ── Helper: format ยอดเงินเป็นบาท ──
function formatCurrency(value: number): string {
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Helper: แสดงเลขที่ PO จาก UUID (8 ตัวท้าย uppercase) ──
function formatPoNumber(id: string): string {
  return `#PO-${id.replace(/-/g, "").toUpperCase().slice(-8)}`;
}

/**
 * PurchaseOrderDetailPage — หน้าแสดงรายละเอียดใบสั่งซื้อ
 */
export default function PurchaseOrderDetailPage({
  order,
  inventoryItems = [],
}: {
  order: PurchaseOrderDetail;
  inventoryItems?: InventoryItem[];
}) {
  const currentStatus = order.status as PurchaseOrderStatus;
  const statusConfig = PURCHASE_ORDER_STATUS_CONFIG[currentStatus];
  const isDraft = currentStatus === "DRAFT";

  // ── State: โหมดแก้ไข ──
  const [isEditing, setIsEditing] = useState(false);

  // 2. ใช้ Local Type ที่รองรับค่าว่างกับ State ของการ Edit
  const [editItems, setEditItems] = useState<OrderItemEditState[]>(
    order.items.map((item) => ({
      inventoryItemId: item.inventoryItemId,
      inventoryItemName: item.inventoryItemName,
      quantity: item.quantity,
      unitCost: parseFloat(item.unitCost),
    })),
  );

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");

  const [isPending, startTransition] = useTransition();

  // 3. ปรับการคำนวณ totalAmount โดยแปลง unitCost กลับเป็นตัวเลข
  const displayItems = isEditing ? editItems : order.items;
  const totalAmount = isEditing
    ? editItems.reduce(
        (acc, item) => acc + item.quantity * (Number(item.unitCost) || 0),
        0,
      )
    : order.items.reduce(
        (acc, item) => acc + item.quantity * parseFloat(item.unitCost),
        0,
      );

  const formattedDate = format(new Date(order.orderDate), "d MMMM yyyy", {
    locale: th,
  });

  const formattedCreatedAt = format(
    new Date(order.createdAt),
    "d MMM yyyy, HH:mm น.",
    { locale: th },
  );

  const handleAddItem = (inventoryItemId: string) => {
    const product = inventoryItems.find((p) => p.id === inventoryItemId);
    if (!product) return;

    const existing = editItems.find(
      (i) => i.inventoryItemId === inventoryItemId,
    );
    if (existing) {
      updateEditItemField(inventoryItemId, "quantity", existing.quantity + 1);
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          inventoryItemId: product.id,
          inventoryItemName: product.name,
          quantity: 1,
          unitCost: "", // 4. ค่า default ให้ราคาตั้งต้นเป็น ""
        },
      ]);
    }
    setComboboxOpen(false);
    setSelectedItemId("");
  };

  // 5. รองรับ parameter unitCost เป็น string ("")
  const updateEditItemField = (
    inventoryItemId: string,
    field: "quantity" | "unitCost",
    value: number | string,
  ) => {
    setEditItems((prev) =>
      prev.map((item) =>
        item.inventoryItemId === inventoryItemId
          ? { ...item, [field]: value }
          : item,
      ),
    );
  };

  const removeEditItem = (inventoryItemId: string) => {
    setEditItems((prev) =>
      prev.filter((i) => i.inventoryItemId !== inventoryItemId),
    );
  };

  const handleCancelEdit = () => {
    setEditItems(
      order.items.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        inventoryItemName: item.inventoryItemName,
        quantity: item.quantity,
        unitCost: parseFloat(item.unitCost),
      })),
    );
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    // แจ้งเตือนหากลืมใส่ราคา
    const hasEmptyCost = editItems.some((item) => item.unitCost === "");
    if (hasEmptyCost) {
      toast.error("กรุณาระบุราคาต่อหน่วยให้ครบทุกรายการก่อนบันทึก");
      return;
    }

    // ตรวจสอบและป้องกันค่า NaN
    const hasInvalidCost = editItems.some((item) => {
      const parsed = parseFloat(String(item.unitCost));
      return !Number.isFinite(parsed);
    });

    if (hasInvalidCost) {
      toast.error("กรุณาระบุราคาต่อหน่วยให้ถูกต้องก่อนบันทึก");
      return;
    }

    // 6. แปลง State ให้ถูกต้องตาม PurchaseOrderItemForm ก่อนส่ง
    const payload = editItems.map((item) => ({
      ...item,
      unitCost: parseFloat(String(item.unitCost)),
    })) as PurchaseOrderItemForm[];

    startTransition(async () => {
      const result = await updatePurchaseOrderItems(order.id, payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("อัปเดตรายการสินค้าเรียบร้อย");
      setIsEditing(false);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header Area ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 size-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full blur-3xl opacity-50" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Receipt size={20} />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                {formatPoNumber(order.id)}
              </h1>
              <Badge
                className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full shadow-sm",
                  statusConfig.color,
                )}
              >
                {statusConfig.title}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              สร้างเมื่อ{" "}
              <span className="text-slate-700">{formattedCreatedAt}</span>
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto">
            <div className="bg-slate-50/80 p-1.5 rounded-xl border border-slate-100 backdrop-blur-sm flex justify-end">
              <StatusUpdate orderId={order.id} currentStatus={currentStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Info ── */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                รายละเอียดอ้างอิง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      วันที่กำหนดส่ง / สั่งซื้อ
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formattedDate}
                    </span>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      ผู้รับผิดชอบ
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {order.staffNickname}
                    </span>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                    <Hash size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      รหัสเอกสาร
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {order.id.split("-")[0]}...
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Items Table ── */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
            <CardHeader className="border-b border-slate-100 py-5 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-slate-500" />
                  รายการสินค้าที่สั่งซื้อ
                </CardTitle>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    {displayItems.length} รายการ
                  </Badge>

                  {isDraft && !isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-slate-600 hover:text-slate-900 h-8"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil size={13} />
                      แก้ไขรายการ
                    </Button>
                  )}

                  {isEditing && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 h-8 text-slate-500 hover:text-slate-900"
                        disabled={isPending}
                        onClick={handleCancelEdit}
                      >
                        <X size={13} />
                        ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 h-8 bg-slate-900 hover:bg-slate-700 text-white"
                        disabled={isPending || editItems.length === 0}
                        onClick={handleSaveEdit}
                      >
                        <Save size={13} />
                        {isPending ? "กำลังบันทึก..." : "บันทึก"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full sm:max-w-xs justify-between text-slate-500 h-9 text-sm"
                      >
                        {selectedItemId
                          ? inventoryItems.find((i) => i.id === selectedItemId)
                              ?.name
                          : "ค้นหาและเพิ่มสินค้า..."}
                        <ChevronsUpDown
                          size={14}
                          className="ml-2 shrink-0 opacity-50"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-xs p-0">
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
                                  size={14}
                                  className={cn(
                                    "mr-2",
                                    editItems.some(
                                      (e) => e.inventoryItemId === item.id,
                                    )
                                      ? "opacity-100 text-green-500"
                                      : "opacity-0",
                                  )}
                                />
                                <span>{item.name}</span>
                                <span className="ml-auto text-xs text-slate-400">
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
              )}
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
                      <TableHead className="w-12 text-center text-slate-500 font-semibold">
                        #
                      </TableHead>
                      <TableHead className="text-slate-500 font-semibold">
                        ชื่อสินค้า
                      </TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold w-28">
                        จำนวน
                      </TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold w-32">
                        ราคา/หน่วย
                      </TableHead>
                      <TableHead className="text-right text-slate-800 font-bold w-36">
                        ยอดรวม
                      </TableHead>
                      {isEditing && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isEditing ? 6 : 5}
                          className="h-32 text-center text-slate-400 italic bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center gap-2 justify-center h-full">
                            <Package size={24} className="opacity-20" />
                            <span>
                              ยังไม่มีรายการสินค้า — ค้นหาสินค้าด้านบนเพื่อเพิ่ม
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : isEditing ? (
                      editItems.map((item, idx) => (
                        <TableRow
                          key={item.inventoryItemId}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <TableCell className="text-slate-400 text-xs text-center font-medium">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-700">
                            {item.inventoryItemName}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="1"
                              className="w-20 text-right ml-auto h-8 text-sm"
                              value={item.quantity}
                              onChange={(e) =>
                                updateEditItemField(
                                  item.inventoryItemId,
                                  "quantity",
                                  Math.max(1, Number(e.target.value)),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {/* 7. Input ของราคารองรับค่าว่าง (Edit Mode) */}
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              className="w-24 text-right ml-auto h-8 text-sm"
                              value={item.unitCost}
                              onChange={(e) => {
                                const val = e.target.value;
                                const parsed = parseFloat(val);
                                updateEditItemField(
                                  item.inventoryItemId,
                                  "unitCost",
                                  val === "" ? "" : (Number.isFinite(parsed) ? Math.max(0, parsed) : val),
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right text-slate-900 font-bold tabular-nums">
                            {/* คำนวณแปลงค่าเป็น 0 กรณีค่าว่าง */}฿
                            {formatCurrency(
                              item.quantity * (Number(item.unitCost) || 0),
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() =>
                                removeEditItem(item.inventoryItemId)
                              }
                              aria-label="ลบรายการสินค้า"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      // ── View Mode Rows ──
                      order.items.map((item, idx) => {
                        const rowTotal =
                          item.quantity * parseFloat(item.unitCost);
                        return (
                          <TableRow
                            key={item.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <TableCell className="text-slate-400 text-xs text-center font-medium group-hover:text-slate-600 transition-colors">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700">
                              {item.inventoryItemName}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className="bg-white font-mono tabular-nums"
                              >
                                {item.quantity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-slate-600 tabular-nums font-medium">
                              ฿{formatCurrency(parseFloat(item.unitCost))}
                            </TableCell>
                            <TableCell className="text-right text-slate-900 font-bold tabular-nums bg-slate-50/30 group-hover:bg-transparent transition-colors">
                              ฿{formatCurrency(rowTotal)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ── Footer: ยอดรวม ── */}
              <div className="mt-auto">
                <div className="px-6 py-6 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                    <div className="text-slate-500 text-sm">
                      * ราคาทั้งหมดยังไม่รวมภาษีมูลค่าเพิ่ม (ถ้ามี)
                    </div>

                    <div className="w-full sm:w-auto min-w-[240px] bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center gap-8">
                        <span className="font-bold text-slate-600 uppercase tracking-wide text-sm">
                          ยอดรวมสุทธิ
                        </span>
                        <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                          <span className="text-xl text-slate-400 font-bold mr-1">
                            ฿
                          </span>
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
