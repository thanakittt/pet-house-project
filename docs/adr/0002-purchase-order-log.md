# Purchase Order Log — Immutable DB Audit Trail

เราต้องการ audit trail สำหรับ PO เพื่อให้รู้ว่าใครทำอะไรกับ PO ใบไหนและเมื่อไหร่ เราเลือกเก็บ log ใน DB table ใหม่ (\purchase_order_logs\) แทนที่จะใช้ console/stdout หรือ external service เพราะต้องการดูประวัติย้อนหลังบน UI ได้โดยไม่ต้องพึ่งเครื่องมือภายนอก

## Considered Options

- **Console/stdout** — ง่ายแต่หายเมื่อ restart ดูย้อนหลังไม่ได้
- **External service (Axiom, Datadog)** — ดีสำหรับ scale ใหญ่ แต่เกินความจำเป็นและเพิ่ม dependency
- **DB table ใหม่** ✅ — ใช้ Supabase + Drizzle ที่มีอยู่แล้ว ค้นหาได้ แสดงบน UI ได้

## Consequences

- Log เป็น **immutable**: ไม่มี \updatedAt\ / \deletedAt\ — ห้ามแก้ไขหรือลบหลัง insert
- บันทึก **เฉพาะเมื่อ action สำเร็จ** (success only) — error ไม่ถูกบันทึกลง log table
- PO ที่ถูก soft-delete จะมี \DELETED\ log อยู่ใน DB แต่ไม่สามารถดูผ่าน UI ได้ (หน้า detail → 404)
- PO ที่มีอยู่ก่อน deploy feature นี้จะไม่มี log (ไม่ backfill)
- note ใน log สร้างโดยระบบอัตโนมัติ ไม่ต้องให้ user กรอก

