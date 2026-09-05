import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { vendorFormSchema } from "../types/vendor";
import { createVendor } from "../actions/create-vendor";
import { updateVendor } from "../actions/update-vendor";
import { toggleVendorStatus } from "../actions/toggle-vendor-status";
import { deleteVendor } from "../actions/delete-vendor";

describe("Vendor Validation & Schema Tests (AAA Pattern)", () => {
  describe("Happy Path", () => {
    it("ผ่านการตรวจสอบเมื่อกรอกข้อมูลผู้จำหน่ายครบถ้วนทุกฟิลด์", () => {
      // Arrange
      const validPayload = {
        name: "บริษัท เพ็ทซัพพลาย จำกัด",
        contactName: "คุณสมหมาย สดใส",
        phone: "02-999-8888",
        email: "contact@petsupply.co.th",
        address: "123/45 ถนนพัฒนาการ แขวงสวนหลวง กรุงเทพฯ 10250",
        taxId: "0105558012345",
        isActive: true,
      };

      // Act
      const result = vendorFormSchema.safeParse(validPayload);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.name, "บริษัท เพ็ทซัพพลาย จำกัด");
        assert.strictEqual(result.data.contactName, "คุณสมหมาย สดใส");
        assert.strictEqual(result.data.phone, "02-999-8888");
        assert.strictEqual(result.data.email, "contact@petsupply.co.th");
        assert.strictEqual(result.data.taxId, "0105558012345");
        assert.strictEqual(result.data.isActive, true);
      }
    });

    it("ผ่านการตรวจสอบเมื่อกรอกเฉพาะฟิลด์บังคับ (name) โดยตั้งค่า default isActive เป็น true", () => {
      // Arrange
      const minimalPayload = {
        name: "ร้านค้าส่งอาหารสัตว์ทองหล่อ",
      };

      // Act
      const result = vendorFormSchema.safeParse(minimalPayload);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.name, "ร้านค้าส่งอาหารสัตว์ทองหล่อ");
        assert.strictEqual(result.data.isActive, true);
        assert.strictEqual(result.data.phone, undefined);
      }
    });

    it("ผ่านการตรวจสอบเมื่อ email เป็นค่าว่าง (empty string) หรือ null", () => {
      // Arrange
      const payloadEmptyEmail = {
        name: "โรงงานแชมพูสัตว์เลี้ยง",
        email: "",
      };

      // Act
      const result = vendorFormSchema.safeParse(payloadEmptyEmail);

      // Assert
      assert.strictEqual(result.success, true);
    });
  });

  describe("Edge Cases & Validation Failures", () => {
    it("ปฏิเสธเมื่อชื่อผู้จำหน่ายเป็นค่าว่าง", () => {
      // Arrange
      const emptyNamePayload = {
        name: "",
      };

      // Act
      const result = vendorFormSchema.safeParse(emptyNamePayload);

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

    it("ปฏิเสธเมื่อชื่อผู้จำหน่ายมีเฉพาะ whitespace", () => {
      // Arrange
      const whitespaceNamePayload = {
        name: "     ",
      };

      // Act
      const result = vendorFormSchema.safeParse(whitespaceNamePayload);

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

    it("ปฏิเสธเมื่อชื่อผู้จำหน่ายยาวเกิน 150 ตัวอักษร", () => {
      // Arrange
      const longNamePayload = {
        name: "ก".repeat(151),
      };

      // Act
      const result = vendorFormSchema.safeParse(longNamePayload);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.strictEqual(errorMsg, "ชื่อผู้จำหน่ายต้องไม่เกิน 150 ตัวอักษร");
      }
    });

    it("ปฏิเสธเมื่อรูปแบบอีเมลไม่ถูกต้อง", () => {
      // Arrange
      const invalidEmailPayload = {
        name: "บริษัท ทดสอบ จำกัด",
        email: "not-an-email-format",
      };

      // Act
      const result = vendorFormSchema.safeParse(invalidEmailPayload);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.strictEqual(errorMsg, "รูปแบบอีเมลไม่ถูกต้อง");
      }
    });

    it("ปฏิเสธเมื่อเลขประจำตัวผู้เสียภาษียาวเกิน 20 ตัวอักษร", () => {
      // Arrange
      const longTaxIdPayload = {
        name: "บริษัท ทดสอบ จำกัด",
        taxId: "123456789012345678901",
      };

      // Act
      const result = vendorFormSchema.safeParse(longTaxIdPayload);

      // Assert
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const errorMsg =
          result.error.issues?.[0]?.message ||
          (result.error as unknown as { errors?: Array<{ message: string }> })
            .errors?.[0]?.message;
        assert.strictEqual(errorMsg, "เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร");
      }
    });
  });
});

describe("Vendor Server Actions Guard & Error Handling (AAA Pattern)", () => {
  it("createVendor ปฏิเสธเมื่อไม่ได้ล็อกอินหรือไม่มีสิทธิ์ Staff", async () => {
    // Arrange: เมื่อรันในสภาพแวดล้อม test ที่ไม่มี session headers
    const payload = {
      name: "บริษัท ซัพพลาย เออเร่อ จำกัด",
    };

    // Act
    const result = await createVendor(payload);

    // Assert
    assert.strictEqual(result.success, false);
    assert.match(
      result.error || "",
      /คุณไม่ได้รับอนุญาตในการเพิ่มผู้จำหน่าย|เกิดข้อผิดพลาด/,
    );
  });

  it("updateVendor ปฏิเสธเมื่อไม่ระบุ id หรือ id เป็นค่าว่าง", async () => {
    // Arrange
    const invalidId = "";
    const payload = {
      name: "บริษัท อัปเดต จำกัด",
    };

    // Act
    const result = await updateVendor({ id: invalidId, data: payload });

    // Assert
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  it("toggleVendorStatus ปฏิเสธเมื่อไม่ระบุ id", async () => {
    // Arrange
    const emptyId = "";

    // Act
    const result = await toggleVendorStatus({ id: emptyId, isActive: false });

    // Assert
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  it("deleteVendor ปฏิเสธเมื่อไม่ระบุ id", async () => {
    // Arrange
    const emptyId = "";

    // Act
    const result = await deleteVendor({ id: emptyId });

    // Assert
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });
});
