import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const ecosystemIndustryValues = [
  'FinTech',
  'AgriTech',
  'HealthTech',
  'EdTech',
  'CleanTech',
  'TransportTech',
] as const

export const ecosystemStatusValues = ['verified', 'pending', 'rejected'] as const

export const sourceFeedTypeValues = ['rss', 'api'] as const

export const techCompanies = pgTable(
  'tech_companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    industry: text('industry').notNull(),
    description: text('description'),
    foundedYear: integer('founded_year'),
    teamSize: integer('team_size'),
    revenueRange: text('revenue_range'),
    impactMetric: text('impact_metric'),
    score: doublePrecision('score').default(0),
    status: text('status').notNull().default('pending'),
    website: text('website'),
    logoUrl: text('logo_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('tech_companies_slug_idx').on(table.slug),
    index('tech_companies_industry_idx').on(table.industry),
    index('tech_companies_status_idx').on(table.status),
    index('tech_companies_score_idx').on(table.score),
  ]
)

export const companyCandidates = pgTable(
  'company_candidates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    industry: text('industry').notNull(),
    description: text('description'),
    foundedYear: integer('founded_year'),
    teamSize: integer('team_size'),
    revenueRange: text('revenue_range'),
    impactMetric: text('impact_metric'),
    score: doublePrecision('score').default(0),
    status: text('status').notNull().default('pending'),
    website: text('website'),
    logoUrl: text('logo_url'),
    confidenceScore: doublePrecision('confidence_score').default(0),
    sourceUrl: text('source_url'),
    sourceType: text('source_type'),
    reviewerNotes: text('reviewer_notes'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('company_candidates_slug_idx').on(table.slug),
    index('company_candidates_status_idx').on(table.status),
    index('company_candidates_confidence_idx').on(table.confidenceScore),
  ]
)

export const companySources = pgTable(
  'company_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => techCompanies.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    sourceType: text('source_type').notNull(),
    attributionScore: doublePrecision('attribution_score').default(0),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('company_sources_company_idx').on(table.companyId),
    index('company_sources_type_idx').on(table.sourceType),
  ]
)

export const sourceFeeds = pgTable(
  'source_feeds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull().unique(),
    feedType: text('feed_type').notNull().default('rss'),
    sectorFilter: text('sector_filter'),
    enabled: boolean('enabled').notNull().default(true),
    lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('source_feeds_type_idx').on(table.feedType),
    index('source_feeds_enabled_idx').on(table.enabled),
  ]
)

export const ingestionRuns = pgTable(
  'ingestion_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    feedId: uuid('feed_id').references(() => sourceFeeds.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('running'),
    itemsFound: integer('items_found').notNull().default(0),
    itemsCreated: integer('items_created').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    errorLog: text('error_log'),
  },
  (table) => [
    index('ingestion_runs_feed_idx').on(table.feedId),
    index('ingestion_runs_status_idx').on(table.status),
    index('ingestion_runs_started_idx').on(table.startedAt),
  ]
)
