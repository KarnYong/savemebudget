// Integration test against the real DATABASE_URL (run via `npm test`).
// Creates throwaway users with unique emails and removes only those users afterwards.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import * as db from "../lib/db.ts";
import { todayInBangkok } from "../lib/format.ts";

const run = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const emailA = `test-a-${run}@example.test`;
const emailB = `test-b-${run}@example.test`;
const today = todayInBangkok();

after(async () => {
  await db.pool.query("DELETE FROM users WHERE email = ANY($1)", [[emailA, emailB]]);
  await db.pool.end();
});

test("sign up, log in, add/delete expenses, monthly total, user isolation", async () => {
  // Sign up
  const a = await db.createUser(emailA, "password-a");
  const b = await db.createUser(emailB, "password-b");
  assert.ok(a && b);
  assert.equal(await db.createUser(emailA, "another-pass"), null, "duplicate email rejected");

  // Log in
  assert.equal(await db.authenticate(emailA, "password-a"), a);
  assert.equal(await db.authenticate(emailA, "wrong-password"), null);
  assert.equal(await db.authenticate("nobody@example.test", "password-a"), null);

  // Sessions: token resolves to the user; stored value is a hash, not the token
  const token = await db.createSession(a);
  assert.equal((await db.findSessionUser(token))?.email, emailA);
  const { rowCount } = await db.pool.query("SELECT 1 FROM sessions WHERE token_hash = $1", [token]);
  assert.equal(rowCount, 0, "raw token is never stored");

  // Add expenses (0.1 + 0.2 checks exact numeric summing)
  await db.addExpense(a, { description: "ข้าว", amount: "0.10", category: "food", spentOn: today });
  await db.addExpense(a, { description: "น้ำ", amount: "0.20", category: "food", spentOn: today });
  await db.addExpense(a, { description: "BTS", amount: "47.00", category: "transport", spentOn: today });
  await db.addExpense(a, { description: "ปีที่แล้ว", amount: "999.00", category: "other", spentOn: "2020-01-15" });
  await db.addExpense(b, { description: "ของ B", amount: "500.00", category: "shopping", spentOn: today });

  let summary = await db.monthSummary(a);
  assert.equal(summary.total, "47.30", "only this month's expenses, exact sum");
  assert.deepEqual(summary.byCategory.map((c) => [c.category, c.total]), [["transport", "47.00"], ["food", "0.30"]]);

  const recentA = await db.recentExpenses(a);
  assert.equal(recentA.length, 4);
  assert.ok(recentA.every((e) => e.description !== "ของ B"), "A never sees B's expenses");
  assert.equal(recentA.at(-1).spentOn, "2020-01-15", "newest first, dates as plain strings");

  // Isolation: B cannot delete A's expense, and A cannot delete B's
  const aExpense = recentA.find((e) => e.description === "BTS");
  assert.equal(await db.deleteExpense(b, Number(aExpense.id)), false);
  const [bExpense] = await db.recentExpenses(b);
  assert.equal(await db.deleteExpense(a, Number(bExpense.id)), false);
  assert.equal((await db.recentExpenses(b)).length, 1);

  // Owner can delete; total updates
  assert.equal(await db.deleteExpense(a, Number(aExpense.id)), true);
  summary = await db.monthSummary(a);
  assert.equal(summary.total, "0.30");

  // Recent list is capped at 10
  for (let i = 0; i < 12; i++) {
    await db.addExpense(b, { description: `b${i}`, amount: "1.00", category: "other", spentOn: today });
  }
  assert.equal((await db.recentExpenses(b)).length, 10);

  // Logout revokes the session
  await db.deleteSession(token);
  assert.equal(await db.findSessionUser(token), null);
});
