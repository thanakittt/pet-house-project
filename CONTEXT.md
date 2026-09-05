# Pet House

ระบบบริหารจัดการร้านเพ็ทช็อป บริการอาบน้ำ-ตัดขน โรงแรมสัตว์เลี้ยง และสินค้าสัตว์เลี้ยง

## Language

### LINE OA Messaging

**Broadcast Message**:
ข้อความที่ส่งหาผู้ติดตาม (Friends) ทั้งหมดของ LINE Official Account พร้อมกันโดยไม่ระบุรายบุคคล
_Avoid_: Bulk message, Blast, ส่งข้อความรวม

**Multicast Message**:
ข้อความที่ส่งเจาะจงไปยังรายชื่อลูกค้าที่เลือก (`line_user_id`) สูงสุดครั้งละ 500 คนต่อชุดคำสั่งของ LINE API
_Avoid_: Private message, Direct message, ยิงเดี่ยว

**Line Connected Customer**:
ลูกค้าที่มีข้อมูลบัญชี LINE ผูกไว้กับระบบ (`line_user_id IS NOT NULL`)
_Avoid_: LINE member, LINE user, ลูกค้าสมาชิก LINE
