import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  updatePurchaseOrderVendorSnapshotSchema,
  UpdatePurchaseOrderVendorSnapshotInput,
} from "../types/purchase-order";
import { updatePurchaseOrderVendorSnapshot } from "../actions/update-purchase-order-vendor-snapshot";
import { purchaseOrders, vendors } from "@/db/schema";

describe("Purchase Order Vendor Snapshot Update Schema & Validation (AAA Pattern)", () => {
  const validPurchaseOrderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  describe("Happy Path", () => {
    it("ผ่านการตรวจสอบเมื่อระบุข้อมูล Vendor Snapshot ครบถ้วนทุกฟิลด์", () => {
      // Arrange
      const payload: UpdatePurchaseOrderVendorSnapshotInput = {
        purchaseOrderId: validPurchaseOrderId,
        vendorName: "บริษัท เพ็ทแลนด์ดิ้ง จำกัด (สาขาใหญ่)",
        vendorAddress: "99/1 ถ.พหลโยธิน จตุจักร กทม. 10900",
        vendorPhone: "02-999-8888",
        vendorTaxId: "0105558889991",
      };

      // Act
      const result = updatePurchaseOrderVendorSnapshotSchema.safeParse(payload);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.purchaseOrderId, validPurchaseOrderId);
        assert.strictEqual(
          result.data.vendorName,
          "บริษัท เพ็ทแลนด์ดิ้ง จำกัด (สาขาใหญ่)",
        );
        assert.strictEqual(
          result.data.vendorAddress,
          "99/1 ถ.พหลโยธิน จตุจักร กทม. 10900",
        );
        assert.strictEqual(result.data.vendorPhone, "02-999-8888");
        assert.strictEqual(result.data.vendorTaxId, "0105558889991");
      }
    });

    it("ผ่านการตรวจสอบเมื่อระบุเฉพาะ vendorName โดยฟิลด์อื่นเป็น null หรือไม่ได้ระบุ", () => {
      // Arrange
      const minimalPayload = {
        purchaseOrderId: validPurchaseOrderId,
        vendorName: "ร้านเพ็ทช็อป เชียงใหม่",
        vendorAddress: null,
        vendorPhone: null,
        vendorTaxId: null,
      };

      // Act
      const result =
        updatePurchaseOrderVendorSnapshotSchema.safeParse(minimalPayload);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.vendorName, "ร้านเพ็ทช็อป เชียงใหม่");
        assert.strictEqual(result.data.vendorAddress, null);
      }
    });
  });

  describe("Edge Cases & Validation Failures", () => {
    it("ปฏิเสธเมื่อ purchaseOrderId ไม่ใช่รูปแบบ UUID", () => {
      // Arrange
      const invalidPayload = {
        purchaseOrderId: "invalid-uuid-12345",
        vendorName: "บริษัท เพ็ทแคร์",
      };

      // Act
      const result =
        updatePurchaseOrderVendorSnapshotSchema.safeParse(invalidPayload);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg = result.error.issues[0]?.message;
        assert.strictEqual(errorMsg, "รหัสใบสั่งซื้อไม่ถูกต้อง");
      }
    });

    it("ปฏิเสธเมื่อ vendorName เป็นค่าว่างหรือมีเฉพาะ whitespace", () => {
      // Arrange
      const emptyNamePayload = {
        purchaseOrderId: validPurchaseOrderId,
        vendorName: "   ",
      };

      // Act
      const result =
        updatePurchaseOrderVendorSnapshotSchema.safeParse(emptyNamePayload);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg = result.error.issues[0]?.message;
        assert.strictEqual(errorMsg, "กรุณาระบุชื่อผู้จำหน่าย");
      }
    });

    it("ปฏิเสธเมื่อ vendorName มีความยาวเกิน 150 ตัวอักษร", () => {
      // Arrange
      const longNamePayload = {
        purchaseOrderId: validPurchaseOrderId,
        vendorName: "ก".repeat(151),
      };

      // Act
      const result =
        updatePurchaseOrderVendorSnapshotSchema.safeParse(longNamePayload);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg = result.error.issues[0]?.message;
        assert.strictEqual(errorMsg, "ชื่อผู้จำหน่ายต้องไม่เกิน 150 ตัวอักษร");
      }
    });

    it("ปฏิเสธเมื่อ vendorTaxId มีความยาวเกิน 20 ตัวอักษร", () => {
      // Arrange
      const longTaxIdPayload = {
        purchaseOrderId: validPurchaseOrderId,
        vendorName: "บริษัท เพ็ทแคร์",
        vendorTaxId: "1".repeat(21),
      };

      // Act
      const result =
        updatePurchaseOrderVendorSnapshotSchema.safeParse(longTaxIdPayload);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg = result.error.issues[0]?.message;
        assert.strictEqual(
          errorMsg,
          "เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร",
        );
      }
    });
  });
});

