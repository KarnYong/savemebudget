"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createExpense } from "../actions";
import { inputClass } from "../(auth)/auth-form";
import { CATEGORIES } from "@/lib/validation";

export function ExpenseForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(createExpense, {});
  const v = state.values;

  return (
    <form key={state.stamp} action={formAction} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">รายละเอียด</span>
        <input
          name="description"
          required
          maxLength={200}
          placeholder="เช่น ข้าวมันไก่"
          defaultValue={v?.description}
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">จำนวนเงิน (บาท)</span>
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            required
            min="0.01"
            step="0.01"
            placeholder="0.00"
            defaultValue={v?.amount}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">วันที่</span>
          <input
            name="spentOn"
            type="date"
            required
            defaultValue={v?.spentOn ?? today}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">หมวดหมู่</span>
        <select name="category" required defaultValue={v?.category ?? "food"} className={inputClass}>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="animate-rise rounded-lg bg-mint-400/15 px-3 py-2 text-sm text-mint-600">
          บันทึกรายจ่ายแล้ว
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-mint-400 py-3 font-semibold text-navy-950 transition hover:bg-mint-300 disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก…" : "บันทึกรายจ่าย"}
      </button>
    </form>
  );
}

export function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`ลบรายการ “${label}” ใช่หรือไม่?`)) e.preventDefault();
      }}
      aria-label={`ลบ ${label}`}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
      </svg>
    </button>
  );
}
