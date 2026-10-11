import { CardStack } from "../card-stack";
import { Logo } from "../logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-navy-950 p-10 text-white lg:flex">
        <Logo dark />
        <div className="flex justify-center">
          <CardStack />
        </div>
        <p className="text-2xl font-semibold leading-snug">
          จัดการเงินง่ายขึ้น
          <br />
          <span className="text-mint-400">เหลือเงินเก็บมากขึ้น</span>
        </p>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-sm animate-rise">{children}</div>
      </main>
    </div>
  );
}
