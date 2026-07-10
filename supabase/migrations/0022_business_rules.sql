CREATE TABLE "business_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "min_booking_lead_minutes" integer DEFAULT 0 NOT NULL,
  "max_advance_booking_days" integer DEFAULT 90 NOT NULL,
  "slot_interval_minutes" integer DEFAULT 30 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "business_rules_lead_time_check" CHECK ("min_booking_lead_minutes" >= 0),
  CONSTRAINT "business_rules_advance_days_check" CHECK ("max_advance_booking_days" >= 1),
  CONSTRAINT "business_rules_slot_interval_check" CHECK ("slot_interval_minutes" >= 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "business_rules_singleton_idx" ON "business_rules" USING btree ((true));
--> statement-breakpoint
CREATE TABLE "business_weekly_hours" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_rule_id" uuid NOT NULL,
  "day_of_week" smallint NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "business_weekly_hours_day_of_week_check" CHECK ("day_of_week" BETWEEN 0 AND 6),
  CONSTRAINT "business_weekly_hours_time_range_check" CHECK ("start_time" < "end_time")
);
--> statement-breakpoint
CREATE TABLE "business_date_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_rule_id" uuid NOT NULL,
  "date" date NOT NULL,
  "is_closed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "business_date_override_hours" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_date_override_id" uuid NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "business_date_override_hours_time_range_check" CHECK ("start_time" < "end_time")
);
--> statement-breakpoint
ALTER TABLE "business_weekly_hours" ADD CONSTRAINT "business_weekly_hours_business_rule_id_business_rules_id_fk" FOREIGN KEY ("business_rule_id") REFERENCES "public"."business_rules"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "business_date_overrides" ADD CONSTRAINT "business_date_overrides_business_rule_id_business_rules_id_fk" FOREIGN KEY ("business_rule_id") REFERENCES "public"."business_rules"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "business_date_override_hours" ADD CONSTRAINT "business_date_override_hours_business_date_override_id_business_date_overrides_id_fk" FOREIGN KEY ("business_date_override_id") REFERENCES "public"."business_date_overrides"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "business_weekly_hours_rule_day_idx" ON "business_weekly_hours" USING btree ("business_rule_id", "day_of_week");
--> statement-breakpoint
CREATE UNIQUE INDEX "business_weekly_hours_rule_day_start_unique" ON "business_weekly_hours" USING btree ("business_rule_id", "day_of_week", "start_time");
--> statement-breakpoint
CREATE UNIQUE INDEX "business_date_overrides_rule_date_unique" ON "business_date_overrides" USING btree ("business_rule_id", "date");
--> statement-breakpoint
CREATE INDEX "business_date_override_hours_override_idx" ON "business_date_override_hours" USING btree ("business_date_override_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "business_date_override_hours_override_start_unique" ON "business_date_override_hours" USING btree ("business_date_override_id", "start_time");
--> statement-breakpoint
ALTER TABLE "business_rules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "business_weekly_hours" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "business_date_overrides" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "business_date_override_hours" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "business_rules" (
  "min_booking_lead_minutes",
  "max_advance_booking_days",
  "slot_interval_minutes"
) VALUES (0, 90, 30)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "business_weekly_hours" (
  "business_rule_id",
  "day_of_week",
  "start_time",
  "end_time"
)
SELECT "id", day_of_week, '09:00'::time, '18:00'::time
FROM "business_rules"
CROSS JOIN (VALUES (0::smallint), (1::smallint), (2::smallint), (4::smallint), (5::smallint), (6::smallint)) AS weekdays(day_of_week)
ON CONFLICT DO NOTHING;
