"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface VariantOption {
  key: string;
  name: string;
}

interface PrototypeSwitcherProps {
  variants: VariantOption[];
  currentVariant: string;
}

/**
 * PrototypeSwitcher — Floating bottom bar สำหรับสลับดู Variant ของ Prototype
 * รองรับคลิกปุ่มซ้าย-ขวา และกดแป้นพิมพ์ลูกศร Left/Right
 * ซ่อนอัตโนมัติใน production และตอนพิมพ์ (@media print)
 */
export function PrototypeSwitcher({
  variants,
  currentVariant,
}: PrototypeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentIndex = variants.findIndex((v) => v.key === currentVariant);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  const goToIndex = useCallback(
    (index: number) => {
      const nextIndex = (index + variants.length) % variants.length;
      const targetVariant = variants[nextIndex];
      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", targetVariant.key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [variants, searchParams, pathname, router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToIndex(safeIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToIndex(safeIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [safeIndex, goToIndex]);

  // ไม่แสดงผลใน production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const currentOption = variants[safeIndex];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white shadow-2xl border border-slate-700/60 backdrop-blur text-sm font-medium">
        <button
          type="button"
          onClick={() => goToIndex(safeIndex - 1)}
          aria-label="Previous variant"
          className="p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2 select-none tracking-wide text-xs md:text-sm">
          <span className="font-bold text-amber-400">Variant {currentOption.key}</span>
          <span className="text-slate-400 mx-1.5">:</span>
          <span>{currentOption.name}</span>
          <span className="text-slate-400 ml-2 text-xs">
            ({safeIndex + 1}/{variants.length})
          </span>
        </span>

        <button
          type="button"
          onClick={() => goToIndex(safeIndex + 1)}
          aria-label="Next variant"
          className="p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer text-slate-300 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
