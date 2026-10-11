import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "../../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "สมัครสมาชิก — SaveMe Budget" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">สร้างบัญชีใหม่</h1>
      <p className="mb-6 mt-1 text-muted">เริ่มติดตามรายจ่ายได้ฟรีภายในหนึ่งนาที</p>
      <AuthForm action={signup} submitLabel="สมัครสมาชิก" isSignup />
      <p className="mt-6 text-center text-sm text-muted">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-semibold text-mint-600 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </>
  );
}
