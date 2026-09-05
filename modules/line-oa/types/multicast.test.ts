import assert from "node:assert/strict";
import test from "node:test";
import {
  addItemsToSet,
  removeItemsFromSet,
  sanitizeMulticastUserIds,
  toggleItemInSet,
  validateMulticastInput,
} from "./multicast";


test("sanitizeMulticastUserIds deduplicates and strips empty/falsy values", () => {
  const ids = ["U1", " U2 ", "U1", "", null, undefined, "U3", " "];
  const result = sanitizeMulticastUserIds(ids);

  assert.deepEqual(result, ["U1", "U2", "U3"]);
});

test("validateMulticastInput detects empty text", () => {
  const result = validateMulticastInput({
    text: "   ",
    targetUserIds: ["U1"],
  });

  assert.equal(result.isValid, false);
  assert.equal(result.error, "กรุณากรอกข้อความที่ต้องการส่ง");
});

test("validateMulticastInput detects message exceeding 5,000 characters", () => {
  const longText = "a".repeat(5001);
  const result = validateMulticastInput({
    text: longText,
    targetUserIds: ["U1"],
  });

  assert.equal(result.isValid, false);
  assert.equal(result.error, "ข้อความต้องไม่เกิน 5,000 ตัวอักษร");
});

test("validateMulticastInput detects zero valid recipients", () => {
  const result = validateMulticastInput({
    text: "Hello",
    targetUserIds: ["", "   ", null, undefined],
  });

  assert.equal(result.isValid, false);
  assert.equal(
    result.error,
    "กรุณาเลือกลูกค้าอย่างน้อย 1 คนสำหรับส่งข้อความ Multicast",
  );
});

test("validateMulticastInput succeeds with valid text and recipients", () => {
  const result = validateMulticastInput({
    text: "สวัสดีทุกท่าน",
    targetUserIds: ["U1", "U2", "U1"],
  });

  assert.equal(result.isValid, true);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.sanitizedUserIds, ["U1", "U2"]);
});

test("toggleItemInSet adds item if missing and removes if present", () => {
  const initial = new Set(["a", "b"]);
  const added = toggleItemInSet(initial, "c");
  assert.equal(added.has("c"), true);
  assert.equal(added.size, 3);

  const removed = toggleItemInSet(added, "b");
  assert.equal(removed.has("b"), false);
  assert.equal(removed.size, 2);
});

test("addItemsToSet adds multiple items without mutating original", () => {
  const initial = new Set(["a"]);
  const next = addItemsToSet(initial, ["b", "c", "a"]);

  assert.equal(initial.size, 1);
  assert.equal(next.size, 3);
  assert.equal(next.has("b"), true);
  assert.equal(next.has("c"), true);
});

test("removeItemsFromSet removes items without mutating original", () => {
  const initial = new Set(["a", "b", "c"]);
  const next = removeItemsFromSet(initial, ["b", "c"]);

  assert.equal(initial.size, 3);
  assert.equal(next.size, 1);
  assert.equal(next.has("a"), true);
});

