CREATE TYPE "public"."purchase_order_issue_resolution_type" AS ENUM('ALL_ITEMS_RECEIVED', 'DISCOUNT_NEXT_ORDER', 'REFUNDED', 'WAIVED');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_issue_status" AS ENUM('OPEN', 'RESOLVED');--> statement-breakpoint
ALTER TYPE "public"."purchase_order_status" ADD VALUE 'PARTIALLY_RECEIVED' BEFORE 'RECEIVED';--> statement-breakpoint
CREATE TABLE "purchase_order_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"ordered_quantity" smallint NOT NULL,
	"received_quantity" smallint DEFAULT 0 NOT NULL,
	"shortage_quantity" smallint NOT NULL,
	"status" "purchase_order_issue_status" DEFAULT 'OPEN' NOT NULL,
	"resolution_type" "purchase_order_issue_resolution_type",
	"resolution_note" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "purchase_order_issues_ordered_quantity_check" CHECK ("purchase_order_issues"."ordered_quantity" >= 0),
	CONSTRAINT "purchase_order_issues_received_quantity_check" CHECK ("purchase_order_issues"."received_quantity" >= 0),
	CONSTRAINT "purchase_order_issues_shortage_quantity_check" CHECK ("purchase_order_issues"."shortage_quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "purchase_order_issues" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "received_quantity" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_issues" ADD CONSTRAINT "purchase_order_issues_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_issues" ADD CONSTRAINT "purchase_order_issues_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_issues" ADD CONSTRAINT "purchase_order_issues_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_issues" ADD CONSTRAINT "purchase_order_issues_resolved_by_staffs_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."staffs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_order_issues_order_id_idx" ON "purchase_order_issues" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "purchase_order_issues_item_id_idx" ON "purchase_order_issues" USING btree ("purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "purchase_order_issues_status_idx" ON "purchase_order_issues" USING btree ("status");--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_received_quantity_check" CHECK ("purchase_order_items"."received_quantity" >= 0);