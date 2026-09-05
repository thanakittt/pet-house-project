ALTER TABLE "purchase_orders" ADD COLUMN "vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "vendor_name" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "vendor_address" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "vendor_phone" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "vendor_tax_id" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders" USING btree ("vendor_id");