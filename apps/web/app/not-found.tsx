"use client";

import DotGrid from "@/components/DotGrid";
import PrimaryButton from "@/components/PrimaryButton";
import GhostButton from "@/components/GhostButton";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#111111] text-neutral-900 dark:text-[#e8e8e8] font-[var(--font-mono)] overflow-hidden px-6 transition-colors duration-200">
      <DotGrid />

      <div className="relative z-10 max-w-xl w-full text-center flex flex-col items-center">
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 mb-12 w-full max-w-sm">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161616]/90 flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-neutral-600 dark:text-neutral-400">
                4
              </span>
            </div>
            <span className="text-[9px] mt-2 text-neutral-400 dark:text-[#555] uppercase tracking-wider font-bold">
              Start
            </span>
          </div>

          <div className="flex-1 h-[2px] bg-neutral-200 dark:bg-neutral-800" />

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161616]/90 flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-neutral-600 dark:text-neutral-400">
                0
              </span>
            </div>
            <span className="text-[9px] mt-2 text-neutral-400 dark:text-[#555] uppercase tracking-wider font-bold">
              Route
            </span>
          </div>

          <div className="flex-1 h-[2px] border-t border-dashed border-red-500/50 relative flex items-center justify-center">
            <div className="absolute -top-3 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/30 text-[8px] text-red-500 dark:text-red-400 uppercase tracking-widest font-bold">
              Lost
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-red-500/50 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-red-500">4</span>
            </div>
            <span className="text-[9px] mt-2 text-red-500 uppercase tracking-wider font-bold">
              Error
            </span>
          </div>
        </div>

        <h1 className="text-[clamp(32px,5vw,44px)] font-normal leading-none tracking-[-0.03em] text-neutral-900 dark:text-white mb-4">
          Oops! Page Not Found
        </h1>

        <p className="max-w-[420px] text-[13px] leading-[1.8] text-neutral-500 dark:text-[#888] mb-10">
          We couldn&apos;t find the page you are looking for. It might have been
          moved, deleted, or the link you followed is broken.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <PrimaryButton onClick={() => router.push("/workspace")}>
            go to workspace →
          </PrimaryButton>
          <GhostButton onClick={() => router.push("/")}>
            return home
          </GhostButton>
        </div>
      </div>
    </div>
  );
}
