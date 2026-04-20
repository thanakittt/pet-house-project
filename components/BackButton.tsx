"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => router.back()}
    >
      <ChevronLeft className="mr-2 w-4 h-4" />
      กลับ
    </Button>
  );
}
