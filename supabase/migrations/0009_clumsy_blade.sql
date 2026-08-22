ALTER TABLE "transactions" DROP CONSTRAINT "transactions_source_exclusivity_check";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_appointment_id_appointments_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_purchase_order_id_purchase_orders_id_fk";
--> statement-breakpoint
DROP INDEX "transactions_appointment_id_unique_idx";--> statement-breakpoint
DROP INDEX "transactions_purchase_order_id_unique_idx";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "appointment_id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "purchase_order_id";