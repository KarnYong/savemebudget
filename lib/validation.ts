import { z } from "zod";

export const CATEGORIES = {
  food: "อาหารและเครื่องดื่ม",
  transport: "การเดินทาง",
  shopping: "ช้อปปิ้ง",
  bills: "บิลและสาธารณูปโภค",
  housing: "ที่พักอาศัย",
  health: "สุขภาพ",
  entertainment: "บันเทิง",
  education: "การศึกษา",
  other: "อื่น ๆ",
} as const;

export type Category = keyof typeof CATEGORIES;
const CATEGORY_KEYS = Object.keys(CATEGORIES) as [Category, ...Category[]];

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง").max(254, "อีเมลยาวเกินไป")),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(128, "รหัสผ่านยาวเกินไป"),
});

export const expenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรายละเอียด")
    .max(200, "รายละเอียดยาวเกิน 200 ตัวอักษร"),
  // Kept as a string end to end so money never passes through a float.
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "จำนวนเงินไม่ถูกต้อง (ทศนิยมไม่เกิน 2 ตำแหน่ง)")
    .refine((v) => Number(v) > 0, "จำนวนเงินต้องมากกว่า 0"),
  category: z.enum(CATEGORY_KEYS, "กรุณาเลือกหมวดหมู่"),
  spentOn: z.iso
    .date("วันที่ไม่ถูกต้อง")
    // Reject impossible dates like 2026-02-30 that pass the regex.
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
    }, "วันที่ไม่ถูกต้อง"),
});

export const expenseIdSchema = z.coerce.number().int().positive();

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}
