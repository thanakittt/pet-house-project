export const MAX_SMALLINT = 32767;

export function validateInventoryNumbers(
  quantity: number,
  reorderLevel: number,
): { success: false; error: string } | null {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
    return {
      success: false,
      error: "จำนวนสินค้าต้องเป็นจำนวนเต็มที่ถูกต้อง",
    };
  }
  if (!Number.isFinite(reorderLevel) || !Number.isInteger(reorderLevel)) {
    return {
      success: false,
      error: "จุดสั่งซื้อต้องเป็นจำนวนเต็มที่ถูกต้อง",
    };
  }

  if (quantity < 0) {
    return {
      success: false,
      error: "จำนวนสินค้าไม่สามารถติดลบได้",
    };
  }

  if (quantity > MAX_SMALLINT) {
    return {
      success: false,
      error: `จำนวนสินค้าต้องไม่เกิน ${MAX_SMALLINT}`,
    };
  }

  if (reorderLevel < 0) {
    return {
      success: false,
      error: "จุดสั่งซื้อไม่สามารถติดลบได้",
    };
  }

  if (reorderLevel > MAX_SMALLINT) {
    return {
      success: false,
      error: `จุดสั่งซื้อต้องไม่เกิน ${MAX_SMALLINT}`,
    };
  }

  return null;
}
