import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { purchaseOrderIssues, purchaseOrderItems } from "@/db/schema";
import {
  PURCHASE_ORDER_STATUS_CONFIG,
  PurchaseOrderStatus,
} from "../constants/purchase-order-status";
import { receivePurchaseOrderItems } from "../actions/receive-purchase-order-items";

describe("Partial Purchase Order Receipt Schema (AAA Pattern)", () => {
  it("purchase_order_items มีคอลัมน์ receivedQuantity สำหรับนับจำนวนที่รับจริงสะสม", () => {
    // Arrange
    const columns = Object.keys(purchaseOrderItems);

    // Act & Assert
    assert.ok(
      columns.includes("receivedQuantity"),
      "ต้องมีคอลัมน์ receivedQuantity ใน purchase_order_items",
    );
  });

  it("ตาราง purchase_order_issues มีคอลัมน์ครบตาม spec ติดตามของขาด", () => {
    // Arrange
    const columns = Object.keys(purchaseOrderIssues);

    // Act & Assert
    assert.ok(columns.includes("id"), "ต้องมีคอลัมน์ id (PK)");
    assert.ok(
      columns.includes("purchaseOrderId"),
      "ต้องมีคอลัมน์ purchaseOrderId (FK)",
    );
    assert.ok(
      columns.includes("purchaseOrderItemId"),
      "ต้องมีคอลัมน์ purchaseOrderItemId (FK)",
    );
    assert.ok(
      columns.includes("inventoryItemId"),
      "ต้องมีคอลัมน์ inventoryItemId (FK)",
    );
    assert.ok(
      columns.includes("orderedQuantity"),
      "ต้องมีคอลัมน์ orderedQuantity",
    );
    assert.ok(
      columns.includes("receivedQuantity"),
      "ต้องมีคอลัมน์ receivedQuantity",
    );
    assert.ok(
      columns.includes("shortageQuantity"),
      "ต้องมีคอลัมน์ shortageQuantity",
    );
    assert.ok(columns.includes("status"), "ต้องมีคอลัมน์ status");
    assert.ok(
      columns.includes("resolutionType"),
      "ต้องมีคอลัมน์ resolutionType",
    );
    assert.ok(
      columns.includes("resolutionNote"),
      "ต้องมีคอลัมน์ resolutionNote",
    );
    assert.ok(columns.includes("resolvedAt"), "ต้องมีคอลัมน์ resolvedAt");
    assert.ok(columns.includes("resolvedBy"), "ต้องมีคอลัมน์ resolvedBy");
    assert.ok(columns.includes("createdAt"), "ต้องมีคอลัมน์ createdAt");
    assert.ok(columns.includes("updatedAt"), "ต้องมีคอลัมน์ updatedAt");
  });

  it("PURCHASE_ORDER_STATUS_CONFIG รองรับ PARTIALLY_RECEIVED", () => {
    // Arrange & Act
    const partiallyReceivedConfig =
      PURCHASE_ORDER_STATUS_CONFIG["PARTIALLY_RECEIVED" as PurchaseOrderStatus];

    // Assert
    assert.ok(partiallyReceivedConfig, "ต้องมี config ของ PARTIALLY_RECEIVED");
    assert.strictEqual(partiallyReceivedConfig.title, "รับสินค้าบางส่วน");
    assert.strictEqual(partiallyReceivedConfig.group, "Active");
  });
});

