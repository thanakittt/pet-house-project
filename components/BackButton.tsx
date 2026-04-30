"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BackButton({
  className,
  href,
}: {
  className?: string;
  href?: string;
}) {
  const router = useRouter();

  if (href) {
    return (
      <Button variant="outline" className={className} asChild>
        <Link href={href}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          กลับ
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => router.back()}
    >
      <ChevronLeft className="mr-2 h-4 w-4" />
      กลับ
    </Button>
  );
}
