import assert from "node:assert/strict";
import test from "node:test";
import { chunkArray } from "./messaging";

test("chunkArray splits array into chunks of specified size", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];
  const chunks = chunkArray(items, 3);

  assert.deepEqual(chunks, [
    [1, 2, 3],
    [4, 5, 6],
    [7],
  ]);
});

test("chunkArray handles array smaller than chunk size", () => {
  const items = ["a", "b"];
  const chunks = chunkArray(items, 500);

  assert.deepEqual(chunks, [["a", "b"]]);
});

test("chunkArray handles empty array", () => {
  const items: string[] = [];
  const chunks = chunkArray(items, 500);

  assert.deepEqual(chunks, []);
});

test("chunkArray splits 1050 items into chunks of 500", () => {
  const items = Array.from({ length: 1050 }, (_, index) => `U${index}`);
  const chunks = chunkArray(items, 500);

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 500);
  assert.equal(chunks[1].length, 500);
  assert.equal(chunks[2].length, 50);
});

test("multicastLineTextMessage chunks 550 recipients into 2 requests", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  process.env.LINE_CHANNEL_ACCESS_TOKEN = "dummy-token";

  const fetchCalls: { url: string; body: string }[] = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({
      url: input.toString(),
      body: init?.body?.toString() ?? "",
    });
    return new Response(JSON.stringify({}), { status: 200 });
  };

  try {
    const { multicastLineTextMessage } = await import("./messaging");
    const recipients = Array.from({ length: 550 }, (_, i) => `user_${i}`);
    await multicastLineTextMessage(recipients, "Hello Multicast");

    assert.equal(fetchCalls.length, 2);
    assert.equal(fetchCalls[0].url, "https://api.line.me/v2/bot/message/multicast");
    const parsed1 = JSON.parse(fetchCalls[0].body);
    const parsed2 = JSON.parse(fetchCalls[1].body);

    assert.equal(parsed1.to.length, 500);
    assert.equal(parsed1.messages[0].text, "Hello Multicast");
    assert.equal(parsed2.to.length, 50);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = originalEnv;
    } else {
      delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    }
  }
});

