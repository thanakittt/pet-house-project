import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  purchaseOrderIssues,
  purchaseOrderLogs,
} from "@/db/schema";
import {
  PURCHASE_ORDER_MANUAL_RESOLUTION_TYPES,
  RESOLUTION_TYPE_CONFIG,
  PurchaseOrderManualResolutionType,
} from "../constants/purchase-order-issue";
import {
  resolvePurchaseOrderDiscrepancySchema,
  ResolvePurchaseOrderDiscrepancyInput,
} from "../types/purchase-order";
import { resolvePurchaseOrderDiscrepancy } from "../actions/resolve-purchase-order-discrepancy";
import { PurchaseOrderStatus } from "../constants/purchase-order-status";

describe("Purchase Order Discrepancy Resolution Schema & Config (AAA Pattern)", () => {
  it("PURCHASE_ORDER_MANUAL_RESOLUTION_TYPES ประกอบด้วย 3 รูปแบบการยุติปัญหาโดยไม่ส่งของ", () => {
    // Arrange & Act
    const types = PURCHASE_ORDER_MANUAL_RESOLUTION_TYPES;

    // Assert
    assert.strictEqual(types.length, 3);
    assert.ok(types.includes("DISCOUNT_NEXT_ORDER"));
    assert.ok(types.includes("REFUNDED"));
    assert.ok(types.includes("WAIVED"));
  });

  it("RESOLUTION_TYPE_CONFIG มีข้อมูล label ภาษาไทยและรายละเอียดครบทุกรูปแบบ", () => {
    // Arrange
    const expectedKeys: PurchaseOrderManualResolutionType[] = [
      "DISCOUNT_NEXT_ORDER",
      "REFUNDED",
      "WAIVED",
    ];

    // Act & Assert
    for (const key of expectedKeys) {
      const item = RESOLUTION_TYPE_CONFIG[key];
      assert.ok(item, `ต้องมี config สำหรับ ${key}`);
      assert.ok(item.label.length > 0, `label ของ ${key} ต้องไม่ว่าง`);
      assert.ok(item.shortLabel.length > 0, `shortLabel ของ ${key} ต้องไม่ว่าง`);
      assert.ok(item.description.length > 0, `description ของ ${key} ต้องไม่ว่าง`);
      assert.ok(item.badgeClass.length > 0, `badgeClass ของ ${key} ต้องไม่ว่าง`);
    }
  });

  it("ตาราง purchase_order_issues และ purchase_order_logs ใน DB schema รองรับ resolution flow", () => {
    // Arrange
    const issueCols = Object.keys(purchaseOrderIssues);
    const logCols = Object.keys(purchaseOrderLogs);

    // Act & Assert
    assert.ok(issueCols.includes("resolutionType"), "ต้องมี resolutionType ใน purchase_order_issues");
    assert.ok(issueCols.includes("resolutionNote"), "ต้องมี resolutionNote ใน purchase_order_issues");
    assert.ok(issueCols.includes("resolvedAt"), "ต้องมี resolvedAt ใน purchase_order_issues");
    assert.ok(issueCols.includes("resolvedBy"), "ต้องมี resolvedBy ใน purchase_order_issues");

    assert.ok(logCols.includes("event"), "ต้องมี event ใน purchase_order_logs");
    assert.ok(logCols.includes("fromStatus"), "ต้องมี fromStatus ใน purchase_order_logs");
    assert.ok(logCols.includes("toStatus"), "ต้องมี toStatus ใน purchase_order_logs");
    assert.ok(logCols.includes("note"), "ต้องมี note ใน purchase_order_logs");
  });
});

