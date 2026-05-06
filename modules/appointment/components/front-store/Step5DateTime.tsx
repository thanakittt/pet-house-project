"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOP_CLOSED_DAY } from "@/lib/constants/appointment";
import { getAvailableSlots } from "@/modules/appointment/queries/get-available-slots";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  formatDurationMinutes,
  type FrontStoreFormData,
} from "./booking-utils";

function getInitialDate() {
  const date = new Date();

  while (date.getDay() === SHOP_CLOSED_DAY) {
    date.setDate(date.getDate() + 1);
  }

  return format(date, "yyyy-MM-dd");
}

export default function Step5DateTime({
  data,
  update,
  durationMinutes,
}: {
  data: FrontStoreFormData;
  update: (data: FrontStoreFormData) => void;
  durationMinutes: number;
}) {
  const [selectedDate, setSelectedDate] = useState(getInitialDate);
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

      const dayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();

      if (dayOfWeek === SHOP_CLOSED_DAY) {
        setAvailableSlots([]);
        return;
      }

      setIsLoading(true);

      const result = await getAvailableSlots({
        date: selectedDate,
        durationMinutes,
      });

      if (!isCurrent) return;

      setAvailableSlots(result.success && result.data ? result.data : []);
      setIsLoading(false);
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
        <h3 className="font-bold text-primary text-xl">
          ขั้นตอนที่ 5 : เลือกวันและเวลา
        </h3>
        <p className="text-muted-foreground text-sm">
          ระบบจะแสดงเฉพาะเวลาที่ว่างตามระยะเวลาบริการรวม
        </p>
      </div>

      <div className="flex flex-col justify-between gap-4 bg-white shadow-sm p-6 md:p-8 border border-slate-100 rounded-2xl h-full overflow-hidden">
        <div className="flex md:flex-row flex-col md:items-end gap-4">
          <div className="flex flex-col gap-3 w-full">
            <Label
              htmlFor="date"
              className="flex items-center gap-2 font-semibold text-primary text-base"
            >
              <CalendarDays className="size-4 text-primary" />
              วันที่รับบริการ
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={selectedDate}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <p className="pl-1 text-muted-foreground text-xs">
              *ร้านหยุดทุกวันพุธ
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Label className="flex items-center gap-2 font-semibold text-slate-700 text-base">
              <Clock className="size-4 text-primary" />
              เวลาที่สามารถจองได้
            </Label>
            <Input
              type="text"
              value={formatDurationMinutes(durationMinutes)}
              disabled
              readOnly
            />
            <p className="pl-1 text-muted-foreground text-xs">
              * เวลาทำการ 09:00 น. - 18:00 น.
            </p>
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
            <p className="bg-red-50 p-4 rounded-lg text-red-500 text-sm">
              ขออภัย ไม่มีคิวว่างสำหรับวันนี้ กรุณาเลือกวันอื่น
            </p>
          )}
        </div>
      </div>

      {data.startTimeIso ? (
        <div className="bg-primary/5 p-4 border border-primary rounded-2xl">
          <p className="text-primary text-sm text-center">
            คุณเลือกวันที่{" "}
            <span className="font-bold text-primary">{format(selectedDate, "dd MMMM yyyy", { locale: th })}</span>{" "}
            เวลา{" "}
            <span className="font-bold text-primary">{selectedTimeLabel} น.</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
