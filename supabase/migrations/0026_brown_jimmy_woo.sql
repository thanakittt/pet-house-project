CREATE TYPE "public"."purchase_order_log_event" AS ENUM('CREATED', 'STATUS_CHANGED', 'ITEMS_UPDATED', 'VENDOR_UPDATED', 'DELETED');--> statement-breakpoint
CREATE TABLE "purchase_order_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"event" "purchase_order_log_event" NOT NULL,
	"from_status" "purchase_order_status",
	"to_status" "purchase_order_status",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_order_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "purchase_order_logs" ADD CONSTRAINT "purchase_order_logs_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_logs" ADD CONSTRAINT "purchase_order_logs_staff_id_staffs_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_order_logs_order_id_idx" ON "purchase_order_logs" USING btree ("purchase_order_id");