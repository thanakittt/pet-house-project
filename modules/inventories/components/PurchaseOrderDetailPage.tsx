"use client";

import {
  User,
  Calendar,
  Hash,
  ShoppingCart,
  Pencil,
  Check,
  X,
  Trash2,
  ChevronsUpDown,
  Save,
  MinusIcon,
  PlusIcon,
  Info,
} from "lucide-react";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useEffect, useState, useTransition } from "react";
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
import { cn, formatThaiDate, formatThaiDateTime } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

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

function adjustOrderQuantity(quantity: number, change: 1 | -1): number {
  return Math.max(1, quantity + change);
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
  const canEdit = currentStatus === "DRAFT" || currentStatus === "ORDERED";

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

  useEffect(() => {
    setEditItems(
      order.items.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        inventoryItemName: item.inventoryItemName,
        quantity: item.quantity,
        unitCost: parseFloat(item.unitCost),
      })),
    );
  }, [order.items]);

  useEffect(() => {
    const laptopQuery = window.matchMedia("(min-width: 1024px)");

    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        setIsEditing(false);
      }
    };

    laptopQuery.addEventListener("change", handleViewportChange);
    return () => {
      laptopQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

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

  const formattedDate = formatThaiDate(order.orderDate);
  const formattedCreatedAt = formatThaiDateTime(order.createdAt);

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
      <Card className="py-6  px-2">
        {/* ── Title ── */}
        <div className="flex flex-col">
          <CardHeader className="flex flex-row  justify-between items-center gap-4">
            <div className="flex flex-row items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary">
                {formatPoNumber(order.id)}
              </h1>
              <Badge
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full",
                  statusConfig.color,
                )}
              >
                {statusConfig.title}
              </Badge>
            </div>
            <div className="backdrop-blur-sm flex justify-end">
              <StatusUpdate
                orderId={order.id}
                currentStatus={currentStatus}
                desktopOnly
              />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground font-medium pt-2">
            สร้างเมื่อ:{" "}
            <span className="text-primary">{formattedCreatedAt}</span>
          </CardContent>
        </div>



      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Info ── */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="py-6 px-2">
            <CardHeader>
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <Info className="text-primary" size={18} />  รายละเอียดอ้างอิง
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col  space-y-4">
                <div className="flex items-start gap-4 bg-muted/50 p-4 rounded-lg">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      วันที่กำหนดส่ง / สั่งซื้อ
                    </span>
                    <span className="text-sm md:text-base font-bold text-primary">
                      {formattedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-muted/50 rounded-lg p-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      ผู้รับผิดชอบ
                    </span>
                    <span className="text-sm md:text-base font-bold text-primary">
                      {order.staffNickname}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-muted/50 rounded-lg p-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                    <Hash size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      รหัสเอกสาร
                    </span>
                    <span className="text-sm md:text-base font-mono font-bold text-primary">
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
          <Card className="py-6">
            <CardHeader className="px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                  <ShoppingCart size={18} />
                  รายการสินค้าที่สั่งซื้อ
                </CardTitle>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground "
                  >
                    {displayItems.length} รายการ
                  </Badge>

                  {canEdit && !isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden lg:inline-flex gap-1.5 text-muted-foreground hover:text-primary h-8"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil size={13} />
                      แก้ไขรายการ
                    </Button>
                  )}

                  {isEditing && (
                    <div className="hidden lg:flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 text-muted-foreground hover:text-primary"

                        onClick={handleCancelEdit}
                      >
                        <X size={13} />
                        ยกเลิก
                      </Button>
                      <LoadingButton
                        size="sm"
                        className="gap-1.5 h-8"
                        disabled={isPending || editItems.length === 0}
                        isLoading={isPending}
                        loadingText="กำลังบันทึก..."
                        onClick={handleSaveEdit}
                      >
                        <Save data-icon="inline-start" />
                        บันทึก
                      </LoadingButton>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="hidden lg:flex items-center gap-3 mt-5">
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full sm:max-w-xs justify-between text-muted-foreground h-9 text-sm"
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
                                      ? "opacity-100 text-primary"
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
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">
                        #
                      </TableHead>
                      <TableHead>
                        ชื่อสินค้า
                      </TableHead>
                      <TableHead className="text-right">
                        จำนวน
                      </TableHead>
                      <TableHead className="text-right">
                        ราคา/หน่วย
                      </TableHead>
                      <TableHead className="text-right">
                        ยอดรวม
                      </TableHead>
                      {isEditing && <TableHead />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isEditing ? 6 : 5}
                        >
                          <div className="text-muted-foreground flex flex-col items-center gap-2 justify-center h-full py-6">
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
                          className="hover:bg-muted transition-colors group"
                        >
                          <TableCell className="text-xs text-center font-medium">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {item.inventoryItemName}
                          </TableCell>
                          <TableCell className="text-right">
                            <InputGroup className="ml-auto h-8 w-28">
                              <InputGroupAddon>
                                <InputGroupButton
                                  size="icon-xs"
                                  aria-label="ลดจำนวนสินค้า"
                                  disabled={item.quantity <= 1}
                                  onClick={() =>
                                    updateEditItemField(
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
                                min="1"
                                step="1"
                                className="text-right text-sm"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateEditItemField(
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
                                    updateEditItemField(
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
                          <TableCell className="text-right text-primary font-bold tabular-nums">
                            {/* คำนวณแปลงค่าเป็น 0 กรณีค่าว่าง */}฿
                            {formatCurrency(
                              item.quantity * (Number(item.unitCost) || 0),
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="size-8"
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
                          >
                            <TableCell className="text-muted-foreground text-left font-medium group-hover:text-muted-foreground transition-colors">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="text-primary font-medium">
                              {item.inventoryItemName}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground tabular-nums font-medium">
                              ฿{formatCurrency(parseFloat(item.unitCost))}
                            </TableCell>
                            <TableCell className="text-right text-primary font-bold tabular-nums">
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
                <div className="flex flex-row justify-end items-end gap-4 px-6 pt-6">
                  <div className="w-full sm:w-auto min-w-[240px]">
                    <div className="flex flex-row justify-between items-center gap-8">
                      <span className="font-bold text-muted-foreground text-sm">
                        ยอดรวมสุทธิ
                      </span>
                      <span className="text-3xl font-extrabold text-primary tabular-nums tracking-tight">
                        <span className="text-xl font-bold mr-1">
                          ฿
                        </span>
                        {formatCurrency(totalAmount)}
                      </span>
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
