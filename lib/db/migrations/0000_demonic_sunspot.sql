CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"rdb_number" text,
	"tin" text,
	"sector" text NOT NULL,
	"sub_sector" text[],
	"description" text,
	"website" text,
	"founded_year" integer,
	"hq_district" text,
	"hq_province" text,
	"employee_range" text,
	"stage" text,
	"status" text DEFAULT 'active',
	"licenses" jsonb,
	"funding" jsonb,
	"leadership" jsonb,
	"last_verified_at" timestamp with time zone,
	"data_sources" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "companies_rdb_number_unique" UNIQUE("rdb_number")
);
--> statement-breakpoint
CREATE TABLE "compliance_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"plain_language" text NOT NULL,
	"reg_body_code" text,
	"regulation_id" uuid,
	"applies_sector" text[],
	"applies_biz_type" text[],
	"applies_customer" text[],
	"prerequisites" uuid[],
	"documents_req" jsonb,
	"apply_url" text,
	"apply_location" text,
	"cost_rwf" integer,
	"timeline_days" integer,
	"penalty_description" text,
	"step_order" integer,
	"is_optional" boolean DEFAULT false,
	"last_verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "knowledge_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024),
	"source_title" text,
	"source_url" text,
	"source_date" date,
	"sector_tags" text[],
	"doc_type" text,
	"reg_body" text,
	"compliance_step_id" uuid,
	"is_current" boolean DEFAULT true,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"plain_summary" text,
	"source_url" text,
	"source_name" text,
	"published_at" timestamp with time zone,
	"sector_tags" text[],
	"reg_body_code" text,
	"impact_level" text,
	"is_reviewed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"reg_body_code" text,
	"sector_tags" text[],
	"applies_to" jsonb,
	"summary" text,
	"full_text_url" text,
	"published_at" date,
	"effective_at" date,
	"status" text,
	"supersedes_id" uuid,
	"last_verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "regulatory_bodies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"sectors" text[],
	CONSTRAINT "regulatory_bodies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tender_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"scraper_type" text,
	"scraper_status" text DEFAULT 'manual',
	"last_successful_run" timestamp with time zone,
	"country" text DEFAULT 'rw',
	"active" boolean DEFAULT true,
	CONSTRAINT "tender_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"source_id" text,
	"title" text NOT NULL,
	"issuing_org" text NOT NULL,
	"tender_type" text,
	"funding_source" text,
	"category_tags" text[],
	"description" text,
	"ai_summary" text,
	"eligibility_notes" text,
	"estimated_value_usd" integer,
	"estimated_value_rwf" integer,
	"currency" text,
	"documents" jsonb,
	"deadline_submission" timestamp with time zone,
	"deadline_clarification" timestamp with time zone,
	"date_posted" timestamp with time zone,
	"award_date" timestamp with time zone,
	"contact_info" jsonb,
	"source_url" text NOT NULL,
	"status" text DEFAULT 'open',
	"review_status" text DEFAULT 'pending',
	"country" text DEFAULT 'rw',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alert_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"new_match_frequency" text DEFAULT 'realtime',
	"deadline_7day" boolean DEFAULT true,
	"deadline_48hr" boolean DEFAULT true,
	"tender_update" boolean DEFAULT true,
	"weekly_digest" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"biz_name" text,
	"biz_type" text,
	"sector" text,
	"sub_sector" text[],
	"customer_type" text,
	"current_status" text,
	"handles_money" boolean DEFAULT false,
	"collects_data" boolean DEFAULT false,
	"foreign_ownership" boolean DEFAULT false,
	"operates_province" boolean DEFAULT false,
	"employee_range" text,
	"transaction_type" text[],
	"revenue_model" text,
	"employee_target" integer,
	"hq_district" text,
	"tin" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"org_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compliance_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"step_id" uuid,
	"status" text,
	"completed_at" timestamp with time zone,
	"notes" text,
	"doc_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "firm_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"firm_name" text,
	"legal_entity_type" text,
	"service_categories" text[],
	"sectors" text[],
	"contract_size_min_usd" integer,
	"contract_size_max_usd" integer,
	"funding_sources" text[],
	"countries" text[],
	"languages" text[],
	"keywords_include" text[],
	"keywords_exclude" text[],
	"embedding" vector(1024),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "firm_profiles_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "news_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"news_item_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"doc_category" text,
	"extracted_data" jsonb,
	"compliance_step_id" uuid,
	"expires_at" date,
	"uploaded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tender_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"tender_id" uuid NOT NULL,
	"stage" text DEFAULT 'watching',
	"assigned_to" text,
	"notes" text,
	"win_loss_reason" text,
	"submitted_at" timestamp with time zone,
	"result_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"industry" text NOT NULL,
	"description" text,
	"founded_year" integer,
	"team_size" integer,
	"revenue_range" text,
	"impact_metric" text,
	"score" double precision DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"website" text,
	"logo_url" text,
	"confidence_score" double precision DEFAULT 0,
	"source_url" text,
	"source_type" text,
	"reviewer_notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"url" text NOT NULL,
	"source_type" text NOT NULL,
	"attribution_score" double precision DEFAULT 0,
	"fetched_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid,
	"status" text DEFAULT 'running' NOT NULL,
	"items_found" integer DEFAULT 0 NOT NULL,
	"items_created" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"error_log" text
);
--> statement-breakpoint
CREATE TABLE "source_feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"feed_type" text DEFAULT 'rss' NOT NULL,
	"sector_filter" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "source_feeds_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "tech_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"industry" text NOT NULL,
	"description" text,
	"founded_year" integer,
	"team_size" integer,
	"revenue_range" text,
	"impact_metric" text,
	"score" double precision DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"website" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tech_companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "compliance_steps" ADD CONSTRAINT "compliance_steps_reg_body_code_regulatory_bodies_code_fk" FOREIGN KEY ("reg_body_code") REFERENCES "public"."regulatory_bodies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_steps" ADD CONSTRAINT "compliance_steps_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_embeddings" ADD CONSTRAINT "knowledge_embeddings_compliance_step_id_compliance_steps_id_fk" FOREIGN KEY ("compliance_step_id") REFERENCES "public"."compliance_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_reg_body_code_regulatory_bodies_code_fk" FOREIGN KEY ("reg_body_code") REFERENCES "public"."regulatory_bodies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_history" ADD CONSTRAINT "compliance_history_step_id_compliance_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."compliance_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_history" ADD CONSTRAINT "compliance_history_doc_id_org_documents_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."org_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_documents" ADD CONSTRAINT "org_documents_compliance_step_id_compliance_steps_id_fk" FOREIGN KEY ("compliance_step_id") REFERENCES "public"."compliance_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_saves" ADD CONSTRAINT "tender_saves_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_sources" ADD CONSTRAINT "company_sources_company_id_tech_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."tech_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_feed_id_source_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."source_feeds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embedding_idx" ON "knowledge_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "tenders_source_idx" ON "tenders" USING btree ("source");--> statement-breakpoint
