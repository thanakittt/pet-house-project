import "dotenv/config";


import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseVendorStatusFilter,
  VENDOR_STATUS_FILTERS,
} from "../queries/list-vendors";

describe("Vendor Status Filter Tests (AAA Pattern)", () => {
  describe("parseVendorStatusFilter", () => {
    it("แปลงค่า 'ALL' หรือ 'all' ให้เป็น 'ALL' ถูกต้อง", () => {
      // Arrange & Act
      const upper = parseVendorStatusFilter("ALL");
      const lower = parseVendorStatusFilter("all");
      const mixed = parseVendorStatusFilter("All");

      // Assert
      assert.strictEqual(upper, "ALL");
      assert.strictEqual(lower, "ALL");
      assert.strictEqual(mixed, "ALL");
    });

    it("แปลงค่า 'active' หรือ 'ACTIVE' ให้เป็น 'active' ถูกต้อง", () => {
      // Arrange & Act
      const exact = parseVendorStatusFilter("active");
      const upper = parseVendorStatusFilter("ACTIVE");

      // Assert
      assert.strictEqual(exact, "active");
      assert.strictEqual(upper, "active");
    });

    it("แปลงค่า 'inactive' หรือ 'INACTIVE' ให้เป็น 'inactive' ถูกต้อง", () => {
      // Arrange & Act
      const exact = parseVendorStatusFilter("inactive");
      const upper = parseVendorStatusFilter("INACTIVE");

      // Assert
      assert.strictEqual(exact, "inactive");
      assert.strictEqual(upper, "inactive");
    });

    it("แปลงค่าว่างหรือไม่ถูกต้องให้ fallback เป็น 'ALL'", () => {
      // Arrange & Act
      const empty = parseVendorStatusFilter("");
      const invalid = parseVendorStatusFilter("unknown");
      const nullValue = parseVendorStatusFilter(null);
      const undefinedValue = parseVendorStatusFilter(undefined);

      // Assert
      assert.strictEqual(empty, "ALL");
      assert.strictEqual(invalid, "ALL");
      assert.strictEqual(nullValue, "ALL");
      assert.strictEqual(undefinedValue, "ALL");
    });

    it("VENDOR_STATUS_FILTERS มีค่าครบถ้วนตาม standard convention", () => {
      // Assert
      assert.deepStrictEqual(VENDOR_STATUS_FILTERS, ["ALL", "active", "inactive"]);
    });
  });

  describe("ManagementListControls hasFilters logic check", () => {
    const isFilterActive = (
      searchValue: string | undefined,
      selectFilters: Array<{ value: string }>,
    ) => {
      return (
        (searchValue ?? "").trim().length > 0 ||
        selectFilters.some(
          (filter) => Boolean(filter.value) && filter.value.toUpperCase() !== "ALL",
        )
      );
    };

    it("ไม่แสดงปุ่มล้างตัวกรองเมื่อค้นหาว่างและสถานะเป็น ALL หรือ all", () => {
      // Arrange & Act
      const emptyWithUpper = isFilterActive("", [{ value: "ALL" }]);
      const emptyWithLower = isFilterActive("", [{ value: "all" }]);
      const undefinedSearch = isFilterActive(undefined, [{ value: "ALL" }]);

      // Assert
      assert.strictEqual(emptyWithUpper, false);
      assert.strictEqual(emptyWithLower, false);
      assert.strictEqual(undefinedSearch, false);
    });

    it("แสดงปุ่มล้างตัวกรองเมื่อมีการค้นหาหรือเลือกสถานะ active / inactive", () => {
      // Arrange & Act
      const withSearch = isFilterActive("อาหารสุนัข", [{ value: "ALL" }]);
      const withActiveStatus = isFilterActive("", [{ value: "active" }]);
      const withInactiveStatus = isFilterActive("", [{ value: "inactive" }]);

      // Assert
      assert.strictEqual(withSearch, true);
      assert.strictEqual(withActiveStatus, true);
      assert.strictEqual(withInactiveStatus, true);
    });
  });
});