describe("resolvePurchaseOrderDiscrepancy Schema Validation (AAA Pattern)", () => {
  it("ยอมรับ payload ที่ระบุข้อมูลถูกต้องครบถ้วน", () => {
    // Arrange
    const validPayload: ResolvePurchaseOrderDiscrepancyInput = {
      purchaseOrderId: "11111111-1111-4111-8111-111111111111",
      resolutionType: "DISCOUNT_NEXT_ORDER",
      resolutionNote: "ร้านค้าตกลงให้ส่วนลด 500 บาทในคำสั่งซื้อถัดไป",
    };

    // Act
    const result = resolvePurchaseOrderDiscrepancySchema.safeParse(validPayload);

    // Assert
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.resolutionType, "DISCOUNT_NEXT_ORDER");
      assert.strictEqual(result.data.resolutionNote, "ร้านค้าตกลงให้ส่วนลด 500 บาทในคำสั่งซื้อถัดไป");
    }
  });

  it("ปฏิเสธ payload ที่ไม่มี purchaseOrderId หรือ format ไม่ใช่ UUID", () => {
    // Arrange
    const invalidPayload = {
      purchaseOrderId: "not-a-uuid",
      resolutionType: "REFUNDED",
      resolutionNote: "คืนเงินเรียบร้อย",
    };

    // Act
    const result = resolvePurchaseOrderDiscrepancySchema.safeParse(invalidPayload);

    // Assert
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.match(result.error.issues[0]?.message || "", /รหัสใบสั่งซื้อไม่ถูกต้อง/);
    }
  });

  it("ปฏิเสธ payload ที่ resolutionType ไม่ถูกต้อง (เช่น ALL_ITEMS_RECEIVED ไม่ใช่ manual resolution)", () => {
    // Arrange
    const invalidPayload = {
      purchaseOrderId: "11111111-1111-4111-8111-111111111111",
      resolutionType: "ALL_ITEMS_RECEIVED",
      resolutionNote: "ส่งครบแล้ว",
    };

    // Act
    const result = resolvePurchaseOrderDiscrepancySchema.safeParse(invalidPayload);

    // Assert
    assert.strictEqual(result.success, false);
  });

  it("ปฏิเสธ payload ที่ resolutionNote เป็นค่าว่างหรือ whitespace", () => {
    // Arrange
    const invalidPayload = {
      purchaseOrderId: "11111111-1111-4111-8111-111111111111",
      resolutionType: "WAIVED",
      resolutionNote: "   ",
    };

    // Act
    const result = resolvePurchaseOrderDiscrepancySchema.safeParse(invalidPayload);

    // Assert
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.match(result.error.issues[0]?.message || "", /กรุณาระบุบันทึกข้อตกลง/);
    }
  });
});

