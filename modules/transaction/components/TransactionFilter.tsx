"use client";

import { Button } from "@/components/ui/button";
import { TransactionPeriod } from "../types/transaction";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TransactionCategory } from "@/modules/transaction-category/types/transaction-category";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface TransactionFilterProps {
  categories: TransactionCategory[];
}

const PERIODS: { label: string; value: TransactionPeriod }[] = [
  { label: "รายวัน", value: "DAILY" },
  { label: "รายเดือน", value: "MONTHLY" },
  { label: "รายปี", value: "YEARLY" },
  { label: "ทั้งหมด", value: "ALL" },
];

export function TransactionFilter({ categories }: TransactionFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = (searchParams.get("period") as TransactionPeriod) || "MONTHLY";
  const currentCategoryId = searchParams.get("categoryId") || "ALL";
  const currentDate = searchParams.get("date") || "";
  const hasActiveFilters =
    currentDate ||
    currentPeriod !== "MONTHLY" ||
    currentCategoryId !== "ALL" ||
    searchParams.has("page");

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        (key !== "period" && value === "ALL")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
      {/* Date Filter (Overrides Period) */}
      <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
        <Input
          type="date"
          className="h-9 w-full text-sm md:w-[150px]"
          value={currentDate}
          onChange={(e) => {
            if (e.target.value) {
              updateFilters({ date: e.target.value, period: null }); // หากเลือกวันที่ ให้ล้าง period
            } else {
              updateFilters({ date: null, period: "MONTHLY" }); // หากเคลียร์วันที่ ให้กลับไปใช้ MONTHLY
            }
          }}
        />
        {!currentDate && (
          <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1 md:flex md:w-fit">
            {PERIODS.map((period) => (
              <Button
                key={period.value}
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ period: period.value, date: null })}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors h-7",
                  currentPeriod === period.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {period.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Category Filter */}
      <Select
        value={currentCategoryId}
        onValueChange={(value) => updateFilters({ categoryId: value })}
      >
        <SelectTrigger className="h-9 w-full md:w-[180px]">
          <SelectValue placeholder="ทุกหมวดหมู่" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={clearFilters}
          aria-label="ล้างตัวกรอง"
        >
          <XIcon data-icon="inline-start" className="size-4"/>
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  );
}
