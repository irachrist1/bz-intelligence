import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { vector } from 'drizzle-orm/pg-core'
import { tenders } from './public'

// ─── Firm Profiles (per-org, private) ───────────────────────────────────────

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
