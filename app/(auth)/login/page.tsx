import type { Metadata } from "next";
import Link from "next/link";
import { login } from "../../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — SaveMe Budget" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">ยินดีต้อนรับกลับมา</h1>
      <p className="mb-6 mt-1 text-muted">เข้าสู่ระบบเพื่อดูรายจ่ายของคุณ</p>
      <AuthForm action={login} submitLabel="เข้าสู่ระบบ" />
      <p className="mt-6 text-center text-sm text-muted">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="font-semibold text-mint-600 hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </>
  );
}
