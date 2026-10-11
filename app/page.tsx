import Link from "next/link";
import { CardStack } from "./card-stack";
import { Logo } from "./logo";

const FEATURES = [
  { title: "บันทึกรายจ่ายในไม่กี่วินาที", text: "กรอกรายละเอียด จำนวนเงิน หมวดหมู่ และวันที่ ก็เรียบร้อย" },
  { title: "เห็นยอดใช้จ่ายทั้งเดือน", text: "สรุปยอดรวมเดือนนี้ตามเวลาประเทศไทยแบบอัปเดตทันที" },
  { title: "รู้ว่าเงินไปไหน", text: "แยกยอดตามหมวดหมู่ ช่วยวางแผนการออมได้ง่ายขึ้น" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-navy-950 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo dark />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-lg px-4 py-2 text-white/80 hover:text-white">
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-mint-400 px-4 py-2 font-semibold text-navy-950 hover:bg-mint-300"
          >
            สมัครฟรี
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <section className="animate-rise">
          <p className="mb-4 inline-block rounded-full border border-mint-400/30 bg-mint-400/10 px-3 py-1 text-sm text-mint-300">
            ผู้ช่วยจัดการรายจ่ายส่วนตัว
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            จัดการเงินง่ายขึ้น
            <br />
            <span className="text-mint-400">เหลือเงินเก็บมากขึ้น</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/70">
            SaveMe Budget ช่วยให้คุณติดตามทุกการใช้จ่าย เห็นภาพรวมรายเดือน และรู้ว่าควรประหยัดตรงไหน
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-mint-400 px-6 py-3 font-semibold text-navy-950 shadow-lg shadow-mint-500/20 hover:bg-mint-300"
            >
              เริ่มต้นใช้งาน
            </Link>
            <Link href="/login" className="rounded-xl border border-white/20 px-6 py-3 hover:bg-white/5">
              มีบัญชีแล้ว
            </Link>
          </div>
        </section>
        <div className="flex justify-center py-8">
          <CardStack />
        </div>
      </main>

      <section className="bg-canvas text-ink">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-3 h-1.5 w-10 rounded-full bg-mint-400" />
              <h2 className="font-semibold text-navy-900">{f.title}</h2>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
