"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBangkokTodayString } from "@/lib/finance/date";
import { formatThaiDate } from "@/lib/utils";
import { getAvailableSlots } from "@/modules/appointment/queries/get-available-slots";
import { addDays, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  formatDurationMinutes,
  type FrontStoreFormData,
} from "./booking-utils";
import type { BusinessRules } from "@/modules/business-rules/types/business-rules";

export default function Step5DateTime({
  data,
  update,
  durationMinutes,
  bookingRules,
}: {
  data: FrontStoreFormData;
  update: (data: FrontStoreFormData) => void;
  durationMinutes: number;
  bookingRules: BusinessRules;
}) {
  const [selectedDate, setSelectedDate] = useState(getBangkokTodayString);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedTimeLabel = useMemo(() => {
    if (!data.startTimeIso) return "";

    return format(parseISO(data.startTimeIso), "HH:mm", { locale: th });
  }, [data.startTimeIso]);

  useEffect(() => {
    let isCurrent = true;

    async function loadSlots() {
      if (!selectedDate || durationMinutes <= 0) {
        setAvailableSlots([]);
        return;
      }

      update({ ...data, startTimeIso: "" });

      setIsLoading(true);

      try {
        // ดึงข้อมูล slot ที่ว่างจาก server action
        const result = await getAvailableSlots({
          date: selectedDate,
          durationMinutes,
        });

        // ถ้า effect นี้ถูกยกเลิกแล้ว (เช่น user เปลี่ยนวันก่อนผลลัพธ์กลับมา)
        // ไม่ต้องอัปเดต state ของ effect เก่า
        if (!isCurrent) return;

        // อัปเดต slot ที่ว่าง — ถ้า API สำเร็จและมีข้อมูล ให้ใช้ข้อมูลนั้น
        // ถ้าไม่สำเร็จหรือไม่มีข้อมูล ให้ set เป็น array ว่าง
        setAvailableSlots(result.success && result.data ? result.data : []);
      } catch (error) {
        // กรณี getAvailableSlots throw error (เช่น network error)
        // log ไว้เพื่อ debug และ reset slots เป็นค่าว่าง
        console.error("[Step5DateTime] ดึงข้อมูล slot ไม่สำเร็จ:", error);

        if (!isCurrent) return;

        setAvailableSlots([]);
      } finally {
        // finally จะรันเสมอไม่ว่าจะสำเร็จหรือ error
        // ทำให้ isLoading กลับเป็น false ทุกกรณี
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadSlots();

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, durationMinutes]);

  return (
    <div className="slide-in-from-right-4 flex flex-col gap-6 mx-auto max-w-4xl animate-in duration-500 fade-in">
      <div className="text-left">
        <h3 className="font-bold text-primary text-lg md:text-xl">
          ขั้นตอนที่ 5 : เลือกวันและเวลา
        </h3>
        <p className="text-muted-foreground text-sm">
          ระบบจะแสดงเฉพาะเวลาที่ว่างตามระยะเวลาบริการรวม
        </p>
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div className="flex md:flex-row flex-col md:items-end gap-6 md:gap-10">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2 justify-between">
              <Label
                htmlFor="date"
                className="flex items-center gap-2 font-semibold text-primary text-base"
              >
                <CalendarDays className="size-4 text-primary" />
                วันที่รับบริการ
              </Label>
              <p className="pl-1 text-muted-foreground text-xs">
                *จองล่วงหน้าได้สูงสุด {bookingRules.maxAdvanceBookingDays} วัน
              </p>
            </div>
            <Input
              id="date"
              name="date"
              type="date"
              value={selectedDate}
              min={getBangkokTodayString()}
              max={format(
                addDays(
                  new Date(`${getBangkokTodayString()}T00:00:00`),
                  bookingRules.maxAdvanceBookingDays,
                ),
                "yyyy-MM-dd",
              )}
              onChange={(event) => setSelectedDate(event.target.value)}
            />

          </div>

          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2 justify-between">
              <Label className="flex items-center gap-2 font-semibold text-primary text-base">
                <Clock className="size-4 text-primary" />
                เวลาที่สามารถจองได้
              </Label>
              {bookingRules.minBookingLeadMinutes > 0 ? (
                <p className="pl-1 text-muted-foreground text-xs">
                  *จองก่อนอย่างน้อย {bookingRules.minBookingLeadMinutes} นาที
                </p>
              ) : null}
            </div>
            <Input
              type="text"
              value={formatDurationMinutes(durationMinutes)}
              disabled
              readOnly
            />
          </div>
        </div>

        <div>
          {isLoading ? (
            <p className="bg-muted/40 p-4 rounded-lg text-muted-foreground text-sm">
              กำลังตรวจสอบคิวว่าง...
            </p>
          ) : availableSlots.length > 0 ? (
            <div className="gap-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
              {availableSlots.map((slotIso) => {
                const isSelected = data.startTimeIso === slotIso;

                return (
                  <Button
                    key={slotIso}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => update({ ...data, startTimeIso: slotIso })}
                    className="w-full text-sm"
                  >
                    {format(parseISO(slotIso), "HH:mm", { locale: th })}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              ขออภัย ไม่มีคิวว่างสำหรับวันนี้ กรุณาเลือกวันอื่น
            </p>
          )}
        </div>
      </div>

      {data.startTimeIso ? (
        <div className="bg-primary/5 p-4 border border-primary rounded-2xl">
          <p className="text-primary text-sm text-center">
            คุณเลือกวันที่{" "}
            <span className="font-bold text-primary">
              {formatThaiDate(selectedDate)}
            </span>{" "}
            เวลา{" "}
            <span className="font-bold text-primary">{selectedTimeLabel} น.</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
