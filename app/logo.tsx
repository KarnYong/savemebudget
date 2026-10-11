import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-mint-400 text-navy-950">฿</span>
      <span className={dark ? "text-white" : "text-navy-900"}>
        SaveMe <span className="text-mint-500">Budget</span>
      </span>
    </Link>
  );
}
