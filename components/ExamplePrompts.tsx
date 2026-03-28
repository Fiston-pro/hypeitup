"use client";

const EXAMPLES = [
  "I got my driving license",
  "I went to the gym 3 days in a row",
  "I replied to all my emails",
  "I bought a standing desk",
];

type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
};

export function ExamplePrompts({ onPick, disabled }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Try an example</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={disabled}
            onClick={() => onPick(ex)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-white/80 transition hover:border-[#f5c842]/40 hover:text-white disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
