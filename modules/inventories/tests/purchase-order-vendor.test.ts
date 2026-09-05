import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  purchaseOrderFormSchema,
  PurchaseOrderForm,
} from "../types/purchase-order";
import { createPurchaseOrder } from "../actions/create-purchase-order";
import { purchaseOrders } from "@/db/schema/inventory";

describe("Purchase Order Vendor & Snapshot Schema Validation (AAA Pattern)", () => {
  const validVendorId = "11111111-1111-4111-8111-111111111111";
  const validInventoryItemId = "22222222-2222-4222-8222-222222222222";

  describe("Happy Path", () => {
    it("ผ่านการตรวจสอบเมื่อกรอกข้อมูลใบสั่งซื้อและ Vendor Snapshot ครบถ้วนทุกฟิลด์", () => {
      // Arrange
      const validPayload: PurchaseOrderForm = {
        orderDate: "2026-09-05",
        vendorId: validVendorId,
        vendorName: "บริษัท เพ็ทแลนด์ดิ้ง จำกัด",
        vendorAddress: "888/99 ถนนสุขุมวิท พระโขนง กรุงเทพฯ 10110",
        vendorPhone: "02-777-8899",
        vendorTaxId: "0105559098765",
        items: [
          {
            inventoryItemId: validInventoryItemId,
            inventoryItemName: "แชมพูสูตรอ่อนโยนสำหรับสุนัข",
            quantity: 10,
            unitCost: 150,
          },
        ],
      };

      // Act
      const result = purchaseOrderFormSchema.safeParse(validPayload);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.orderDate, "2026-09-05");
        assert.strictEqual(result.data.vendorId, validVendorId);
        assert.strictEqual(result.data.vendorName, "บริษัท เพ็ทแลนด์ดิ้ง จำกัด");
        assert.strictEqual(result.data.vendorPhone, "02-777-8899");
        assert.strictEqual(result.data.vendorTaxId, "0105559098765");
        assert.strictEqual(result.data.items.length, 1);
        assert.strictEqual(result.data.items[0].quantity, 10);
      }
    });

    it("ผ่านการตรวจสอบเมื่อระบุเฉพาะฟิลด์บังคับของผู้จำหน่าย (vendorId, vendorName)", () => {
      // Arrange
      const minimalPayload = {
        orderDate: "2026-09-05",
        vendorId: validVendorId,
        vendorName: "ร้านค้าส่งอาหารสัตว์ทองหล่อ",
        items: [
          {
            inventoryItemId: validInventoryItemId,
            inventoryItemName: "อาหารเม็ดสำเร็จรูป",
            quantity: 5,
            unitCost: 500,
          },
        ],
      };

      // Act
      const result = purchaseOrderFormSchema.safeParse(minimalPayload);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.vendorName, "ร้านค้าส่งอาหารสัตว์ทองหล่อ");
        assert.strictEqual(result.data.vendorAddress, undefined);
        assert.strictEqual(result.data.vendorPhone, undefined);
        assert.strictEqual(result.data.vendorTaxId, undefined);
      }
    });
  });

  describe("Edge Cases & Validation Failures", () => {
    it("ปฏิเสธเมื่อไม่ได้เลือกผู้จำหน่าย (vendorId ว่าง)", () => {
      // Arrange
      const payloadWithoutVendor = {
        orderDate: "2026-09-05",
        vendorId: "",
        vendorName: "บริษัท ผู้จำหน่าย",
        items: [
          {
            inventoryItemId: validInventoryItemId,
            inventoryItemName: "สินค้าทดสอบ",
            quantity: 1,
            unitCost: 100,
          },
        ],
      };

      // Act
      const result = purchaseOrderFormSchema.safeParse(payloadWithoutVendor);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.match(errorMsg || "", /กรุณาเลือกผู้จำหน่าย|รหัสผู้จำหน่าย/);
      }
    });

    it("ปฏิเสธเมื่อ vendorId ไม่ใช่รูปแบบ UUID ที่ถูกต้อง", () => {
      // Arrange
      const payloadWithInvalidUuid = {
        orderDate: "2026-09-05",
        vendorId: "invalid-uuid-12345",
        vendorName: "บริษัท ผู้จำหน่าย",
        items: [
          {
            inventoryItemId: validInventoryItemId,
            inventoryItemName: "สินค้าทดสอบ",
            quantity: 1,
            unitCost: 100,
          },
        ],
      };

      // Act
      const result = purchaseOrderFormSchema.safeParse(payloadWithInvalidUuid);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.strictEqual(errorMsg, "รหัสผู้จำหน่ายไม่ถูกต้อง");
      }
    });

    it("ปฏิเสธเมื่อ vendorName เป็นค่าว่างหรือมีเฉพาะ whitespace", () => {
      // Arrange
      const payloadWithBlankVendorName = {
        orderDate: "2026-09-05",
        vendorId: validVendorId,
        vendorName: "   ",
        items: [
          {
            inventoryItemId: validInventoryItemId,
            inventoryItemName: "สินค้าทดสอบ",
            quantity: 1,
            unitCost: 100,
          },
        ],
      };

      // Act
      const result = purchaseOrderFormSchema.safeParse(payloadWithBlankVendorName);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.strictEqual(errorMsg, "กรุณาระบุชื่อผู้จำหน่าย");
      }
    });

    it("ปฏิเสธเมื่อ items ไม่มีรายการสินค้าเลย (empty array)", () => {
      // Arrange
      const payloadWithoutItems = {
        orderDate: "2026-09-05",
        vendorId: validVendorId,
        vendorName: "บริษัท ซัพพลาย จำกัด",
        items: [],
      };

      // Act
      const result = purchaseOrderFormSchema.safeParse(payloadWithoutItems);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.strictEqual(errorMsg, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      }
    });

    it("ปฏิเสธเมื่อ quantity สินค้าน้อยกว่าหรือเท่ากับ 0", () => {
      // Arrange
      const payloadWithZeroQty = {
        orderDate: "2026-09-05",
        vendorId: validVendorId,
        vendorName: "บริษัท ซัพพลาย จำกัด",
        items: [
          {
            inventoryItemId: validInventoryItemId,
            inventoryItemName: "สินค้า",
            quantity: 0,
            unitCost: 100,
          },
        ],
      };

      // Act
      const result = purchaseOrderFormSchema.safeParse(payloadWithZeroQty);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.strictEqual(errorMsg, "จำนวนสินค้าต้องมากกว่า 0");
      }
    });
  });
});

