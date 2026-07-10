"use client";

import { useTransition } from "react";
import {
  Controller,
  type Control,
  type UseFormRegister,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { CalendarPlus, Clock3, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { updateBusinessRules } from "../actions/update-business-rules";
import {
  DAY_OF_WEEK_LABELS,
  type BusinessRules,
} from "../types/business-rules";
import type { UpdateBusinessRulesInput } from "../validation";

type IntervalEditorProps = {
  control: Control<UpdateBusinessRulesInput>;
  register: UseFormRegister<UpdateBusinessRulesInput>;
  name:
    | `weeklyHours.${number}.intervals`
    | `dateOverrides.${number}.intervals`;
  disabled?: boolean;
};

function IntervalEditor({
  control,
  register,
  name,
  disabled = false,
}: IntervalEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <FieldGroup className="gap-3">
      {fields.length === 0 ? (
        <FieldDescription>ปิดรับคิวในวันนี้</FieldDescription>
      ) : (
        fields.map((field, index) => {
          const baseName = `${name}.${index}` as const;
          return (
            <Field key={field.id} orientation="responsive" data-disabled={disabled}>
              <FieldLabel className="sr-only">ช่วงเวลาที่ {index + 1}</FieldLabel>
              <div className="grid flex-1 grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                <Input
                  type="time"
                  disabled={disabled}
                  aria-label={`เวลาเริ่มช่วงที่ ${index + 1}`}
                  {...register(`${baseName}.startTime`)}
                />
                <span className="text-muted-foreground">ถึง</span>
                <Input
                  type="time"
                  disabled={disabled}
                  aria-label={`เวลาสิ้นสุดช่วงที่ ${index + 1}`}
                  {...register(`${baseName}.endTime`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  aria-label={`ลบช่วงเวลาที่ ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </Field>
          );
        })
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => append({ startTime: "09:00", endTime: "18:00" })}
      >
        <Plus data-icon="inline-start" />
        เพิ่มช่วงเวลา
      </Button>
    </FieldGroup>
  );
}

function WeeklyHoursEditor({
  control,
  register,
  dayIndex,
}: {
  control: Control<UpdateBusinessRulesInput>;
  register: UseFormRegister<UpdateBusinessRulesInput>;
  dayIndex: number;
}) {
  return (
    <FieldSet>
      <FieldLegend variant="label">{DAY_OF_WEEK_LABELS[dayIndex]}</FieldLegend>
      <IntervalEditor
        control={control}
        register={register}
        name={`weeklyHours.${dayIndex}.intervals`}
      />
    </FieldSet>
  );
}

function DateOverrideEditor({
  control,
  register,
  overrideIndex,
  onRemove,
}: {
  control: Control<UpdateBusinessRulesInput>;
  register: UseFormRegister<UpdateBusinessRulesInput>;
  overrideIndex: number;
  onRemove: () => void;
}) {
  const closedName = `dateOverrides.${overrideIndex}.isClosed` as const;

  return (
    <Card size="sm">
      <CardContent>
        <FieldGroup>
          <Field orientation="responsive">
            <FieldLabel htmlFor={`override-date-${overrideIndex}`}>
              วันที่
            </FieldLabel>
            <Input
              id={`override-date-${overrideIndex}`}
              type="date"
              {...register(`dateOverrides.${overrideIndex}.date`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="ลบวันพิเศษ"
            >
              <Trash2 />
            </Button>
          </Field>
          <Controller
            control={control}
            name={closedName}
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id={`override-closed-${overrideIndex}`}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <FieldLabel htmlFor={`override-closed-${overrideIndex}`}>
                  ปิดร้านทั้งวัน
                </FieldLabel>
              </Field>
            )}
          />
          <Controller
            control={control}
            name={closedName}
            render={({ field }) => (
              <FieldSet data-disabled={field.value}>
                <FieldLegend variant="label">เวลาเปิดแทนตารางปกติ</FieldLegend>
                <IntervalEditor
                  control={control}
                  register={register}
                  name={`dateOverrides.${overrideIndex}.intervals`}
                  disabled={field.value}
                />
              </FieldSet>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

export function BusinessRulesSettingsForm({
  initialRules,
}: {
  initialRules: BusinessRules;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateBusinessRulesInput>({
    defaultValues: initialRules,
    mode: "onSubmit",
    // dayOfWeek เป็นข้อมูลโครงสร้างที่ไม่ได้มี input ให้แก้ไขโดยตรง
    // จึงต้องคงค่า default ไว้ใน payload ตอน submit
    shouldUnregister: false,
  });
  const {
    fields: dateOverrideFields,
    append: appendDateOverride,
    remove: removeDateOverride,
  } = useFieldArray({ control, name: "dateOverrides" });

  const onSubmit = (input: UpdateBusinessRulesInput) => {
    startTransition(async () => {
      const result = await updateBusinessRules(input);
      if (!result.success) {
        setError("root.serverError", { message: result.error });
        toast.error(result.error);
        return;
      }

      toast.success("บันทึกการตั้งค่าร้านแล้ว");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Alert>
        <Clock3 />
        <AlertTitle>กฎใหม่มีผลกับคิวที่สร้างหลังบันทึก</AlertTitle>
        <AlertDescription>
          คิวที่มีอยู่แล้วจะยังคงเดิม แม้จะอยู่นอกเวลาทำการที่แก้ไขใหม่
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>นโยบายการจอง</CardTitle>
          <CardDescription>
            กำหนดขอบเขตการจองที่ใช้ทั้งหน้าลูกค้าและหลังบ้าน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field orientation="responsive" data-invalid={Boolean(errors.minBookingLeadMinutes)}>
              <FieldLabel htmlFor="min-booking-lead">เวลาจองล่วงหน้าขั้นต่ำ (นาที)</FieldLabel>
              <Input
                id="min-booking-lead"
                type="number"
                min={0}
                max={10080}
                aria-invalid={Boolean(errors.minBookingLeadMinutes)}
                {...register("minBookingLeadMinutes", { valueAsNumber: true })}
              />
              {errors.minBookingLeadMinutes && <FieldError>{errors.minBookingLeadMinutes.message}</FieldError>}
            </Field>
            <Field orientation="responsive" data-invalid={Boolean(errors.maxAdvanceBookingDays)}>
              <FieldLabel htmlFor="max-advance-booking">ระยะจองล่วงหน้าสูงสุด (วัน)</FieldLabel>
              <Input
                id="max-advance-booking"
                type="number"
                min={1}
                max={365}
                aria-invalid={Boolean(errors.maxAdvanceBookingDays)}
                {...register("maxAdvanceBookingDays", { valueAsNumber: true })}
              />
              {errors.maxAdvanceBookingDays && <FieldError>{errors.maxAdvanceBookingDays.message}</FieldError>}
            </Field>
            <Field orientation="responsive" data-invalid={Boolean(errors.slotIntervalMinutes)}>
              <FieldLabel htmlFor="slot-interval">ช่วงห่างของสล็อต (นาที)</FieldLabel>
              <Input
                id="slot-interval"
                type="number"
                min={5}
                max={120}
                aria-invalid={Boolean(errors.slotIntervalMinutes)}
                {...register("slotIntervalMinutes", { valueAsNumber: true })}
              />
              {errors.slotIntervalMinutes && <FieldError>{errors.slotIntervalMinutes.message}</FieldError>}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เวลาทำการรายสัปดาห์</CardTitle>
          <CardDescription>
            เพิ่มได้หลายช่วงต่อวัน เช่น แยกก่อนและหลังเวลาพัก
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <WeeklyHoursEditor
                key={dayIndex}
                control={control}
                register={register}
                dayIndex={dayIndex}
              />
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>วันพิเศษ</CardTitle>
          <CardDescription>
            ปิดร้านทั้งวัน หรือระบุเวลาเปิดใหม่เพื่อแทนที่ตารางรายสัปดาห์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {dateOverrideFields.map((field, index) => (
              <DateOverrideEditor
                key={field.id}
                control={control}
                register={register}
                overrideIndex={index}
                onRemove={() => removeDateOverride(index)}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendDateOverride({ date: "", isClosed: true, intervals: [] })
              }
            >
              <CalendarPlus data-icon="inline-start" />
              เพิ่มวันพิเศษ
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {errors.root?.serverError && <FieldError>{errors.root.serverError.message}</FieldError>}

      <Card size="sm">
        <CardFooter className="justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner /> : <Save data-icon="inline-start" />}
            บันทึกการตั้งค่าร้าน
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