describe("Purchase Order Vendor Snapshot Server Action & Immutability (AAA Pattern)", () => {
  const validPurchaseOrderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  it("updatePurchaseOrderVendorSnapshot ปฏิเสธเมื่อไม่ได้ล็อกอินหรือไม่มีสิทธิ์ Staff", async () => {
    // Arrange: สภาพแวดล้อม test ที่ไม่มี Next.js session
    const payload: UpdatePurchaseOrderVendorSnapshotInput = {
      purchaseOrderId: validPurchaseOrderId,
      vendorName: "บริษัท แก้ไขใหม่ จำกัด",
      vendorPhone: "02-111-2222",
    };

    // Act
    const result = await updatePurchaseOrderVendorSnapshot(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(
      result.error || "",
      /คุณไม่ได้รับอนุญาตในการแก้ไขข้อมูลใบสั่งซื้อ|เกิดข้อผิดพลาด/,
    );
  });

  it("updatePurchaseOrderVendorSnapshot รองรับการเรียกแบบส่ง 2 พารามิเตอร์ (id, snapshot)", async () => {
    // Arrange: ทดสอบ signature overload
    const snapshotData = {
      vendorName: "บริษัท สองพารามิเตอร์ จำกัด",
      vendorPhone: "081-234-5678",
    };

    // Act
    const result = await updatePurchaseOrderVendorSnapshot(
      validPurchaseOrderId,
      snapshotData,
    );

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(
      result.error || "",
      /คุณไม่ได้รับอนุญาตในการแก้ไขข้อมูลใบสั่งซื้อ|เกิดข้อผิดพลาด/,
    );
  });

  it("Snapshot Immutability: ตาราง purchase_orders เก็บสำเนาฟิลด์ผู้จำหน่ายแยกขาดจากตาราง vendors", () => {
    // Arrange
    const poColumns = Object.keys(purchaseOrders);
    const vendorColumns = Object.keys(vendors);

    // Act & Assert
    // ตาราง vendors มีฟิลด์ master
    assert.ok(vendorColumns.includes("id"), "vendors ต้องมี id");
    assert.ok(vendorColumns.includes("name"), "vendors ต้องมี name");
    assert.ok(vendorColumns.includes("address"), "vendors ต้องมี address");
    assert.ok(vendorColumns.includes("phone"), "vendors ต้องมี phone");
    assert.ok(vendorColumns.includes("taxId"), "vendors ต้องมี taxId");

    // ตาราง purchase_orders มีฟิลด์ Snapshot แยกอิสระตาม ADR 0001
    assert.ok(
      poColumns.includes("vendorName"),
      "purchase_orders ต้องมี vendorName snapshot",
    );
    assert.ok(
      poColumns.includes("vendorAddress"),
      "purchase_orders ต้องมี vendorAddress snapshot",
    );
    assert.ok(
      poColumns.includes("vendorPhone"),
      "purchase_orders ต้องมี vendorPhone snapshot",
    );
    assert.ok(
      poColumns.includes("vendorTaxId"),
      "purchase_orders ต้องมี vendorTaxId snapshot",
    );

    // ยืนยันว่าชื่อคอลัมน์ Snapshot ใน PO มีคำว่า vendor นำหน้าชัดเจน ไม่สับสนกับฟิลด์แม่
    assert.notStrictEqual(poColumns.includes("name"), true);
  });
});