CREATE INDEX "tenders_deadline_idx" ON "tenders" USING btree ("deadline_submission");--> statement-breakpoint
CREATE INDEX "tenders_posted_idx" ON "tenders" USING btree ("date_posted");--> statement-breakpoint
CREATE INDEX "tenders_review_status_idx" ON "tenders" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "tenders_status_idx" ON "tenders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "alert_preferences_org_user_uniq" ON "alert_preferences" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "alert_pref_org_user_idx" ON "alert_preferences" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "firm_profiles_org_idx" ON "firm_profiles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "firm_profiles_embedding_idx" ON "firm_profiles" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tender_saves_org_tender_uniq" ON "tender_saves" USING btree ("org_id","tender_id");--> statement-breakpoint
CREATE INDEX "tender_saves_org_idx" ON "tender_saves" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "company_candidates_slug_idx" ON "company_candidates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "company_candidates_status_idx" ON "company_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "company_candidates_confidence_idx" ON "company_candidates" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "company_sources_company_idx" ON "company_sources" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_sources_type_idx" ON "company_sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "ingestion_runs_feed_idx" ON "ingestion_runs" USING btree ("feed_id");--> statement-breakpoint
CREATE INDEX "ingestion_runs_status_idx" ON "ingestion_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ingestion_runs_started_idx" ON "ingestion_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "source_feeds_type_idx" ON "source_feeds" USING btree ("feed_type");--> statement-breakpoint
CREATE INDEX "source_feeds_enabled_idx" ON "source_feeds" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "tech_companies_slug_idx" ON "tech_companies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tech_companies_industry_idx" ON "tech_companies" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "tech_companies_status_idx" ON "tech_companies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tech_companies_score_idx" ON "tech_companies" USING btree ("score");