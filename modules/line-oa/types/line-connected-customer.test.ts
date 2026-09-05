import assert from "node:assert/strict";
import test from "node:test";
import {
  filterLineConnectedCustomers,
  type LineConnectedCustomer,
} from "./line-connected-customer";

const SAMPLE_CUSTOMERS: LineConnectedCustomer[] = [
  {
    id: "cust-1",
    nickname: "สมชาย",
    userName: "Somchai Sukjai",
    contactPhoneNumber: "0812345678",
    lineUserId: "U11111111111111111111111111111111",
    petNames: ["ถุงเงิน", "มอมแมม"],
  },
  {
    id: "cust-2",
    nickname: "แอน",
    userName: "Anne Smith",
    contactPhoneNumber: "0899998888",
    lineUserId: "U22222222222222222222222222222222",
    petNames: ["ช็อคโก้"],
  },
  {
    id: "cust-3",
    nickname: "บอย",
    userName: null,
    contactPhoneNumber: "0851112233",
    lineUserId: "U33333333333333333333333333333333",
    petNames: [],
  },
];

test("filterLineConnectedCustomers returns all customers when query is empty or whitespace", () => {
  // Arrange & Act
  const emptyResult = filterLineConnectedCustomers(SAMPLE_CUSTOMERS, "");
  const whitespaceResult = filterLineConnectedCustomers(SAMPLE_CUSTOMERS, "   ");

  // Assert
  assert.equal(emptyResult.length, 3);
  assert.equal(whitespaceResult.length, 3);
});

test("filterLineConnectedCustomers filters by customer nickname", () => {
  // Arrange & Act
  const result = filterLineConnectedCustomers(SAMPLE_CUSTOMERS, "สมชาย");

  // Assert
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "cust-1");
});

test("filterLineConnectedCustomers filters by user account name (case-insensitive)", () => {
  // Arrange & Act
  const result = filterLineConnectedCustomers(SAMPLE_CUSTOMERS, "anne");

  // Assert
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "cust-2");
});

test("filterLineConnectedCustomers filters by phone number", () => {
  // Arrange & Act
  const result = filterLineConnectedCustomers(SAMPLE_CUSTOMERS, "085111");

  // Assert
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "cust-3");
});

test("filterLineConnectedCustomers filters by pet name", () => {
  // Arrange & Act
  const result = filterLineConnectedCustomers(SAMPLE_CUSTOMERS, "มอมแมม");

  // Assert
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "cust-1");
});

test("filterLineConnectedCustomers returns empty array when no matches found", () => {
  // Arrange & Act
  const result = filterLineConnectedCustomers(SAMPLE_CUSTOMERS, "ไม่พบข้อมูลนี้แน่นอน");

  // Assert
  assert.equal(result.length, 0);
});