describe("Purchase Order Server Action Guards & Snapshot Schema Integrity (AAA Pattern)", () => {
  it("createPurchaseOrder ปฏิเสธเมื่อไม่ได้ล็อกอินหรือไม่มีสิทธิ์ Staff", async () => {
    // Arrange: สภาพแวดล้อม test ที่ไม่มี Next.js request headers
    const validVendorId = "11111111-1111-4111-8111-111111111111";
    const payload: PurchaseOrderForm = {
      orderDate: "2026-09-05",
      vendorId: validVendorId,
      vendorName: "บริษัท ซัพพลาย จำกัด",
      items: [
        {
          inventoryItemId: "22222222-2222-4222-8222-222222222222",
          inventoryItemName: "สินค้าทดสอบ",
          quantity: 2,
          unitCost: 50,
        },
      ],
    };

    // Act
    const result = await createPurchaseOrder(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(
      result.error || "",
      /คุณไม่ได้รับอนุญาตในการสร้างใบสั่งซื้อ|เกิดข้อผิดพลาด/,
    );
  });

  it("ตาราง purchase_orders มีคอลัมน์ vendorId และ Snapshot แยกอิสระตาม ADR 0001", () => {
    // Arrange: ตรวจสอบคอลัมน์ใน Drizzle table schema
    const columns = Object.keys(purchaseOrders);

    // Act & Assert
    assert.ok(columns.includes("vendorId"), "ต้องมีคอลัมน์ vendorId");
    assert.ok(columns.includes("vendorName"), "ต้องมีคอลัมน์ vendorName");
    assert.ok(columns.includes("vendorAddress"), "ต้องมีคอลัมน์ vendorAddress");
    assert.ok(columns.includes("vendorPhone"), "ต้องมีคอลัมน์ vendorPhone");
    assert.ok(columns.includes("vendorTaxId"), "ต้องมีคอลัมน์ vendorTaxId");
  });
});
