ALTER TABLE "business_rules"
  ADD COLUMN "deposit_amount" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "appointments"
  ADD COLUMN "deposit_amount" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "business_rules"
  ADD CONSTRAINT "business_rules_deposit_amount_check"
  CHECK ("deposit_amount" BETWEEN 0 AND 100000);
--> statement-breakpoint
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_deposit_amount_check"
  CHECK ("deposit_amount" BETWEEN 0 AND 100000);
