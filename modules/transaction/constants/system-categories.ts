export const SYSTEM_CATEGORIES = [
  "รายรับมัดจำการนัดหมาย",
  "รายรับจากการให้บริการ",
  "ค่าสั่งซื้อสินค้าคลัง",
];

export const isSystemCategory = (categoryName: string) => {
  return SYSTEM_CATEGORIES.includes(categoryName);
};