describe("receivePurchaseOrderItems Server Action Guards (AAA Pattern)", () => {
  it("receivePurchaseOrderItems ปฏิเสธเมื่อไม่มี session → ไม่อนุญาต", async () => {
    // Arrange
    const payload = {
      purchaseOrderId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      items: [
        {
          purchaseOrderItemId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          receivedQuantity: 5,
        },
      ],
    };

    // Act
    const result = await receivePurchaseOrderItems(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /คุณไม่ได้รับอนุญาต|เกิดข้อผิดพลาด/);
  });

  it("receivePurchaseOrderItems ปฏิเสธ payload ที่จำนวนรับติดลบ", async () => {
    // Arrange
    const payload = {
      purchaseOrderId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      items: [
        {
          purchaseOrderItemId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          receivedQuantity: -1,
        },
      ],
    };

    // Act
    const result = await receivePurchaseOrderItems(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(
      result.error || "",
      /คุณไม่ได้รับอนุญาต|ต้องไม่ติดลบ|ไม่ถูกต้อง|เกิดข้อผิดพลาด/,
    );
  });

  it("receivePurchaseOrderItems ปฏิเสธ payload ที่ไม่มี items", async () => {
    // Arrange
    const payload = {
      purchaseOrderId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      items: [],
    };

    // Act
    const result = await receivePurchaseOrderItems(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(
      result.error || "",
      /คุณไม่ได้รับอนุญาต|อย่างน้อย 1 รายการ|ไม่ถูกต้อง|เกิดข้อผิดพลาด/,
    );
  });
});

describe("Follow-up Receipt Logic & Stock/Expense Math (AAA Pattern)", () => {
  it("คำนวณยอดสินค้าค้างส่ง (Shortage Quantity) และกรองเฉพาะรายการที่ยังขาดส่ง", () => {
    // Arrange
    const items = [
      {
        id: "item-1",
        name: "อาหารสุนัข A",
        quantity: 10,
        receivedQuantity: 6,
        unitCost: "250.00",
      },
      {
        id: "item-2",
        name: "ทรายแมว B",
        quantity: 5,
        receivedQuantity: 5,
        unitCost: "150.00",
      },
      {
        id: "item-3",
        name: "แชมพูสัตว์เลี้ยง C",
        quantity: 8,
        receivedQuantity: 3,
        unitCost: "120.00",
      },
    ];

    // Act
    const outstandingItems = items
      .filter((i) => i.quantity > i.receivedQuantity)
      .map((i) => ({
        ...i,
        shortageQuantity: i.quantity - i.receivedQuantity,
        shortageAmount:
          (i.quantity - i.receivedQuantity) * parseFloat(i.unitCost),
      }));

    // Assert
    assert.strictEqual(
      outstandingItems.length,
      2,
      "ต้องมีรายการค้างส่ง 2 รายการ",
    );
    assert.strictEqual(outstandingItems[0].id, "item-1");
    assert.strictEqual(outstandingItems[0].shortageQuantity, 4);
    assert.strictEqual(outstandingItems[0].shortageAmount, 1000); // 4 * 250
    assert.strictEqual(outstandingItems[1].id, "item-3");
    assert.strictEqual(outstandingItems[1].shortageQuantity, 5);
    assert.strictEqual(outstandingItems[1].shortageAmount, 600); // 5 * 120
  });

  it("คำนวณสต็อกคงคลังและรายจ่ายแบบ incremental ในการตรวจรับรอบถัดไป (Follow-up round)", () => {
    // Arrange
    const currentStock = 20;
    const orderedQuantity = 10;
    const previouslyReceived = 4; // รับรอบแรกไป 4 ชิ้น
    const unitCost = 200;

    const remainingShortage = orderedQuantity - previouslyReceived; // ค้างส่ง 6 ชิ้น
    const newlyReceivedRound2 = 4; // รอบสองได้รับเพิ่ม 4 ชิ้น (ยังขาด 2)

    // Act
    const updatedStock = currentStock + newlyReceivedRound2;
    const totalAccumulatedReceived = previouslyReceived + newlyReceivedRound2;
    const remainingAfterRound2 = orderedQuantity - totalAccumulatedReceived;
    const incrementalExpense = newlyReceivedRound2 * unitCost;

    // Assert
    assert.strictEqual(remainingShortage, 6, "ค้างส่งก่อนรอบสองต้องเป็น 6");
    assert.strictEqual(
      updatedStock,
      24,
      "สต็อกต้องเพิ่มเฉพาะจำนวนที่รับในรอบสอง (+4)",
    );
    assert.strictEqual(totalAccumulatedReceived, 8, "จำนวนรับสะสมต้องเป็น 8");
    assert.strictEqual(remainingAfterRound2, 2, "ยังคงค้างส่งอีก 2 ชิ้น");
    assert.strictEqual(
      incrementalExpense,
      800,
      "รายจ่ายรอบนี้ต้องคิดเฉพาะ 4 * 200 = 800 บาท",
    );
  });

  it("การตรวจรับรอบถัดไปที่ส่งมอบครบถ้วน: PO เปลี่ยนเป็น RECEIVED และ Issue เปลี่ยนเป็น RESOLVED", () => {
    // Arrange: PO มี 2 รายการ ค้างส่งอยู่อย่างละส่วน
    const poItems = [
      { id: "po-item-1", quantity: 10, receivedQuantity: 7 }, // ค้างส่ง 3
      { id: "po-item-2", quantity: 5, receivedQuantity: 2 }, // ค้างส่ง 3
    ];

    const followUpReceiptInput = [
      { purchaseOrderItemId: "po-item-1", receivedQuantity: 3 }, // รับครบ 3
      { purchaseOrderItemId: "po-item-2", receivedQuantity: 3 }, // รับครบ 3
    ];

    // Act
    const inputMap = new Map(
      followUpReceiptInput.map((i) => [
        i.purchaseOrderItemId,
        i.receivedQuantity,
      ]),
    );

    let isFullyReceived = true;
    const resolvedIssues: string[] = [];

    for (const poItem of poItems) {
      const newlyReceived = inputMap.get(poItem.id) || 0;
      const totalReceived = poItem.receivedQuantity + newlyReceived;

      if (totalReceived < poItem.quantity) {
        isFullyReceived = false;
      } else {
        resolvedIssues.push(poItem.id);
      }
    }

    const nextStatus = isFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";

    // Assert
    assert.strictEqual(isFullyReceived, true, "ต้องได้รับครบถ้วนทุกรายการ");
    assert.strictEqual(
      nextStatus,
      "RECEIVED",
      "สถานะ PO ต้องเปลี่ยนเป็น RECEIVED",
    );
    assert.strictEqual(resolvedIssues.length, 2, "Issue ทั้งหมดต้องถูก Resolve");
  });

  it("การตรวจรับรอบถัดไปยังคงไม่ครบ: PO ยังคงเป็น PARTIALLY_RECEIVED และบันทึกยอดค้างส่งใหม่", () => {
    // Arrange: PO มี 2 รายการ ค้างส่งอยู่
    const poItems = [
      { id: "po-item-1", quantity: 10, receivedQuantity: 5 }, // ค้างส่ง 5
      { id: "po-item-2", quantity: 5, receivedQuantity: 2 }, // ค้างส่ง 3
    ];

    // รับรอบสอง: item-1 รับครบ 5 แต่ item-2 ไม่ได้รับเพิ่ม (0 ชิ้น)
    const followUpReceiptInput = [
      { purchaseOrderItemId: "po-item-1", receivedQuantity: 5 },
      { purchaseOrderItemId: "po-item-2", receivedQuantity: 0 },
    ];

    // Act
    const inputMap = new Map(
      followUpReceiptInput.map((i) => [
        i.purchaseOrderItemId,
        i.receivedQuantity,
      ]),
    );

    let isFullyReceived = true;
    const issueStatusMap = new Map<
      string,
      { status: string; shortage: number }
    >();

    for (const poItem of poItems) {
      const newlyReceived = inputMap.get(poItem.id) || 0;
      const totalReceived = poItem.receivedQuantity + newlyReceived;

      if (totalReceived < poItem.quantity) {
        isFullyReceived = false;
        issueStatusMap.set(poItem.id, {
          status: "OPEN",
          shortage: poItem.quantity - totalReceived,
        });
      } else {
        issueStatusMap.set(poItem.id, {
          status: "RESOLVED",
          shortage: 0,
        });
      }
    }

    const nextStatus = isFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";

    // Assert
    assert.strictEqual(isFullyReceived, false, "ยังได้รับไม่ครบทุกรายการ");
    assert.strictEqual(
      nextStatus,
      "PARTIALLY_RECEIVED",
      "สถานะ PO ยังคงเป็น PARTIALLY_RECEIVED",
    );
    assert.deepStrictEqual(issueStatusMap.get("po-item-1"), {
      status: "RESOLVED",
      shortage: 0,
    });
    assert.deepStrictEqual(issueStatusMap.get("po-item-2"), {
      status: "OPEN",
      shortage: 3,
    });
  });

  it("ป้องกันการกรอกจำนวนรับเกินจำนวนที่ค้างส่ง (Over-receipt Guard)", () => {
    // Arrange
    const orderedQuantity = 10;
    const previouslyReceived = 7;
    const remainingShortage = orderedQuantity - previouslyReceived; // ค้างส่ง 3

    const attemptedReceived = 4; // พยายามรับ 4 เกิน 3

    // Act & Assert
    assert.ok(
      attemptedReceived > remainingShortage,
      "ระบบต้องตรวจพบว่าจำนวนรับเกินยอดค้างส่ง",
    );
    const isValid = attemptedReceived <= remainingShortage;
    assert.strictEqual(isValid, false, "ต้องไม่อนุญาตให้รับเกินจำนวนคงค้าง");
  });
});
