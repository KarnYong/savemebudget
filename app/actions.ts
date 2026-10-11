"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { addExpense, authenticate, createUser, deleteExpense } from "@/lib/db";
import { endSession, requireUser, startSession } from "@/lib/session";
import { credentialsSchema, expenseIdSchema, expenseSchema, firstError } from "@/lib/validation";

export type FormState = {
  error?: string;
  ok?: boolean;
  values?: Record<string, string>;
  /** Changes on every submission so the client form can remount with fresh defaults. */
  stamp?: number;
};

const formValues = (fd: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse(formValues(fd, ["email", "password"]));
  const values = { email: String(fd.get("email") ?? "") };
  if (!parsed.success) return { error: firstError(parsed.error), values, stamp: Date.now() };

  const userId = await createUser(parsed.data.email, parsed.data.password);
  if (!userId) return { error: "อีเมลนี้ถูกใช้สมัครแล้ว", values, stamp: Date.now() };

  await startSession(userId);
  redirect("/dashboard");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse(formValues(fd, ["email", "password"]));
  const values = { email: String(fd.get("email") ?? "") };
  const userId = parsed.success ? await authenticate(parsed.data.email, parsed.data.password) : null;
  if (!userId) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", values, stamp: Date.now() };

  await startSession(userId);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function createExpense(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(fd, ["description", "amount", "category", "spentOn"]);
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) return { error: firstError(parsed.error), values, stamp: Date.now() };

  await addExpense(user.id, parsed.data);
  refresh();
  return { ok: true, stamp: Date.now() };
}

export async function removeExpense(fd: FormData) {
  const user = await requireUser();
  const id = expenseIdSchema.safeParse(fd.get("id"));
  if (!id.success) return;
  await deleteExpense(user.id, id.data);
  refresh();
}
