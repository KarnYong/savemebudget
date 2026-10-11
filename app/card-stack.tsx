// Purely decorative: no real card data is shown or collected.
const CARDS = [
  { label: "SaveMe", number: "•••• •••• •••• 2048" },
  { label: "Savings", number: "•••• •••• •••• 7531" },
  { label: "SaveMe Budget", number: "•••• •••• •••• 4821" },
];

export function CardStack() {
  return (
    <div className="card-stack" aria-hidden="true">
      {CARDS.map((c) => (
        <div key={c.label} className="cc">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold tracking-wide opacity-90">{c.label}</span>
            <span className="flex">
              <span className="size-7 rounded-full bg-white/35" />
              <span className="-ml-3 size-7 rounded-full bg-mint-300/60" />
            </span>
          </div>
          <div className="cc-chip" />
          <div className="flex items-end justify-between text-white/85">
            <span className="font-mono text-sm tracking-widest sm:text-base">{c.number}</span>
            <span className="text-xs">12/30</span>
          </div>
        </div>
      ))}
    </div>
  );
}
