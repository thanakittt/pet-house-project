ALTER TABLE "appointments" DROP CONSTRAINT "appointment_date_check";--> statement-breakpoint
ALTER TABLE "appointment_items" ALTER COLUMN "price" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "appointment_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "service_variants" ALTER COLUMN "max_price" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "appointment_items" ADD COLUMN "start_time" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment_items" ADD COLUMN "end_time" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "end_date";