-- ==============================================================================
-- 1. INSERT ข้อมูลตาราง services (บริการหลักและบริการเสริม)
-- ==============================================================================
INSERT INTO services (name, description, service_type, created_at, updated_at) VALUES
-- บริการหลัก
('อาบน้ำ', 'บริการอาบน้ำ (ราคาขึ้นอยู่กับขนาดและความยากง่าย)', 'MAIN', NOW(), NOW()),
('อาบน้ำตัดขน', 'รวมตัดเล็บ เช็ดหู ไถก้น/ท้อง/ใต้เท้า ตัดรอบเท้า บีบต่อมเหม็น (สุนัขมีถอนขนหูเพิ่ม)', 'MAIN', NOW(), NOW()),

-- บริการเสริม (Add-ons)
('แปรงฟัน', NULL, 'ADDON', NOW(), NOW()),
('ไถยกเท้า', 'สำหรับน้องหมา', 'ADDON', NOW(), NOW()),
('อาบหมักเชื้อรา', NULL, 'ADDON', NOW(), NOW()),
('หยอดยาเห็บหมัด', NULL, 'ADDON', NOW(), NOW()),
('ทำทรีทเม้นท์', NULL, 'ADDON', NOW(), NOW()),
('ตู้อบแมว', 'สำหรับแมวที่กลัวไดร์', 'ADDON', NOW(), NOW()),
('สางสังกะตัง', 'คิดราคาเพิ่มกรณีขนพันกันเป็นสังกะตัง', 'ADDON', NOW(), NOW());


-- ==============================================================================
-- 2. INSERT ข้อมูลตาราง service_variants (แยกตามหมา/แมว ขนาด และราคา)
-- ==============================================================================
INSERT INTO service_variants (service_id, pet_type, size, min_price, max_price, is_starting_price_only, duration_minutes, created_at, updated_at) VALUES

-- --------------------------------------------------------
-- หมวด: อาบน้ำ
-- --------------------------------------------------------
-- หมา (แยก 3 ไซส์)
((SELECT id FROM services WHERE name = 'อาบน้ำ' LIMIT 1), 'DOG', 'SMALL', 150.00, 200.00, false, 60, NOW(), NOW()),
((SELECT id FROM services WHERE name = 'อาบน้ำ' LIMIT 1), 'DOG', 'MEDIUM', 200.00, 400.00, false, 75, NOW(), NOW()),
((SELECT id FROM services WHERE name = 'อาบน้ำ' LIMIT 1), 'DOG', 'LARGE', 400.00, 800.00, false, 90, NOW(), NOW()),
-- แมว (ไม่แยกไซส์)
((SELECT id FROM services WHERE name = 'อาบน้ำ' LIMIT 1), 'CAT', 'ALL', 200.00, 300.00, false, 60, NOW(), NOW()),

-- --------------------------------------------------------
-- หมวด: อาบน้ำตัดขน
-- --------------------------------------------------------
-- หมา (ระบุแค่เริ่มต้น 350+) -> max_price ใส่เท่า min_price แล้วตั้ง is_starting = true
((SELECT id FROM services WHERE name = 'อาบน้ำตัดขน' LIMIT 1), 'DOG', 'ALL', 350.00, 0, true, 120, NOW(), NOW()),
-- แมว (ไม่แยกไซส์ แต่เป็นช่วงราคา 400-600)
((SELECT id FROM services WHERE name = 'อาบน้ำตัดขน' LIMIT 1), 'CAT', 'ALL', 400.00, 600.00, false, 120, NOW(), NOW()),

-- --------------------------------------------------------
-- หมวด: ค่าบริการเพิ่มเติม (Add-ons)
-- --------------------------------------------------------
-- 1. แปรงฟัน (หมา, แมว)
((SELECT id FROM services WHERE name = 'แปรงฟัน' LIMIT 1), 'DOG', 'ALL', 39.00, 39.00, false, 15, NOW(), NOW()),
((SELECT id FROM services WHERE name = 'แปรงฟัน' LIMIT 1), 'CAT', 'ALL', 39.00, 39.00, false, 15, NOW(), NOW()),

-- 2. ไถยกเท้า (เฉพาะหมา)
((SELECT id FROM services WHERE name = 'ไถยกเท้า' LIMIT 1), 'DOG', 'ALL', 50.00, 50.00, false, 15, NOW(), NOW()),

-- 3. อาบหมักเชื้อรา (หมา, แมว)
((SELECT id FROM services WHERE name = 'อาบหมักเชื้อรา' LIMIT 1), 'DOG', 'ALL', 100.00, 100.00, false, 20, NOW(), NOW()),
((SELECT id FROM services WHERE name = 'อาบหมักเชื้อรา' LIMIT 1), 'CAT', 'ALL', 100.00, 100.00, false, 20, NOW(), NOW()),

-- 4. หยอดยาเห็บหมัด (หมา, แมว)
((SELECT id FROM services WHERE name = 'หยอดยาเห็บหมัด' LIMIT 1), 'DOG', 'ALL', 100.00, 100.00, false, 10, NOW(), NOW()),
((SELECT id FROM services WHERE name = 'หยอดยาเห็บหมัด' LIMIT 1), 'CAT', 'ALL', 100.00, 100.00, false, 10, NOW(), NOW()),

-- 5. ทำทรีทเม้นท์ (หมา, แมว)
((SELECT id FROM services WHERE name = 'ทำทรีทเม้นท์' LIMIT 1), 'DOG', 'ALL', 100.00, 100.00, false, 20, NOW(), NOW()),
((SELECT id FROM services WHERE name = 'ทำทรีทเม้นท์' LIMIT 1), 'CAT', 'ALL', 100.00, 100.00, false, 20, NOW(), NOW()),

-- 6. ตู้อบแมว (เฉพาะแมว)
((SELECT id FROM services WHERE name = 'ตู้อบแมว' LIMIT 1), 'CAT', 'ALL', 100.00, 100.00, false, 30, NOW(), NOW()),

-- 7. สางสังกะตัง (เฉพาะแมว ตามป้าย)
((SELECT id FROM services WHERE name = 'สางสังกะตัง' LIMIT 1), 'CAT', 'ALL', 100.00, 100.00, false, 30, NOW(), NOW());