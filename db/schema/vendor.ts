import * as p from "drizzle-orm/pg-core";
import { timestamps } from "./column.helper";

// ตาราง vendors: เก็บข้อมูลผู้จำหน่าย / คู่ค้าสำหรับสั่งซื้อสินค้าเข้าสต็อก
export const vendors = p
  .pgTable(
    "vendors",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      name: p.text("name").notNull(),
      contactName: p.text("contact_name"),
      phone: p.text("phone"),
      email: p.text("email"),
      address: p.text("address"),
      taxId: p.text("tax_id"),
      isActive: p.boolean("is_active").default(true).notNull(),
      ...timestamps,
    },
    (table) => [
      p.index("vendors_name_idx").on(table.name),
      p.index("vendors_is_active_idx").on(table.isActive),
    ],
  )
  .enableRLS();
