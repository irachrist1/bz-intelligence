import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

// ─── Tenders ─────────────────────────────────────────────────────────────────

export const tenders = pgTable(
  'tenders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull(), // 'rppa' | 'world_bank' | 'ungm' | 'adb' | 'usaid' | 'eu'
    sourceId: text('source_id'),
    title: text('title').notNull(),
    issuingOrg: text('issuing_org').notNull(),
    tenderType: text('tender_type'), // 'rfp' | 'rfq' | 'eoi' | 'framework' | 'direct'
    fundingSource: text('funding_source'), // 'gor' | 'world_bank' | 'adb' | 'un' | 'eu' | 'usaid'
    categoryTags: text('category_tags').array(),
    description: text('description'),
    aiSummary: text('ai_summary'),
    eligibilityNotes: text('eligibility_notes'),
    estimatedValueUsd: integer('estimated_value_usd'),
    estimatedValueRwf: integer('estimated_value_rwf'),
    currency: text('currency'),
    documents: jsonb('documents'), // [{name, url, type}]
    deadlineSubmission: timestamp('deadline_submission', { withTimezone: true }),
    deadlineClarification: timestamp('deadline_clarification', { withTimezone: true }),
    datePosted: timestamp('date_posted', { withTimezone: true }),
    awardDate: timestamp('award_date', { withTimezone: true }),
    contactInfo: jsonb('contact_info'),
    sourceUrl: text('source_url').notNull(),
    status: text('status').default('open'), // 'open' | 'closed' | 'awarded' | 'cancelled'
    reviewStatus: text('review_status').default('pending'), // 'pending' | 'approved' | 'rejected'
    country: text('country').default('rw'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('tenders_source_idx').on(table.source),
    index('tenders_deadline_idx').on(table.deadlineSubmission),
    index('tenders_posted_idx').on(table.datePosted),
    index('tenders_review_status_idx').on(table.reviewStatus),
    index('tenders_status_idx').on(table.status),
  ]
)

// ─── Tender Sources ──────────────────────────────────────────────────────────

export const tenderSources = pgTable('tender_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  url: text('url'),
  scraperType: text('scraper_type'), // 'html' | 'api' | 'pdf' | 'manual'
  scraperStatus: text('scraper_status').default('manual'), // 'manual' | 'active' | 'failing' | 'paused'
  lastSuccessfulRun: timestamp('last_successful_run', { withTimezone: true }),
  country: text('country').default('rw'),
  active: boolean('active').default(true),
})
