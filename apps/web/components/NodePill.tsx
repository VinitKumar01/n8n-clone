export default function NodePill({ label }: { label: string }) {
  return (
    <div className="bg-neutral-50 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[#2e2e2e] text-neutral-500 dark:text-[#777] rounded-xl px-3.5 py-2 font-[var(--font-mono)] text-[11px] tracking-[0.05em] whitespace-nowrap">
      {label}
    </div>
  );
}
