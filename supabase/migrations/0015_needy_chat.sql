ALTER TABLE "customers" ADD COLUMN "line_user_id" text;--> statement-breakpoint
-- เพิ่ม unique constraint หลังคอลัมน์ถูกสร้างแล้ว (ย้ายมาจาก 0014)
ALTER TABLE "customers" ADD CONSTRAINT "customers_line_user_id_unique" UNIQUE("line_user_id");
