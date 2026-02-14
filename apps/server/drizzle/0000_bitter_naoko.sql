CREATE TABLE "biographies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"source" varchar(20) DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"mode" varchar(20) DEFAULT 'bewohner' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"mood_start" varchar(20),
	"mood_end" varchar(20),
	"summary" text,
	"flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"address" text,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"plan" varchar(20) DEFAULT 'trial' NOT NULL,
	"max_residents" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "facilities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "family_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resident_id" uuid NOT NULL,
	"relationship" varchar(50),
	"consent_given" boolean DEFAULT false NOT NULL,
	"consent_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"mood_detected" varchar(20),
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"display_name" varchar(100),
	"pin" varchar(255),
	"birth_year" integer,
	"gender" varchar(20),
	"address_form" varchar(5) DEFAULT 'du' NOT NULL,
	"language" varchar(10) DEFAULT 'de' NOT NULL,
	"cognitive_level" varchar(20) DEFAULT 'normal' NOT NULL,
	"avatar_name" varchar(50) DEFAULT 'Anni' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"month" date NOT NULL,
	"active_residents" integer DEFAULT 0 NOT NULL,
	"total_conversations" integer DEFAULT 0 NOT NULL,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"api_cost_eur" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(200) NOT NULL,
	"role" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "biographies" ADD CONSTRAINT "biographies_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_stats" ADD CONSTRAINT "usage_stats_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_biographies_unique" ON "biographies" USING btree ("resident_id","category","key");--> statement-breakpoint
CREATE INDEX "idx_biographies_resident" ON "biographies" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_resident" ON "conversations" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_date" ON "conversations" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_family_links_unique" ON "family_links" USING btree ("user_id","resident_id");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_residents_facility" ON "residents" USING btree ("facility_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_usage_stats_unique" ON "usage_stats" USING btree ("facility_id","month");