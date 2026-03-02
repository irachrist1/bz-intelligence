import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  date,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { vector } from 'drizzle-orm/pg-core'
import { complianceSteps, tenders } from './public'

// ─── Business Profiles (per-org, private) ───────────────────────────────────

export const businessProfiles = pgTable('business_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),
  userId: text('user_id').notNull(),

  // Business DNA
  bizName: text('biz_name'),
  bizType: text('biz_type'), // 'ltd', 'sole_prop', 'ngo', 'branch', 'cooperative'
  sector: text('sector'),
  subSector: text('sub_sector').array(),
  customerType: text('customer_type'), // 'b2b', 'b2c', 'b2g', 'all'
  currentStatus: text('current_status'), // 'idea', 'registered', 'operating'

  // Compliance trigger flags — used for personalized roadmap filtering
  handlesMoney: boolean('handles_money').default(false),   // payments, lending, savings → BNR
  collectsData: boolean('collects_data').default(false),   // personal data → RISA registration
  foreignOwnership: boolean('foreign_ownership').default(false), // foreign shareholders → extra RDB/BNR
  operatesProvince: boolean('operates_province').default(false), // outside Kigali → local permits
  employeeRange: text('employee_range'), // '1' | '2-10' | '11-50' | '50+' → PAYE/RSSB thresholds

  // Legacy / optional
  transactionType: text('transaction_type').array(), // lending | payments | savings | insurance
  revenueModel: text('revenue_model'),
  employeeTarget: integer('employee_target'),
  hqDistrict: text('hq_district'),
  tin: text('tin'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Firm Profiles (phase 0 additive) ───────────────────────────────────────

export const firmProfiles = pgTable(
  'firm_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull().unique(),
    firmName: text('firm_name'),
    legalEntityType: text('legal_entity_type'),
    serviceCategories: text('service_categories').array(),
    sectors: text('sectors').array(),
    contractSizeMinUsd: integer('contract_size_min_usd'),
    contractSizeMaxUsd: integer('contract_size_max_usd'),
    fundingSources: text('funding_sources').array(),
    countries: text('countries').array(),
    languages: text('languages').array(),
    keywordsInclude: text('keywords_include').array(),
    keywordsExclude: text('keywords_exclude').array(),
    embedding: vector('embedding', { dimensions: 1024 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('firm_profiles_org_idx').on(table.orgId),
    index('firm_profiles_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ]
)

// ─── Org Documents ───────────────────────────────────────────────────────────

export const orgDocuments = pgTable('org_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),
  filename: text('filename').notNull(),
  storagePath: text('storage_path').notNull(), // R2 key: {orgId}/{docId}/{filename}
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  docCategory: text('doc_category'), // 'incorporation', 'license', 'tax_cert', 'permit'
  extractedData: jsonb('extracted_data'), // AI-extracted key fields
  complianceStepId: uuid('compliance_step_id').references(
    () => complianceSteps.id
  ),
  expiresAt: date('expires_at'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
})

// ─── Compliance History (step tracking per org) ──────────────────────────────

export const complianceHistory = pgTable('compliance_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),
  stepId: uuid('step_id').references(() => complianceSteps.id),
  status: text('status'), // 'pending', 'in_progress', 'completed', 'skipped'
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  docId: uuid('doc_id').references(() => orgDocuments.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── News Reads (tracks which articles a user has read) ─────────────────────

export const newsReads = pgTable('news_reads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  newsItemId: uuid('news_item_id').notNull(), // references newsItems.id in public schema
  readAt: timestamp('read_at', { withTimezone: true }).defaultNow(),
})

// ─── Tender Saves / Pipeline Tracking ───────────────────────────────────────

export const tenderSaves = pgTable(
  'tender_saves',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    tenderId: uuid('tender_id').references(() => tenders.id).notNull(),
    stage: text('stage').default('watching'), // 'watching' | 'go' | 'no_go' | 'in_prep' | 'submitted' | 'won' | 'lost'
    assignedTo: text('assigned_to'),
    notes: text('notes'),
    winLossReason: text('win_loss_reason'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    resultAt: timestamp('result_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('tender_saves_org_tender_uniq').on(table.orgId, table.tenderId),
    index('tender_saves_org_idx').on(table.orgId),
  ]
)

// ─── Alert Preferences ───────────────────────────────────────────────────────

export const alertPreferences = pgTable(
  'alert_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    userId: text('user_id').notNull(),
    newMatchFrequency: text('new_match_frequency').default('realtime'), // 'realtime' | 'daily' | 'weekly' | 'off'
    deadline7day: boolean('deadline_7day').default(true),
    deadline48hr: boolean('deadline_48hr').default(true),
    tenderUpdate: boolean('tender_update').default(true),
    weeklyDigest: boolean('weekly_digest').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('alert_preferences_org_user_uniq').on(table.orgId, table.userId),
    index('alert_pref_org_user_idx').on(table.orgId, table.userId),
  ]
)

// ─── Chat Sessions ───────────────────────────────────────────────────────────

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),
  userId: text('user_id').notNull(),
  mode: text('mode').notNull(), // 'compliance' | 'intelligence'
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => chatSessions.id).notNull(),
  orgId: text('org_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  citations: jsonb('citations'), // [{title, url, date, regBody}]
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
