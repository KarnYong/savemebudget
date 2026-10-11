// End-to-end smoke test through the real UI forms, acting as a no-JavaScript browser.
// Usage: node scripts/smoke.mjs [baseUrl]   (default http://127.0.0.1:3000)
// Creates two throwaway accounts (smoke-*@example.test).
import assert from "node:assert/strict";

const BASE = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const run = Date.now().toString(36);

const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

class Browser {
  cookies = new Map();

  async request(path, init = {}) {
    const res = await fetch(BASE + path, {
      ...init,
      redirect: "manual",
      headers: { ...init.headers, cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") },
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [k, v] = pair.split("=");
      if (!v || /max-age=0|expires=thu, 01 jan 1970/i.test(c)) this.cookies.delete(k);
      else this.cookies.set(k, v);
    }
    return res;
  }

  async get(path) {
    const res = await this.request(path);
    if (res.status >= 300 && res.status < 400) return this.get(new URL(res.headers.get("location"), BASE).pathname);
    return { path, html: await res.text() };
  }

  /** Submits the form on `path` whose HTML contains `marker`, the way a no-JS browser would. */
  async submit(path, marker, fields, page) {
    page ??= await this.get(path);
    const form = [...page.html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]).find((f) => f.includes(marker));
    assert.ok(form, `form with ${marker} on ${path}`);
    const body = new FormData();
    for (const [tag] of form.matchAll(/<input[^>]*>/g)) {
      if (attr(tag, "type") === "hidden" && attr(tag, "name")) body.append(attr(tag, "name"), decode(attr(tag, "value") ?? ""));
    }
    for (const [k, v] of Object.entries(fields)) body.set(k, v);
    const res = await this.request(page.path, { method: "POST", body, headers: { origin: BASE } });
    if (res.status >= 300 && res.status < 400) return this.get(new URL(res.headers.get("location"), BASE).pathname);
    return { path: page.path, html: await res.text() };
  }
}

const totalOf = (html) => html.match(/data-testid="month-total"[^>]*>([^<]+)</)?.[1];
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const step = (msg) => console.log(`✔ ${msg}`);

const a = new Browser();
const emailA = `smoke-a-${run}@example.test`;

let page = await a.get("/dashboard");
assert.equal(page.path, "/login");
step("unauthenticated /dashboard redirects to /login");

page = await a.submit("/signup", 'name="email"', { email: emailA, password: "short" });
assert.equal(page.path, "/signup");
step("server rejects a too-short password");

page = await a.submit("/signup", 'name="email"', { email: emailA, password: "smoke-pass-a" });
assert.equal(page.path, "/dashboard");
assert.ok(page.html.includes(emailA));
assert.equal(totalOf(page.html), "฿0.00");
step("sign up lands on dashboard with ฿0.00 total");

page = await a.submit("/dashboard", 'name="description"', { description: "ข้าวมันไก่ smoke", amount: "120.50", category: "food", spentOn: today });
page = await a.submit("/dashboard", 'name="description"', { description: "BTS smoke", amount: "79.50", category: "transport", spentOn: today });
page = await a.submit("/dashboard", 'name="description"', { description: "เก่า smoke", amount: "1000", category: "other", spentOn: "2020-01-01" });
page = await a.get("/dashboard");
assert.equal(totalOf(page.html), "฿200.00");
assert.ok(page.html.includes("ข้าวมันไก่ smoke") && page.html.includes("เก่า smoke"));
step("add expenses; monthly total = ฿200.00 (old-month expense excluded)");

const before = (await a.get("/dashboard")).html;
page = await a.submit("/dashboard", 'name="description"', { description: "x", amount: "-5", category: "food", spentOn: today });
assert.ok(page.html.includes("จำนวนเงินไม่ถูกต้อง"));
assert.equal(totalOf((await a.get("/dashboard")).html), totalOf(before));
step("server rejects an invalid amount");

page = await a.submit("/dashboard", "ออกจากระบบ", {});
assert.equal(page.path, "/login");
assert.equal((await a.get("/dashboard")).path, "/login");
step("logout clears the session");

page = await a.submit("/login", 'name="email"', { email: emailA, password: "wrong-password" });
assert.ok(page.html.includes("อีเมลหรือรหัสผ่านไม่ถูกต้อง"));
page = await a.submit("/login", 'name="email"', { email: emailA.toUpperCase(), password: "smoke-pass-a" });
assert.equal(page.path, "/dashboard");
step("login rejects a wrong password, accepts the correct one (case-insensitive email)");

// Find A's "BTS smoke" delete form (hidden id input lives next to it).
const aPage = await a.get("/dashboard");
const btsItem = aPage.html.match(/BTS smoke[\s\S]*?<input type="hidden" name="id" value="(\d+)"/);
assert.ok(btsItem);
const btsId = btsItem[1];

const b = new Browser();
page = await b.submit("/signup", 'name="email"', { email: `smoke-b-${run}@example.test`, password: "smoke-pass-b" });
assert.equal(page.path, "/dashboard");
assert.ok(!/ข้าวมันไก่ smoke|BTS smoke|เก่า smoke/.test(page.html), "B sees none of A's expenses");
assert.equal(totalOf(page.html), "฿0.00");
// B replays A's delete form (same action, A's expense id) with B's own session.
await b.submit("/dashboard", `value="${btsId}"`, {}, aPage);
assert.equal(totalOf((await a.get("/dashboard")).html), "฿200.00");
step("user B cannot see or delete user A's expenses");

page = await a.submit("/dashboard", `value="${btsId}"`, {}, aPage);
page = await a.get("/dashboard");
assert.equal(totalOf(page.html), "฿120.50");
assert.ok(!page.html.includes("BTS smoke"));
step("owner deletes an expense; total drops to ฿120.50");

console.log(`\nAll smoke checks passed against ${BASE}`);
