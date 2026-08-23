"use client";

import { ThemeLogo } from "@/components/theme-logo";
import { useMemo, Fragment } from "react"; // นำเข้า Fragment จาก react โดยตรง
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReceiptData } from "@/modules/pos/queries/get-receipt-data";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { formatPhoneNumber, formatThaiDate } from "@/lib/utils";
import BackButton from "@/components/BackButton";

interface ReceiptPrintViewProps {
  data: ReceiptData;
}

export function ReceiptPrintView({ data }: ReceiptPrintViewProps) {
  // จัดกลุ่มข้อมูล item ตาม ID สัตว์เลี้ยงเพื่อป้องกันชื่อซ้ำ
  const groupedItems = useMemo(() => {
    return data.items.reduce(
      (groups, item) => {
        // เพิ่ม petId ใน type ของ item หากมีการเรียกใช้
        const key = item.petId || item.petName;
        if (!groups[key]) {
          groups[key] = {
            petName: item.petName,
            items: [],
          };
        }
        groups[key].items.push(item);
        return groups;
      },
      {} as Record<string, { petName: string; items: typeof data.items }>,
    );
  }, [data]);

  // [NEW] คำนวณยอดเงินสำหรับแสดงผล
  const subTotal = useMemo(() => {
    return data.items.reduce((sum, item) => sum + Number(item.price), 0);
  }, [data.items]);

  const netTotal = data.totalAmount;
  // ส่วนต่างระหว่างราคาสินค้าจริง กับเงินที่จ่ายหน้าเคาน์เตอร์ คือค่ามัดจำที่หักออกไป
  const depositAmount = Math.max(0, subTotal - netTotal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center bg-muted/20 print:bg-white print:p-0 py-8 min-h-screen">
      {/* แถบเครื่องมือ */}
      <div className="print:hidden flex justify-between items-center mb-6 w-full max-w-sm">
        <BackButton />
        <Button onClick={handlePrint} className="max-lg:hidden shadow-sm">
          <Printer className="mr-2" size={16} /> พิมพ์ใบเสร็จ
        </Button>
      </div>

      {/* กระดาษใบเสร็จ */}
      <div className="bg-white shadow-lg print:shadow-none mx-auto p-6 w-full max-w-sm text-slate-800 print:text-black text-sm">
        {/* Header ร้าน */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-2">
            <ThemeLogo
              alt="Pet House logo"
              width={56}
              height={56}
              priority
              className="rounded-lg w-14 h-14 object-contain"
            />
          </div>
          <h1 className="mb-1 font-bold text-xl">PET HOUSE</h1>
          <p className="text-muted-foreground print:text-black text-xs">
            181/262 ม.3 ถ.โพธาราม ต.ช้างเผือก
            <br />อ.เมืองเชียงใหม่ จ.เชียงใหม่ 50300
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
            <span>{formatThaiDate(data.paymentDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>แคชเชียร์:</span>
            <span>{data.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>ลูกค้า:</span>
            <span>
              {data.customer.nickname}{" "}
              {data.customer.phone &&
                `(${formatPhoneNumber(data.customer.phone)})`}
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
              {Object.entries(groupedItems).map(([petId, group]) => (
                <Fragment key={petId}>
                  {/* หัวข้อชื่อสัตว์เลี้ยง */}
                  <tr>
                    <td
                      colSpan={2}
                      className="pt-3 pb-1 font-bold text-foreground print:text-black text-sm"
                    >
                      น้อง: {group.petName}
                    </td>
                  </tr>
                  {/* รายการบริการของสัตว์เลี้ยงตัวนั้น */}
                  {group.items.map((item) => (
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

        {/* [NEW] สรุปยอดแบบแจกแจงรายละเอียด */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between items-center text-muted-foreground print:text-black">
            <span>ยอดรวมบริการ</span>
            <span>฿{subTotal.toLocaleString()}</span>
          </div>

          {/* แสดงบรรทัดหักมัดจำเฉพาะกรณีที่มีมัดจำเท่านั้น */}
          {depositAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 print:text-black">
              <span>หักมัดจำล่วงหน้า</span>
              <span>-฿{depositAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-border border-t border-dashed font-bold text-base">
            <span>ยอดชำระสุทธิ</span>
            <span>฿{netTotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center pt-1 text-muted-foreground print:text-black text-xs">
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
