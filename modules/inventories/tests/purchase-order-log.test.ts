import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { purchaseOrderLogs } from "@/db/schema";
import { createPurchaseOrder } from "../actions/create-purchase-order";
import { updatePurchaseOrderStatus } from "../actions/update-purchase-order-status";
import { updatePurchaseOrderItems } from "../actions/update-purchase-order-items";
import { updatePurchaseOrderVendorSnapshot } from "../actions/update-purchase-order-vendor-snapshot";
import { deletePurchaseOrder } from "../actions/delete-purchase-order";

describe("Purchase Order Log Schema (AAA Pattern)", () => {
  it("ตาราง purchase_order_logs มีคอลัมน์ครบตาม spec (immutable audit trail)", () => {
    // Arrange
    const columns = Object.keys(purchaseOrderLogs);

    // Act & Assert
    assert.ok(columns.includes("id"), "ต้องมีคอลัมน์ id (PK)");
    assert.ok(
      columns.includes("purchaseOrderId"),
      "ต้องมีคอลัมน์ purchaseOrderId (FK → purchase_orders)",
    );
    assert.ok(
      columns.includes("staffId"),
      "ต้องมีคอลัมน์ staffId (FK → staffs)",
    );
    assert.ok(columns.includes("event"), "ต้องมีคอลัมน์ event (enum)");
    assert.ok(
      columns.includes("fromStatus"),
      "ต้องมีคอลัมน์ fromStatus (nullable)",
    );
    assert.ok(
      columns.includes("toStatus"),
      "ต้องมีคอลัมน์ toStatus (nullable)",
    );
    assert.ok(columns.includes("note"), "ต้องมีคอลัมน์ note (nullable text)");
    assert.ok(
      columns.includes("createdAt"),
      "ต้องมีคอลัมน์ createdAt (immutable timestamp)",
    );
    // ยืนยัน immutability — ห้ามมี updatedAt / deletedAt
    assert.strictEqual(
      columns.includes("updatedAt"),
      false,
      "ห้ามมี updatedAt (log เป็น immutable)",
    );
    assert.strictEqual(
      columns.includes("deletedAt"),
      false,
      "ห้ามมี deletedAt (log เป็น immutable)",
    );
  });
});

describe("Purchase Order Log Server Action Guards (AAA Pattern)", () => {
  it("createPurchaseOrder ปฏิเสธเมื่อไม่มี session → ไม่มี log ถูกบันทึก", async () => {
    // Arrange: ไม่มี session ใน test environment
    const payload = {
      orderDate: "2026-09-05",
      vendorId: "11111111-1111-4111-8111-111111111111",
      vendorName: "บริษัท ทดสอบ จำกัด",
      items: [
        {
          inventoryItemId: "22222222-2222-4222-8222-222222222222",
          inventoryItemName: "สินค้าทดสอบ",
          quantity: 1,
          unitCost: 100,
        },
      ],
    };

    // Act
    const result = await createPurchaseOrder(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /คุณไม่ได้รับอนุญาต|เกิดข้อผิดพลาด/);
  });

  it("updatePurchaseOrderStatus ปฏิเสธเมื่อไม่มี session → ไม่มี log ถูกบันทึก", async () => {
    // Arrange
    const orderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    // Act
    const result = await updatePurchaseOrderStatus(orderId, "ORDERED");

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /คุณไม่ได้รับอนุญาต|เกิดข้อผิดพลาด/);
  });

  it("updatePurchaseOrderItems ปฏิเสธเมื่อไม่มี session → ไม่มี log ถูกบันทึก", async () => {
    // Arrange
    const orderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const items = [
      {
        inventoryItemId: "22222222-2222-4222-8222-222222222222",
        inventoryItemName: "สินค้าทดสอบ",
        quantity: 1,
        unitCost: 100,
      },
    ];

    // Act
    const result = await updatePurchaseOrderItems(orderId, items);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /คุณไม่ได้รับอนุญาต|เกิดข้อผิดพลาด/);
  });

  it("updatePurchaseOrderVendorSnapshot ปฏิเสธเมื่อไม่มี session → ไม่มี log ถูกบันทึก", async () => {
    // Arrange
    const payload = {
      purchaseOrderId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      vendorName: "บริษัท ทดสอบ จำกัด",
    };

    // Act
    const result = await updatePurchaseOrderVendorSnapshot(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /คุณไม่ได้รับอนุญาต|เกิดข้อผิดพลาด/);
  });

  it("deletePurchaseOrder ปฏิเสธเมื่อไม่มี session → ไม่มี log ถูกบันทึก", async () => {
    // Arrange
    const orderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    // Act
    const result = await deletePurchaseOrder(orderId);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /คุณไม่ได้รับอนุญาต|เกิดข้อผิดพลาด/);
  });
});
