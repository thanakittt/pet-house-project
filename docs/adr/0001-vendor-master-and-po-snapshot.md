# 0001. Vendor Master Data and Purchase Order Snapshot

## Context
ระบบใบสั่งซื้อ (Purchase Order) เดิมใช้ local state ชั่วคราวในหน้าพิมพ์สำหรับระบุผู้จำหน่าย (Vendor) ทำให้ไม่มีการบันทึกลงฐานข้อมูลจริง เมื่อต้องการจัดเก็บลงฐานข้อมูล จึงเกิดคำถามทางสถาปัตยกรรมว่าควรเชื่อมโยงความสัมพันธ์แบบนอร์มัลไลซ์ (Foreign Key ตรง) หรือควรบันทึกข้อมูลแบบ Snapshot เพื่อให้สอดคล้องกับข้อกำหนดทางบัญชีและเอกสารย้อนหลัง

## Decision
1. **Master Table `vendors`**: สร้างตารางจัดการรายชื่อคู่ค้า (`id`, `name`, `contact_name`, `phone`, `email`, `address`, `tax_id`, `is_active`, `deleted_at`, `timestamps`)
2. **Back-office Route `/back-office/vendors`**: มีหน้าจัดการผู้จำหน่ายเต็มรูปแบบ (ค้นหา, เพิ่ม, แก้ไข, เปิด/ปิดสถานะ, soft-delete) เข้าถึงได้จากแถบเมนูด้านข้าง
3. **PO Foreign Key & Snapshot Columns**: ในตาราง `purchase_orders` เพิ่ม `vendor_id` (FK nullable) พร้อมแยกคอลัมน์ Snapshot: `vendor_name`, `vendor_address`, `vendor_phone`, `vendor_tax_id`
4. **PO Creation Flow**: หน้าสร้าง PO มี Dropdown ให้เลือกผู้จำหน่ายที่เปิดใช้งานอยู่ และ autofill ข้อมูลลงใน snapshot ของฟอร์ม
5. **Editable Snapshot in Print View**: หน้าพิมพ์ใบสั่งซื้อ (`PurchaseOrderPrintView`) รองรับการดูและแก้ไข snapshot เฉพาะใบสั่งซื้อนั้น พร้อมปุ่มกดบันทึกเพื่ออัปเดต snapshot ลงฐานข้อมูลจริง
6. **Deletion & Data Safety**: ใช้ Soft Delete ร่วมกับ flag `is_active` ป้องกันการลบข้อมูลผู้จำหน่ายที่เคยมีประวัติการสั่งซื้อในอดีต
