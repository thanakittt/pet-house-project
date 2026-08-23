ALTER TABLE "service_variants" RENAME COLUMN "base_price" TO "min_price";--> statement-breakpoint
ALTER TABLE "service_variants" ADD COLUMN "max_price" numeric(8, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_variants" ADD COLUMN "is_starting_price_only" boolean DEFAULT false NOT NULL;