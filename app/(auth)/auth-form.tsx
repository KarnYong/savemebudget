"use client";

import { useActionState } from "react";
import type { FormState } from "../actions";

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none transition focus:border-mint-500 focus:ring-4 focus:ring-mint-400/20";

export function AuthForm({
  action,
  submitLabel,
  isSignup = false,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  submitLabel: string;
  isSignup?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form key={state.stamp} action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">อีเมล</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">รหัสผ่าน</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete={isSignup ? "new-password" : "current-password"}
          className={inputClass}
        />
        {isSignup && <span className="mt-1 block text-xs text-muted">อย่างน้อย 8 ตัวอักษร</span>}
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-navy-900 py-3 font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60"
      >
        {pending ? "กำลังดำเนินการ…" : submitLabel}
      </button>
    </form>
  );
}
