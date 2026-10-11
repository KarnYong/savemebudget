import type { Metadata } from "next";
import { Suspense } from "react";
import { logout, removeExpense } from "../actions";
import { Logo } from "../logo";
import { monthSummary, recentExpenses } from "@/lib/db";
import { formatBaht, formatThaiDate, formatThaiMonth, todayInBangkok } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { CATEGORIES, type Category } from "@/lib/validation";
import { DeleteButton, ExpenseForm } from "./client";

export const metadata: Metadata = { title: "แดชบอร์ด — SaveMe Budget" };

const CATEGORY_COLORS: Record<Category, string> = {
  food: "bg-mint-500",
  transport: "bg-sky-500",
  shopping: "bg-violet-500",
  bills: "bg-amber-500",
  housing: "bg-navy-700",
  health: "bg-rose-500",
  entertainment: "bg-fuchsia-500",
  education: "bg-teal-600",
  other: "bg-slate-400",
};

const card = "rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const [summary, recent] = await Promise.all([monthSummary(user.id), recentExpenses(user.id)]);
  const total = Number(summary.total);
  const now = new Date();

  return (
    <div className="flex-1">
      <header className="bg-navy-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo dark />
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <span className="hidden truncate text-white/70 sm:inline">{user.email}</span>
            <form action={logout}>
              <button className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6">
          <section className="animate-rise" aria-labelledby="month-total">
            <p id="month-total" className="text-white/70">
              ยอดใช้จ่ายเดือน{formatThaiMonth(now)}
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-mint-400 sm:text-5xl" data-testid="month-total">
              {formatBaht(total)}
            </p>
          </section>
        </div>
      </header>

      <main className="mx-auto -mt-6 grid max-w-6xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className={`${card} animate-rise [animation-delay:60ms]`}>
            <h2 className="mb-4 text-lg font-semibold text-navy-900">เพิ่มรายจ่าย</h2>
            <ExpenseForm today={todayInBangkok(now)} />
          </section>

          <section className={`${card} animate-rise [animation-delay:120ms]`}>
            <h2 className="mb-4 text-lg font-semibold text-navy-900">แยกตามหมวดหมู่</h2>
            {summary.byCategory.length === 0 ? (
              <p className="text-sm text-muted">ยังไม่มีรายจ่ายในเดือนนี้</p>
            ) : (
              <ul className="space-y-3">
                {summary.byCategory.map((c) => {
                  const pct = total ? (Number(c.total) / total) * 100 : 0;
                  return (
                    <li key={c.category}>
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span>{CATEGORIES[c.category] ?? c.category}</span>
                        <span className="font-medium">
                          {formatBaht(c.total)} <span className="text-muted">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-canvas">
                        <div
                          className={`h-full origin-left animate-grow rounded-full ${CATEGORY_COLORS[c.category] ?? "bg-slate-400"}`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className={`${card} animate-rise [animation-delay:180ms] lg:col-span-3`}>
          <h2 className="mb-4 text-lg font-semibold text-navy-900">รายการล่าสุด</h2>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-muted">ยังไม่มีรายการ เริ่มบันทึกรายจ่ายแรกของคุณได้เลย</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((e, i) => (
                <li
                  key={e.id}
                  className="flex animate-rise items-center gap-3 py-3"
                  style={{ animationDelay: `${200 + i * 40}ms` }}
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${CATEGORY_COLORS[e.category] ?? "bg-slate-400"}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.description}</p>
                    <p className="text-xs text-muted">
                      {CATEGORIES[e.category] ?? e.category} · {formatThaiDate(e.spentOn)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-navy-900">{formatBaht(e.amount)}</span>
                  <form action={removeExpense}>
                    <input type="hidden" name="id" value={e.id} />
                    <DeleteButton label={e.description} />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-2xl bg-white/70 border border-line";
  return (
    <div className="flex-1" aria-busy="true" aria-label="กำลังโหลด">
      <div className="h-44 bg-navy-950" />
      <div className="mx-auto -mt-6 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-5">
        <div className={`${block} h-96 lg:col-span-2`} />
        <div className={`${block} h-96 lg:col-span-3`} />
      </div>
    </div>
  );
}
