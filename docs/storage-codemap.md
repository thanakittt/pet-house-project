# Supabase Storage Codemap

เอกสารนี้สรุปว่าโปรเจกต์เก็บรูปไว้ที่ไหน และ flow อัปโหลด/ลบทำงานอย่างไร เหมาะสำหรับอ่านก่อนแก้โค้ดเกี่ยวกับ Supabase Storage

## โครงสร้าง Path

Bucket หลักที่ใช้ตอนนี้คือ `images`

```txt
images/
  announcements/
    {announcementId}/
      {randomUUID}.{jpg|png|webp}

  appointments/
    {appointmentId}/
      deposit-slips/
        {randomUUID}.{jpg|png|gif|webp}

      pets/
        {petId}/
          service-images/
            before/
              {randomUUID}.{jpg|png|webp}
            after/
              {randomUUID}.{jpg|png|webp}
            issue/
              {randomUUID}.{jpg|png|webp}
```

## Flow: รูปก่อน/หลังบริการ

ไฟล์หลัก:

- `modules/operation/components/UploadImageDialog.tsx`
- `modules/operation/actions/upload-service-images.ts`
- `modules/operation/utils/service-image-storage.ts`
- `modules/operation/actions/delete-service-image.ts`

ลำดับการทำงาน:

1. `UploadImageDialog` รับไฟล์จากผู้ใช้และสร้าง preview ใน browser
2. เมื่อกดบันทึก component จะสร้าง `FormData`
3. `uploadServiceImages` รับ `FormData` ฝั่ง server
4. Server Action ตรวจ session, ids, ประเภทไฟล์, MIME type, และขนาดไฟล์
5. `uploadServiceImageToStorage` สร้าง `storageKey` ตาม appointment/pet/type
6. Supabase Storage คืน public URL
7. ระบบบันทึกทั้ง `imageUrl` และ `imageStorageKey` ลงตาราง `service_images`
8. เวลาลบ ระบบใช้ `imageStorageKey` ก่อน ถ้าแถวเก่ายังไม่มี key จะ fallback ไปแปลงจาก public URL

## ทำไมต้องเก็บ `imageStorageKey`

`imageUrl` เหมาะสำหรับแสดงรูปใน UI แต่ไม่เหมาะเป็น source of truth สำหรับลบไฟล์ เพราะต้อง parse URL กลับมาเป็น path

`imageStorageKey` คือ path ภายใน bucket โดยตรง เช่น:

```txt
appointments/{appointmentId}/pets/{petId}/service-images/before/{file}.jpg
```

เมื่อมี key นี้ การลบจะตรงไปตรงมาและปลอดภัยกว่า:

```ts
await supabase.storage.from("images").remove([imageStorageKey]);
```

## จุดที่ควรระวัง

- อย่าอัปโหลด service images เข้า root ของ bucket อีก
- อย่าเชื่อ MIME type จาก client อย่างเดียว ต้อง validate ใน Server Action เสมอ
- ถ้า upload สำเร็จแต่บันทึก database fail ต้องลบไฟล์ที่ upload ไปแล้วเพื่อกัน orphaned files
- migration `0018_add_service_image_storage_key.sql` จะพยายาม backfill `image_storage_key` จาก public URL ของ row เก่า
- ถ้าเปลี่ยน path ใหม่ ต้องคำนึงถึง row เก่าใน database ที่ยังไม่มี `image_storage_key` หรือ URL ไม่ตรง format มาตรฐาน
