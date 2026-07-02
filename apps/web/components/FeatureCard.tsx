export default function FeatureCard({
  tag,
  title,
  description,
}: {
  tag: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#fcfcfc] dark:bg-[#111111] hover:bg-neutral-100 dark:hover:bg-[#161616] p-8 transition-colors duration-200 cursor-default border border-neutral-100 dark:border-transparent">
      <div className="font-[var(--font-mono)] text-[10px] text-neutral-400 dark:text-[#3a3a3a] tracking-[0.1em] mb-4 uppercase">
        {tag}
      </div>
      <div className="font-[var(--font-display)] text-[20px] text-neutral-800 dark:text-[#ccc] mb-3 tracking-[-0.01em]">
        {title}
      </div>
      <div className="font-[var(--font-mono)] text-[12px] text-neutral-500 dark:text-[#555] leading-[1.8]">
        {description}
      </div>
    </div>
  );
}
