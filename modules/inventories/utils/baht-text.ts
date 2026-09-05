/**
 * ฟังก์ชันแปลงจำนวนเงินตัวเลขเป็นข้อความภาษาไทย (Thai Baht Text)
 * ตัวอย่าง:
 * - 0 -> "ศูนย์บาทถ้วน"
 * - 14500 -> "หนึ่งหมื่นสี่พันห้าร้อยบาทถ้วน"
 * - 8788.80 -> "แปดพันเจ็ดร้อยแปดสิบแปดบาทแปดสิบสตางค์"
 * - 21.01 -> "ยี่สิบเอ็ดบาทหนึ่งสตางค์"
 */

const THAI_NUMBERS = [
  "ศูนย์",
  "หนึ่ง",
  "สอง",
  "สาม",
  "สี่",
  "ห้า",
  "หก",
  "เจ็ด",
  "แปด",
  "เก้า",
];

const THAI_DIGIT_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

/**
 * แปลงกลุ่มตัวเลข (ไม่เกิน 6 หลัก / ไม่เกินหลักแสน)
 */
function convertGroupOfSix(numberString: string): string {
  let result = "";
  const len = numberString.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numberString[i], 10);
    const place = len - 1 - i;

    if (digit === 0) continue;

    if (place === 1 && digit === 1) {
      // หลักสิบที่เป็นเลข 1 เช่น "10" -> "สิบ" (ไม่ต้องมี "หนึ่งสิบ")
      result += "สิบ";
    } else if (place === 1 && digit === 2) {
      // หลักสิบที่เป็นเลข 2 เช่น "20" -> "ยี่สิบ"
      result += "ยี่สิบ";
    } else if (place === 0 && digit === 1 && len > 1) {
      // หลักหน่วยที่เป็นเลข 1 ในจำนวนที่มากกว่า 1 เช่น "11" -> "สิบเอ็ด", "101" -> "หนึ่งร้อยเอ็ด"
      result += "เอ็ด";
    } else {
      result += THAI_NUMBERS[digit] + THAI_DIGIT_PLACES[place];
    }
  }

  return result;
}

/**
 * แปลงจำนวนเต็มภาษาไทย (รองรับเกินหลักล้าน)
 */
function convertIntegerPart(intStr: string): string {
  if (parseInt(intStr, 10) === 0) return "ศูนย์";

  let result = "";
  let remaining = intStr;

  // วนลูปทีละ 6 หลักสำหรับจัดการหลัก "ล้าน"
  while (remaining.length > 6) {
    const group = remaining.slice(-6);
    const text = convertGroupOfSix(group);
    result = (text ? text : "") + result;
    remaining = remaining.slice(0, -6);
    result = "ล้าน" + result;
  }

  if (remaining.length > 0) {
    result = convertGroupOfSix(remaining) + result;
  }

  return result;
}

/**
 * ฟังก์ชันหลัก: แปลงตัวเลขเป็นข้อความบาทถ้วน / บาทสตางค์
 */
export function thaiBahtText(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "(ศูนย์บาทถ้วน)";
  }

  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  if (rounded === 0) {
    return "(ศูนย์บาทถ้วน)";
  }

  const parts = rounded.toFixed(2).split(".");
  const intPart = parts[0];
  const decimalPart = parts[1];

  let result = "";

  const intNum = parseInt(intPart, 10);
  if (intNum > 0) {
    result += convertIntegerPart(intPart) + "บาท";
  }

  const decNum = parseInt(decimalPart, 10);
  if (decNum === 0) {
    result += "ถ้วน";
  } else {
    // ถ้าไม่มีบาท แต่มีสตางค์
    if (intNum === 0) {
      result += convertGroupOfSix(decNum.toString()) + "สตางค์";
    } else {
      result += convertGroupOfSix(decimalPart) + "สตางค์";
    }
  }

  return `(${result})`;
}
