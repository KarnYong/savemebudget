import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBaht, formatThaiDate, todayInBangkok } from "../lib/format.ts";
import { credentialsSchema, expenseSchema } from "../lib/validation.ts";

const valid = { description: "ข้าวมันไก่", amount: "55.50", category: "food", spentOn: "2026-10-11" };

test("expense: accepts a valid expense and trims description", () => {
  const r = expenseSchema.safeParse({ ...valid, description: "  ชาไข่มุก  " });
  assert.ok(r.success);
  assert.equal(r.data.description, "ชาไข่มุก");
});

test("expense: rejects bad amounts, categories, dates and empty description", () => {
  for (const bad of [
    { amount: "0" },
    { amount: "-5" },
    { amount: "1.234" },
    { amount: "abc" },
    { amount: "1e5" },
    { category: "crypto" },
    { spentOn: "2026-02-30" },
    { spentOn: "11/10/2026" },
    { description: "   " },
    { description: "x".repeat(201) },
  ]) {
    assert.equal(expenseSchema.safeParse({ ...valid, ...bad }).success, false, JSON.stringify(bad));
  }
});

test("credentials: normalises email and enforces password length", () => {
  const r = credentialsSchema.safeParse({ email: "  Foo@Example.COM ", password: "12345678" });
  assert.ok(r.success);
  assert.equal(r.data.email, "foo@example.com");
  assert.equal(credentialsSchema.safeParse({ email: "foo@example.com", password: "short" }).success, false);
  assert.equal(credentialsSchema.safeParse({ email: "not-an-email", password: "12345678" }).success, false);
});

test("format: baht, Thai date and Bangkok 'today'", () => {
  assert.match(formatBaht("1234.5"), /฿\s?1,234\.50/);
  assert.match(formatThaiDate("2026-10-11"), /11 ต\.ค\. 2569/);
  // 2026-10-10 18:30 UTC is already 2026-10-11 01:30 in Bangkok.
  assert.equal(todayInBangkok(new Date("2026-10-10T18:30:00Z")), "2026-10-11");
});
