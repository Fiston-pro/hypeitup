export function HypeLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#f5c842] bg-[#f5c842]/10 text-lg font-bold text-[#f5c842]"
        aria-hidden
      >
        H
      </span>
      <span className="font-heading text-xl font-bold tracking-tight text-white">
        Hype<span className="text-[#f5c842]">It</span>Up
      </span>
    </div>
  );
}
