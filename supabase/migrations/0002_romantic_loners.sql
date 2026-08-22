ALTER TABLE "customers" ADD COLUMN "walk_in_phone_number" text;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_walk_in_phone_number_unique" UNIQUE("walk_in_phone_number");