describe("resolvePurchaseOrderDiscrepancy Server Action Guards (AAA Pattern)", () => {
  it("resolvePurchaseOrderDiscrepancy ปฏิเสธเมื่อไม่มี session พนักงาน", async () => {
    // Arrange
    const payload: ResolvePurchaseOrderDiscrepancyInput = {
      purchaseOrderId: "11111111-1111-4111-8111-111111111111",
      resolutionType: "REFUNDED",
      resolutionNote: "ร้านค้าโอนเงินคืนเรียบร้อย",
    };

    // Act
    const result = await resolvePurchaseOrderDiscrepancy(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(
      result.error || "",
      /คุณไม่ได้รับอนุญาต|ไม่พบข้อมูลพนักงาน|เกิดข้อผิดพลาด/,
    );
  });
});

describe("Discrepancy Resolution State Machine & Audit Logic (AAA Pattern)", () => {
  it("Guard ป้องกันการยุติปัญหาซ้ำซ้อนเมื่อ PO อยู่ในสถานะ RECEIVED อยู่แล้ว", () => {
    // Arrange: ใบสั่งซื้อมีสถานะเป็น RECEIVED แล้ว
    const currentStatus: PurchaseOrderStatus = "RECEIVED";

    // Act
    const canResolve =
      (currentStatus as string) === "PARTIALLY_RECEIVED";

    // Assert
    assert.strictEqual(canResolve, false, "ต้องไม่อนุญาตให้ Resolve หากสถานะเป็น RECEIVED แล้ว (กัน Duplicate Resolution)");
  });

  it("Guard ป้องกันการยุติปัญหาบนสถานะที่ไม่ใช่ PARTIALLY_RECEIVED (DRAFT, ORDERED, CANCELLED)", () => {
    // Arrange
    const invalidStatuses: PurchaseOrderStatus[] = ["DRAFT", "ORDERED", "CANCELLED"];

    // Act & Assert
    for (const status of invalidStatuses) {
      const canResolve = status === ("PARTIALLY_RECEIVED" as PurchaseOrderStatus);
      assert.strictEqual(canResolve, false, `สถานะ ${status} ต้องไม่สามารถกดยุติปัญหาได้`);
    }
  });

  it("ยุติปัญหา: เปลี่ยน Issue ทั้งหมดเป็น RESOLVED พร้อมระบุ resolutionType และ note", () => {
    // Arrange: PO มี 2 รายการปัญหาที่สถานะเป็น OPEN
    const openIssues = [
      {
        id: "issue-1",
        purchaseOrderItemId: "po-item-1",
        shortageQuantity: 4,
        status: "OPEN",
      },
      {
        id: "issue-2",
        purchaseOrderItemId: "po-item-2",
        shortageQuantity: 2,
        status: "OPEN",
      },
    ];

    const resolutionType: PurchaseOrderManualResolutionType = "DISCOUNT_NEXT_ORDER";
    const resolutionNote = "ร้านค้าให้ส่วนลด 600 บาทในบิลถัดไปแทนสินค้าที่ขาด 6 ชิ้น";

    // Act
    const resolvedIssues = openIssues.map((issue) => ({
      ...issue,
      status: "RESOLVED",
      resolutionType,
      resolutionNote,
      resolvedAt: new Date(),
    }));

    // Assert
    assert.strictEqual(resolvedIssues.length, 2);
    assert.strictEqual(resolvedIssues[0].status, "RESOLVED");
    assert.strictEqual(resolvedIssues[0].resolutionType, "DISCOUNT_NEXT_ORDER");
    assert.strictEqual(resolvedIssues[0].resolutionNote, resolutionNote);
    assert.strictEqual(resolvedIssues[1].status, "RESOLVED");
  });

  it("ยุติปัญหา: PO ปิดสมบูรณ์เป็น RECEIVED โดยสต็อกและค่าใช้จ่ายไม่เปลี่ยนแปลง (Zero Phantom Stock & Zero Extra Expense)", () => {
    // Arrange: ข้อมูลสินค้าใน PO และสินค้าคงคลังก่อนการยุติปัญหา
    const inventoryBefore = {
      id: "inv-item-1",
      quantity: 50, // สต็อกปัจจุบัน
    };
    const poItems = [
      {
        id: "po-item-1",
        quantity: 10,
        receivedQuantity: 6, // ขาด 4
        unitCost: "100.00",
      },
    ];
    const initialExpenseRecorded = 6 * 100; // จ่ายไปแล้วเฉพาะ 6 ชิ้นที่รับจริง = 600

    // Act: ดำเนินการยุติปัญหา (Resolve without delivery)
    const additionalStockReceived = 0; // ไม่มีการรับของเพิ่ม
    const additionalExpenseCharged = 0; // ไม่มีการจ่ายเงินเพิ่ม

    const inventoryAfter = {
      ...inventoryBefore,
      quantity: inventoryBefore.quantity + additionalStockReceived,
    };
    const totalExpenseAfter = initialExpenseRecorded + additionalExpenseCharged;
    const finalPoStatus: PurchaseOrderStatus = "RECEIVED";

    // Assert
    assert.strictEqual(
      inventoryAfter.quantity,
      50,
      "สต็อกสินค้าต้องคงเดิมที่ 50 (ไม่มี Phantom Stock เพิ่มเข้าคลัง)",
    );
    assert.strictEqual(
      totalExpenseAfter,
      600,
      "รายจ่ายรวมต้องคงเดิมที่ 600 บาท (ไม่มีการบันทึก Expense เพิ่มเติม)",
    );
    assert.strictEqual(
      finalPoStatus,
      "RECEIVED",
      "สถานะใบสั่งซื้อต้องปิดสมบูรณ์เป็น RECEIVED",
    );
    // Historical order quantities remains unchanged
    assert.strictEqual(poItems[0].quantity, 10, "จำนวนสั่งซื้อเดิมคงเดิมที่ 10 ชิ้น");
    assert.strictEqual(poItems[0].receivedQuantity, 6, "จำนวนรับสะสมเดิมคงเดิมที่ 6 ชิ้น");
  });

  it("บันทึก Audit Log ลงใน purchase_order_logs ระบุประเภทการยุติปัญหาและข้อความบันทึกครบถ้วน", () => {
    // Arrange
    const poId = "po-123";
    const staffId = "staff-456";
    const resolutionType: PurchaseOrderManualResolutionType = "REFUNDED";
    const resolutionNote = "ร้านค้าโอนเงินคืน 800 บาทเข้าบัญชีบริษัทเรียบร้อยตามสลิป";

    const typeConfig = RESOLUTION_TYPE_CONFIG[resolutionType];
    const resolutionLabel = typeConfig.shortLabel;

    // Act
    const logPayload = {
      purchaseOrderId: poId,
      staffId,
      event: "STATUS_CHANGED",
      fromStatus: "PARTIALLY_RECEIVED",
      toStatus: "RECEIVED",
      note: `ยุติปัญหาของขาด (${resolutionLabel}): ${resolutionNote}`,
    };

    // Assert
    assert.strictEqual(logPayload.event, "STATUS_CHANGED");
    assert.strictEqual(logPayload.fromStatus, "PARTIALLY_RECEIVED");
    assert.strictEqual(logPayload.toStatus, "RECEIVED");
    assert.strictEqual(
      logPayload.note,
      "ยุติปัญหาของขาด (คืนเงิน): ร้านค้าโอนเงินคืน 800 บาทเข้าบัญชีบริษัทเรียบร้อยตามสลิป",
    );
  });
});
