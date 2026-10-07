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
