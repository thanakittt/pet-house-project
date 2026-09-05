import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { thaiBahtText } from "./baht-text";

describe("thaiBahtText", () => {
  it("แปลงเลข 0 เป็นศูนย์บาทถ้วน", () => {
    assert.strictEqual(thaiBahtText(0), "(ศูนย์บาทถ้วน)");
  });

  it("แปลงเลข 10 และ 11 ให้ลงท้ายด้วยสิบและเอ็ดอย่างถูกต้อง", () => {
    assert.strictEqual(thaiBahtText(10), "(สิบบาทถ้วน)");
    assert.strictEqual(thaiBahtText(11), "(สิบเอ็ดบาทถ้วน)");
  });

  it("แปลงเลข 20, 21, 25 ให้ใช้ยี่สิบ", () => {
    assert.strictEqual(thaiBahtText(20), "(ยี่สิบบาทถ้วน)");
    assert.strictEqual(thaiBahtText(21), "(ยี่สิบเอ็ดบาทถ้วน)");
    assert.strictEqual(thaiBahtText(25), "(ยี่สิบห้าบาทถ้วน)");
  });

  it("แปลงหลักร้อย พัน หมื่น แสน ได้ถูกต้อง", () => {
    assert.strictEqual(thaiBahtText(101), "(หนึ่งร้อยเอ็ดบาทถ้วน)");
    assert.strictEqual(thaiBahtText(550), "(ห้าร้อยห้าสิบบาทถ้วน)");
    assert.strictEqual(thaiBahtText(14500), "(หนึ่งหมื่นสี่พันห้าร้อยบาทถ้วน)");
    assert.strictEqual(thaiBahtText(100000), "(หนึ่งแสนบาทถ้วน)");
  });

  it("แปลงจำนวนเงินพร้อมทศนิยมสตางค์ได้ถูกต้อง", () => {
    assert.strictEqual(
      thaiBahtText(8788.8),
      "(แปดพันเจ็ดร้อยแปดสิบแปดบาทแปดสิบสตางค์)"
    );
    assert.strictEqual(
      thaiBahtText(14500.5),
      "(หนึ่งหมื่นสี่พันห้าร้อยบาทห้าสิบสตางค์)"
    );
    assert.strictEqual(thaiBahtText(0.25), "(ยี่สิบห้าสตางค์)");
  });

  it("แปลงหลักล้านได้ถูกต้อง", () => {
    assert.strictEqual(thaiBahtText(1000000), "(หนึ่งล้านบาทถ้วน)");
    assert.strictEqual(thaiBahtText(1250000), "(หนึ่งล้านสองแสนห้าหมื่นบาทถ้วน)");
  });
});
