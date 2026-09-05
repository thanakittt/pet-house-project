"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Percent, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PurchaseOrderDetail } from "@/modules/inventories/types/purchase-order";
import { formatThaiDate } from "@/lib/utils";
import { thaiBahtText } from "@/modules/inventories/utils/baht-text";
import Image from "next/image";

function formatMoney(amount: number): string {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPoNumber(id: string): string {
  return `#PO-${id.replace(/-/g, "").toUpperCase().slice(-8)}`;
}

interface PurchaseOrderPrintViewProps {
  order: PurchaseOrderDetail;
}

/**
 * PurchaseOrderPrintView — คอมโพเนนต์หน้าพิมพ์ใบสั่งซื้อ A4 ทางการ (Classic Formal)
 * ซ่อน UI ควบคุมอัตโนมัติเมื่อสั่งพิมพ์ผ่าน @media print
 */
export function PurchaseOrderPrintView({ order }: PurchaseOrderPrintViewProps) {
  // State ปรับอัตรา VAT (เริ่มต้น 7%)
  const [vatRate, setVatRate] = useState<number>(7);

  // State ข้อมูลคู่ค้า / ผู้จำหน่าย (กรอกสดบนหน้าพิมพ์)
  const [vendorName, setVendorName] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorTaxId, setVendorTaxId] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");

  // คำนวณยอดเงิน Subtotal จากรายการจริง
  const subtotal = order.items.reduce((sum, item) => {
    const cost = parseFloat(item.unitCost.toString()) || 0;
    return sum + item.quantity * cost;
  }, 0);

  const vatAmount = (subtotal * vatRate) / 100;
  const grandTotal = subtotal + vatAmount;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 text-slate-800 print:bg-white print:p-0 print:m-0">
      {/* CSS สำหรับสั่งพิมพ์ A4 และซ่อน Sidebar / Layout ของระบบ */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden,
          header,
          aside,
          nav,
          [data-sidebar="sidebar"],
          [data-sidebar="wrapper"] {
            display: none !important;
          }
          .a4-container {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* แถบเครื่องมือควบคุมด้านบน (ซ่อนอัตโนมัติตอนพิมพ์) */}
      <div className="max-w-[210mm] mx-auto mb-6 p-4 bg-white rounded-xl shadow-md border border-slate-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/back-office/inventories/purchase-orders/${order.id}`}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              กลับไปหน้ารายละเอียด PO
            </Link>
          </Button>

          <div className="h-6 w-px bg-slate-200" />

          {/* ปรับอัตรา VAT */}
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              ภาษี VAT:
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={vatRate === 7 ? "default" : "outline"}
                className="h-8 px-2.5 text-xs"
                onClick={() => setVatRate(7)}
              >
                7%
              </Button>
              <Button
                type="button"
                size="sm"
                variant={vatRate === 0 ? "default" : "outline"}
                className="h-8 px-2.5 text-xs"
                onClick={() => setVatRate(0)}
              >
                0%
              </Button>
              <div className="relative w-20">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                  className="h-8 pr-6 text-xs text-right"
                />
                <span className="absolute right-2 top-2 text-xs text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* ปุ่มกรอกข้อมูลผู้จำหน่าย */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium"
              >
                <Store className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                ระบุข้อมูลผู้จำหน่าย
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-4 text-xs space-y-3"
              align="start"
            >
              <p className="font-bold text-slate-800 text-sm border-b pb-1.5">
                ข้อมูลผู้จำหน่าย (Vendor)
              </p>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">
                  ชื่อบริษัท / ผู้จัดจำหน่าย
                </label>
                <Input
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="เช่น บริษัท เพ็ทแคร์ จำกัด"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">
                  ที่อยู่
                </label>
                <textarea
                  rows={2}
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  placeholder="ที่อยู่สำหรับออกเอกสาร..."
                  className="w-full rounded-md border border-input p-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">
                    เบอร์โทร
                  </label>
                  <Input
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="02-xxx-xxxx"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">
                    เลขผู้เสียภาษี
                  </label>
                  <Input
                    value={vendorTaxId}
                    onChange={(e) => setVendorTaxId(e.target.value)}
                    placeholder="13 หลัก"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ปุ่มสั่งพิมพ์ */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow"
          >
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์เอกสาร (Print A4)
          </Button>
        </div>
      </div>

      {/* แผ่นกระดาษ A4 Container */}
      <div className="a4-container mx-auto w-[210mm] min-h-[297mm] bg-white p-[12mm] shadow-xl border border-slate-200 font-sans print:shadow-none print:border-none print:w-full print:min-h-0 print:p-0">
        <div className="flex flex-col justify-between min-h-[273mm] text-[13px] leading-relaxed">
          <div>
            {/* ส่วนหัวเอกสาร */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
              <div className="w-7/12 flex items-start gap-3.5">
                <Image
                  src="/images/logo/2.png"
                  alt="Pet House Logo"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-cover rounded-lg shrink-0"
                  priority
                />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                      PET HOUSE
                    </h1>
                  </div>
                  <p className="font-semibold text-slate-800">
                    บริษัท เพ็ทเฮ้าส์ เซอร์วิสเซส จำกัด
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    181/262 ม.3 ถ.โพธาราม ต.ช้างเผือก อ.เมืองเชียงใหม่ จ.เชียงใหม่
                    50300
                  </p>
                  <p className="text-slate-600 text-xs">
                    โทร: 02-123-4567 | เลขประจำตัวผู้เสียภาษี: -
                  </p>
                </div>
              </div>

              <div className="w-5/12 text-right">
                <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase">
                  ใบสั่งซื้อสินค้า
                </h2>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest -mt-0.5 mb-2">
                  PURCHASE ORDER
                </p>
                <div className="inline-block text-left bg-slate-50 border border-slate-300 rounded p-2.5 text-xs space-y-1">
                  <div>
                    <span className="font-bold text-slate-700">
                      เลขที่ PO:{" "}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatPoNumber(order.id)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">วันที่: </span>
                    <span>{formatThaiDate(order.orderDate)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">
                      ผู้สั่งซื้อ:{" "}
                    </span>
                    <span>{order.staffNickname}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลคู่ค้า & สถานที่จัดส่ง */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="border border-slate-300 rounded-md p-3 bg-white">
                <div className="flex justify-between items-center border-b pb-1 mb-1">
                  <p className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    ผู้จำหน่าย / VENDOR
                  </p>
                  <span className="text-[10px] text-amber-600 font-medium print:hidden">
                    (คลิกพิมพ์แก้ไขได้)
                  </span>
                </div>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="ระบุชื่อบริษัท / ผู้จัดจำหน่าย..."
                  className="w-full font-bold text-slate-900 border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-800 focus:outline-none bg-transparent py-0.5 print:border-none placeholder:text-slate-300"
                />
                <textarea
                  rows={2}
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  placeholder="ระบุที่อยู่ผู้จัดจำหน่าย..."
                  className="w-full text-xs text-slate-600 border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-800 focus:outline-none bg-transparent py-0.5 mt-0.5 resize-none print:border-none placeholder:text-slate-300"
                />
                <div className="flex gap-2 text-xs text-slate-600 mt-1">
                  <span>โทร:</span>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="02-xxx-xxxx"
                    className="flex-1 border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-800 focus:outline-none bg-transparent print:border-none placeholder:text-slate-300"
                  />
                </div>
                <div className="flex gap-2 text-xs text-slate-600">
                  <span>เลขประจำตัวผู้เสียภาษี:</span>
                  <input
                    type="text"
                    value={vendorTaxId}
                    onChange={(e) => setVendorTaxId(e.target.value)}
                    placeholder="เลข 13 หลัก"
                    className="flex-1 border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-800 focus:outline-none bg-transparent print:border-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="border border-slate-300 rounded-md p-3 bg-white">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1 border-b pb-1">
                  สถานที่จัดส่ง / DELIVER TO
                </p>
                <p className="font-bold text-slate-900">ร้าน Pet House</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  181/262 ม.3 ถ.โพธาราม ต.ช้างเผือก อ.เมืองเชียงใหม่ จ.เชียงใหม่
                  50300
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  ผู้รับสินค้า: แผนกคลังสินค้า (02-123-4567)
                </p>
              </div>
            </div>

            {/* ตารางรายการสินค้า */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="border-r border-slate-300 py-2 px-2 text-center w-12">
                    ลำดับ
                  </th>
                  <th className="border-r border-slate-300 py-2 px-3 text-left">
                    รายการสินค้า (Description)
                  </th>
                  <th className="border-r border-slate-300 py-2 px-2 text-center w-20">
                    จำนวน
                  </th>
                  <th className="border-r border-slate-300 py-2 px-3 text-right w-28">
                    ราคา/หน่วย
                  </th>
                  <th className="py-2 px-3 text-right w-32">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ไม่มีรายการสินค้าในใบสั่งซื้อนี้
                    </td>
                  </tr>
                ) : (
                  order.items.map((item, index) => {
                    const cost = parseFloat(item.unitCost.toString()) || 0;
                    const rowTotal = item.quantity * cost;
                    return (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="border-r border-slate-300 py-2 px-2 text-center text-slate-600">
                          {index + 1}
                        </td>
                        <td className="border-r border-slate-300 py-2 px-3">
                          <p className="font-medium text-slate-900">
                            {item.inventoryItemName}
                          </p>
                        </td>
                        <td className="border-r border-slate-300 py-2 px-2 text-center font-mono">
                          {item.quantity}
                        </td>
                        <td className="border-r border-slate-300 py-2 px-3 text-right font-mono">
                          {formatMoney(cost)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium">
                          {formatMoney(rowTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* สรุปยอดเงิน */}
            <div className="flex justify-between items-start mt-4">
              <div className="w-7/12 pt-2 pr-4">
                <div className="border border-slate-200 rounded p-2.5 bg-slate-50 text-xs">
                  <p className="font-semibold text-slate-700 mb-0.5">
                    จำนวนเงินตัวอักษร:
                  </p>
                  <p className="text-slate-900 font-medium italic">
                    {thaiBahtText(grandTotal)}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  *
                  โปรดแนบสำเนาใบสั่งซื้อฉบับนี้มาพร้อมกับใบส่งสินค้าและใบแจ้งหนี้ทุกครั้ง
                </p>
              </div>

              <div className="w-5/12 border border-slate-300 rounded bg-white text-xs">
                <div className="flex justify-between py-1.5 px-3 border-b border-slate-200">
                  <span className="text-slate-600">
                    รวมเป็นเงิน (Subtotal):
                  </span>
                  <span className="font-mono font-medium">
                    {formatMoney(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 px-3 border-b border-slate-200">
                  <span className="text-slate-600">
                    ภาษีมูลค่าเพิ่ม (VAT {vatRate}%):
                  </span>
                  <span className="font-mono font-medium">
                    {formatMoney(vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 bg-slate-100 font-bold text-slate-900 text-sm">
                  <span>จำนวนเงินรวมสุทธิ:</span>
                  <span className="font-mono text-emerald-700">
                    {formatMoney(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนลงนามท้ายเอกสาร 2 ช่อง */}
          <div className="grid grid-cols-2 gap-12 pt-10 border-t border-slate-300 mt-12 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2">
                <p className="text-slate-400 italic mb-2">[ ลายมือชื่อ ]</p>
              </div>
              <p className="font-bold text-slate-900">
                ({order.staffNickname})
              </p>
              <p className="text-slate-600 text-[11px]">
                ผู้สั่งซื้อสินค้า / จัดทำโดย
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                วันที่: ____/____/________
              </p>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-8 mb-2">
                <p className="text-slate-400 italic mb-2">[ ลายมือชื่อ ]</p>
              </div>
              <p className="font-bold text-slate-900">
                (__________________________)
              </p>
              <p className="text-slate-600 text-[11px]">
                ผู้มีอำนาจอนุมัติสั่งซื้อ
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                วันที่: ____/____/________
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
