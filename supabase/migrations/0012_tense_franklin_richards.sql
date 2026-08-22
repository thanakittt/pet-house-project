CREATE TYPE "public"."slip_verification_status" AS ENUM('VERIFIED', 'REJECTED', 'ERROR');--> statement-breakpoint
CREATE TABLE "payment_slip_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"payment_id" uuid,
	"provider" text DEFAULT 'THUNDER' NOT NULL,
	"status" "slip_verification_status" NOT NULL,
	"slip_image_url" text NOT NULL,
	"remark" text,
	"trans_ref" text,
	"amount_in_slip" numeric(8, 2),
	"amount_in_order" numeric(8, 2),
	"is_amount_matched" boolean,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"matched_account" jsonb,
	"raw_slip" jsonb,
	"provider_response" jsonb,
	"provider_error_code" text,
	"provider_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "payment_slip_verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_slip_verifications" ADD CONSTRAINT "payment_slip_verifications_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_slip_verifications" ADD CONSTRAINT "payment_slip_verifications_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_slip_verifications_appointment_id_idx" ON "payment_slip_verifications" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "payment_slip_verifications_payment_id_idx" ON "payment_slip_verifications" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_slip_verifications_trans_ref_idx" ON "payment_slip_verifications" USING btree ("trans_ref");