import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold">404</h1>

      <p className="mt-2 text-muted-foreground">ไม่พบหน้าที่คุณต้องการ</p>

      <Button asChild size="lg" className="mt-6">
        <Link href="/">กลับหน้าแรก</Link>
      </Button>
    </div>
  );
}
