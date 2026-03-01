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
} from 'drizzle-orm/pg-core'
import { vector } from 'drizzle-orm/pg-core'

// ─── Regulatory Bodies ─────────────────────────────────────────────────────

export const regulatoryBodies = pgTable('regulatory_bodies', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(), // 'BNR', 'RDB', 'RRA', 'RURA', 'RSB', 'PSF'
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  sectors: text('sectors').array(),
})

// ─── Companies ─────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  rdbNumber: text('rdb_number').unique(),
  tin: text('tin'),
  sector: text('sector').notNull(),
  subSector: text('sub_sector').array(),
  description: text('description'),
  website: text('website'),
  foundedYear: integer('founded_year'),
  hqDistrict: text('hq_district'),
  hqProvince: text('hq_province'),
  employeeRange: text('employee_range'), // '1-10', '11-50', '51-200', '200+'
  stage: text('stage'), // 'startup', 'growth', 'established'
  status: text('status').default('active'), // 'active', 'inactive', 'dissolved'
  licenses: jsonb('licenses'), // [{body, type, status, expires}]
  funding: jsonb('funding'), // [{round, amount, currency, year}]
  leadership: jsonb('leadership'), // [{name, role, linkedin}]
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  dataSources: text('data_sources').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Regulations ────────────────────────────────────────────────────────────

export const regulations = pgTable('regulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  regBodyCode: text('reg_body_code').references(() => regulatoryBodies.code),
  sectorTags: text('sector_tags').array(),
  appliesTo: jsonb('applies_to'), // {biz_types, company_structures}
  summary: text('summary'),
  fullTextUrl: text('full_text_url'),
  publishedAt: date('published_at'),
  effectiveAt: date('effective_at'),
  status: text('status'), // 'active', 'superseded', 'draft'
  supersedesId: uuid('supersedes_id'),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
})

// ─── Compliance Steps ────────────────────────────────────────────────────────

export const complianceSteps = pgTable('compliance_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  plainLanguage: text('plain_language').notNull(),
  regBodyCode: text('reg_body_code').references(() => regulatoryBodies.code),
  regulationId: uuid('regulation_id').references(() => regulations.id),

  // Applicability
  appliesSector: text('applies_sector').array(),
  appliesBizType: text('applies_biz_type').array(), // 'ltd', 'sole_prop', 'ngo', 'branch'
  appliesCustomer: text('applies_customer').array(), // 'b2b', 'b2c', 'both'

  // Step details
  prerequisites: uuid('prerequisites').array(),
  documentsReq: jsonb('documents_req'), // [{name, description, template_url}]
  applyUrl: text('apply_url'),
  applyLocation: text('apply_location'),
  costRwf: integer('cost_rwf'),
  timelineDays: integer('timeline_days'),
  penaltyDescription: text('penalty_description'),

  stepOrder: integer('step_order'),
  isOptional: boolean('is_optional').default(false),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
})

// ─── Knowledge Embeddings (pgvector) ────────────────────────────────────────

export const knowledgeEmbeddings = pgTable(
  'knowledge_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1024 }),

    // Source metadata
    sourceTitle: text('source_title'),
    sourceUrl: text('source_url'),
    sourceDate: date('source_date'),

    // Filtering metadata
    sectorTags: text('sector_tags').array(),
    docType: text('doc_type'), // 'regulation', 'company_profile', 'sector_report', 'guideline'
    regBody: text('reg_body'), // 'BNR', 'RDB', 'RRA', etc.
    complianceStepId: uuid('compliance_step_id').references(
      () => complianceSteps.id
    ),

    isCurrent: boolean('is_current').default(true),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))]
)

// ─── News Items ──────────────────────────────────────────────────────────────

export const newsItems = pgTable('news_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  plainSummary: text('plain_summary'), // AI-generated plain language version
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  sectorTags: text('sector_tags').array(),
  regBodyCode: text('reg_body_code'),
  impactLevel: text('impact_level'), // 'high', 'medium', 'low'
  isReviewed: boolean('is_reviewed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
