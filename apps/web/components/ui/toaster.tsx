"use client";

import React, { useState, useEffect, useRef } from "react";
import { useToastStore, Toast } from "@/hooks/useToastStore";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, removeToast } = useToastStore();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center max-w-sm w-full transition-all duration-300 pointer-events-auto",
        isHovered
          ? "max-h-[220px] overflow-y-auto custom-scrollbar p-2 bg-neutral-100/10 dark:bg-neutral-900/10 rounded-2xl border border-neutral-200/10 dark:border-neutral-800/20"
          : "h-16 pointer-events-none",
      )}
      style={{
        display: toasts.length === 0 ? "none" : "flex",
        pointerEvents: toasts.length === 0 ? "none" : "auto",
      }}
    >
      <div
        className={cn(
          "w-full flex flex-col items-center",
          isHovered ? "gap-2 py-1" : "relative h-full",
        )}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => {
            const dist = toasts.length - 1 - index;

            // In collapsed mode, hide older than 3
            if (!isHovered && dist >= 3) return null;

            return (
              <ToastItem
                key={toast.id}
                toast={toast}
                dist={dist}
                isExpanded={isHovered}
                onDismiss={() => removeToast(toast.id)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToastItem({
  toast,
  dist,
  isExpanded,
  onDismiss,
}: {
  toast: Toast;
  dist: number;
  isExpanded: boolean;
  onDismiss: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 3000;
  const isInfinite = duration === 0 || toast.type === "loading";

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Manage countdown timer
  useEffect(() => {
    if (isInfinite) {
      setProgress(100);
      return;
    }

    if (isExpanded) {
      // Pause/reset timer to 100% when expanded
      setProgress(100);
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      return;
    }

    // Start countdown animation
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);

      setProgress(remaining);

      if (elapsed < duration) {
        timerRef.current = requestAnimationFrame(animate);
      } else {
        onDismiss();
      }
    };

    timerRef.current = requestAnimationFrame(animate);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isExpanded, duration, isInfinite, onDismiss]);

  // Collapsed styles
  const yOffset = dist * -8; // offset each card upwards slightly
  const scale = 1 - dist * 0.04; // scale down older cards
  const opacity = dist === 0 ? 1 : dist === 1 ? 0.75 : 0.45;
  const zIndex = 100 - dist;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={
        isExpanded
          ? { opacity: 1, y: 0, scale: 1, zIndex: 1 }
          : { opacity, y: yOffset, scale, zIndex }
      }
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 30,
      }}
      style={{
        position: isExpanded ? "relative" : "absolute",
        bottom: isExpanded ? "auto" : 0,
      }}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto min-w-[280px] max-w-sm w-full transition-shadow duration-300 relative overflow-hidden select-none",
        toast.type === "success" &&
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
        toast.type === "error" &&
          "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400",
        toast.type === "info" &&
          "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
        toast.type === "loading" &&
          "bg-white/90 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200",
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="shrink-0">
          {toast.type === "success" && (
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
          )}
          {toast.type === "info" && (
            <Info className="h-4.5 w-4.5 text-blue-500" />
          )}
          {toast.type === "loading" && (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-neutral-500 dark:text-neutral-400" />
          )}
        </span>
        <p className="text-xs font-medium leading-relaxed line-clamp-2 break-words flex-1">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded-md hover:bg-neutral-500/10 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-all cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Timer Progress Bar */}
      {!isInfinite && (
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-current opacity-35"
          style={{
            width: `${progress}%`,
            transition: isExpanded ? "width 0.15s ease-out" : "none",
          }}
        />
      )}
    </motion.div>
  );
}
