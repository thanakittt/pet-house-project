"use client";

import { useMemo } from "react";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { ReceiptData } from "@/modules/pos/queries/get-receipt-data";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import BackButton from "@/components/BackButton";

interface ReceiptPrintViewProps {
  data: ReceiptData;
}

export function ReceiptPrintView({ data }: ReceiptPrintViewProps) {
  const router = useRouter();

  // จัดกลุ่มข้อมูล item ตามชื่อสัตว์เลี้ยง
  const groupedItems = useMemo(() => {
    return data.items.reduce((groups, item) => {
      const petName = item.petName;
      if (!groups[petName]) {
        groups[petName] = [];
      }
      groups[petName].push(item);
      return groups;
    }, {} as Record<string, typeof data.items>);
  }, [data.items]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center bg-muted/20 print:bg-white print:p-0 py-8 min-h-screen">
      {/* แถบเครื่องมือ */}
      <div className="print:hidden flex justify-between items-center mb-6 w-full max-w-sm">
        <BackButton />
        <Button onClick={handlePrint} className="shadow-sm">
          <Printer className="mr-2" size={16} /> พิมพ์ใบเสร็จ
        </Button>
      </div>

      {/* กระดาษใบเสร็จ */}
      <div className="bg-white shadow-lg print:shadow-none mx-auto p-6 w-full max-w-sm text-slate-800 print:text-black text-sm">
        {/* Header ร้าน */}
        <div className="mb-6 text-center">
          <div className="print:hidden flex justify-center mb-2">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="mb-1 font-bold text-xl">PET HOUSE</h1>
          <p className="text-muted-foreground print:text-black text-xs">
            เลขที่ 181/262 หมู่ 3 ถนนโพธาราม ตำบลช้างเผือก อำเภอเมืองเชียงใหม่
            จังหวัดเชียงใหม่
          </p>
          <p className="text-muted-foreground print:text-black text-xs">
            โทร: 086-429-5361
          </p>
        </div>

        <Separator className="my-4 border-dashed" />

        {/* ข้อมูลออเดอร์ */}
        <div className="space-y-1 mb-4 text-xs">
          <div className="flex justify-between">
            <span>เลขที่ใบเสร็จ:</span>
            <span className="font-medium">{data.receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span>วันที่:</span>
            <span>
              {format(new Date(data.paymentDate), "dd MMM yyyy HH:mm", {
                locale: th,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>แคชเชียร์:</span>
            <span>{data.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>ลูกค้า:</span>
            <span>
              {data.customer.nickname}{" "}
              {data.customer.phone && `(${data.customer.phone})`}
            </span>
          </div>
        </div>

        <Separator className="my-4 border-dashed" />

        {/* รายการสินค้า/บริการ (จัดกลุ่มตามสัตว์เลี้ยง) */}
        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-dashed">
                <th className="pb-2 font-medium text-left">รายการ</th>
                <th className="pb-2 font-medium text-right">ราคา</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {Object.entries(groupedItems).map(([petName, items]) => (
                <Fragment key={petName}>
                  {/* หัวข้อชื่อสัตว์เลี้ยง */}
                  <tr>
                    <td
                      colSpan={2}
                      className="pt-3 pb-1 font-bold text-foreground print:text-black text-sm"
                    >
                      น้อง: {petName}
                    </td>
                  </tr>
                  {/* รายการบริการของสัตว์เลี้ยงตัวนั้น */}
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1 pl-3 text-[11px] text-muted-foreground print:text-black">
                        - {item.serviceName} (
                        {
                          PET_SIZE_LABELS[
                            item.size as keyof typeof PET_SIZE_LABELS
                          ]
                        }
                        )
                      </td>
                      <td className="py-1 text-right">
                        {item.price.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <Separator className="my-4 border-dashed" />

        {/* สรุปยอด */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between items-center font-bold text-base">
            <span>ยอดรวมสุทธิ</span>
            <span>฿{data.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground print:text-black text-xs">
            <span>วิธีชำระเงิน</span>
            <span>{data.paymentMethod === "CASH" ? "เงินสด" : "โอนเงิน"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-muted-foreground print:text-black text-xs text-center">
          <p>ขอบคุณที่ใช้บริการ</p>
          <p>Please come again</p>
        </div>
      </div>
    </div>
  );
}

// สร้าง Component Fragment เพื่อใช้เป็น Wrapper ใน Map แบบมี Key
function Fragment({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}