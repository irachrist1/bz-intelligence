/**
 * Seed script: Rwanda regulatory news items.
 * Run with: npx tsx scripts/seed-news.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env.local before anything else (same pattern as ingest-document.ts)
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {}

import { neon } from '@neondatabase/serverless'

type ImpactLevel = 'high' | 'medium' | 'low'

interface NewsItemInput {
  title: string
  summary: string
  plainSummary: string
  sourceName: string
  sourceUrl: string
  publishedAt: string // ISO timestamp string
  sectorTags: string[]
  regBodyCode: string
  impactLevel: ImpactLevel
  isReviewed: boolean
}

const NEWS_ITEMS: NewsItemInput[] = [
  // ── BNR ──────────────────────────────────────────────────────────────────
  {
    title: 'BNR Issues New Capital Requirements for Mobile Money Operators',
    summary:
      'The National Bank of Rwanda (BNR) has issued Circular No. 02/2025 revising minimum capital requirements for licensed mobile money operators and payment service providers. Operators must now maintain a minimum capital base of RWF 500 million, up from RWF 200 million, with full compliance required by 31 December 2025. Non-compliant operators risk suspension of their operating licences.',
    plainSummary:
      'Mobile money companies in Rwanda must now hold at least RWF 500 million in capital — more than double the previous requirement — or risk losing their licence.',
    sourceName: 'BNR',
    sourceUrl: 'https://www.bnr.rw/news-publications/circulars/',
    publishedAt: '2025-02-14T08:00:00Z',
    sectorTags: ['fintech', 'mobile_money', 'payments'],
    regBodyCode: 'BNR',
    impactLevel: 'high',
    isReviewed: true,
  },
  {
    title: 'BNR Regulation on Digital Lending Platforms Takes Effect March 2025',
    summary:
      'BNR Regulation No. 06/2025 governing digital lending platforms came into force on 1 March 2025. All platforms offering credit products through mobile or web channels are required to register as Digital Credit Providers, submit monthly loan-book reports, and cap annualised interest rates at 24%. Existing platforms have a 90-day grace period to comply.',
    plainSummary:
      'Digital lending apps must now register with BNR, report monthly loan data, and cannot charge more than 24% annual interest.',
    sourceName: 'BNR',
    sourceUrl: 'https://www.bnr.rw/regulations/banking/digital-credit/',
    publishedAt: '2025-03-01T09:00:00Z',
    sectorTags: ['fintech', 'lending', 'digital_credit'],
    regBodyCode: 'BNR',
    impactLevel: 'high',
    isReviewed: true,
  },
  {
    title: 'BNR Publishes Foreign Exchange Management Directive for Fintechs',
    summary:
      'A new BNR directive requires all licensed payment service providers processing cross-border transactions to implement enhanced foreign currency reconciliation and reporting. Providers must submit daily FX settlement reports to BNR using the updated FX Reporting Portal by 15 October 2025. Failure to comply carries fines of up to RWF 50 million per reporting period.',
    plainSummary:
      'Fintechs handling international payments must now submit daily FX reports to BNR through a new portal starting October 2025.',
    sourceName: 'BNR',
    sourceUrl: 'https://www.bnr.rw/regulations/forex/',
    publishedAt: '2025-07-22T10:00:00Z',
    sectorTags: ['fintech', 'payments', 'forex'],
    regBodyCode: 'BNR',
    impactLevel: 'medium',
    isReviewed: true,
  },

  // ── RRA ──────────────────────────────────────────────────────────────────
  {
    title: 'RRA Raises VAT Registration Threshold to RWF 40 Million',
    summary:
      'Rwanda Revenue Authority has raised the annual turnover threshold triggering mandatory VAT registration from RWF 20 million to RWF 40 million, effective 1 January 2025 per amendments to the VAT Law No. 013/2015. Businesses currently registered below the new threshold may apply for voluntary deregistration before 30 June 2025. Businesses exceeding the threshold for the first time must register within 30 days.',
    plainSummary:
      'Businesses with annual revenue below RWF 40 million no longer need to register for VAT — double the old RWF 20 million limit.',
    sourceName: 'Rwanda Revenue Authority',
    sourceUrl: 'https://www.rra.gov.rw/index.php?id=484',
    publishedAt: '2025-01-03T08:00:00Z',
    sectorTags: ['tax', 'vat', 'all_sectors'],
    regBodyCode: 'RRA',
    impactLevel: 'high',
    isReviewed: true,
  },
  {
    title: 'RRA Updates PAYE Bands for Tax Year 2025–2026',
    summary:
      'RRA has revised the Pay As You Earn (PAYE) tax bands effective 1 July 2025. The zero-rate band has been extended to cover monthly income up to RWF 60,000 (from RWF 30,000). The top 30% marginal rate now applies to income above RWF 1,000,000 per month. Employers must update payroll systems by 31 July 2025 and issue revised P9 forms to all employees.',
    plainSummary:
      'PAYE tax bands have been updated — workers earning up to RWF 60,000 per month pay no income tax starting July 2025.',
    sourceName: 'Rwanda Revenue Authority',
    sourceUrl: 'https://www.rra.gov.rw/index.php?id=482',
    publishedAt: '2025-06-15T08:00:00Z',
    sectorTags: ['tax', 'paye', 'payroll', 'all_sectors'],
    regBodyCode: 'RRA',
    impactLevel: 'high',
    isReviewed: true,
  },
  {
    title: 'RRA Launches e-Invoice Mandate for Large Taxpayers',
    summary:
      'Starting 1 September 2025, all taxpayers classified as "Large" by RRA are required to issue electronic invoices through the Electronic Billing Machine (EBM) Version 3 system. Paper invoices will no longer be accepted for VAT input claims from Large Taxpayers. Medium taxpayers are expected to transition by 1 January 2026, with SMEs to follow in a phased rollout.',
    plainSummary:
      'Large businesses in Rwanda must issue all invoices electronically through the updated EBM3 system starting September 2025.',
    sourceName: 'Rwanda Revenue Authority',
    sourceUrl: 'https://www.rra.gov.rw/index.php?id=486',
    publishedAt: '2025-08-01T08:00:00Z',
    sectorTags: ['tax', 'invoicing', 'vat', 'all_sectors'],
    regBodyCode: 'RRA',
    impactLevel: 'medium',
    isReviewed: true,
  },

  // ── RDB ──────────────────────────────────────────────────────────────────
  {
    title: 'RDB Introduces Single Window 2.0 for Business Registration',
    summary:
      'The Rwanda Development Board has launched Single Window 2.0, a redesigned business registration portal, replacing the previous irembo-based registration flow. The updated platform integrates real-time TIN issuance from RRA, RSSB employer registration, and automatic Gazette publication. Registration time for a Private Limited Company is now targeted at under 6 hours. The old portal will be decommissioned on 30 April 2025.',
    plainSummary:
      'Registering a company in Rwanda is now faster with RDB\'s new Single Window 2.0 portal, which handles tax, social security, and gazette publication in one step.',
    sourceName: 'Rwanda Development Board',
    sourceUrl: 'https://www.rdb.rw/services/business-registration/',
    publishedAt: '2025-02-01T08:00:00Z',
    sectorTags: ['registration', 'all_sectors'],
    regBodyCode: 'RDB',
    impactLevel: 'medium',
    isReviewed: true,
  },
  {
    title: 'RDB Revises Minimum Capital Requirements for Foreign-Owned Companies',
    summary:
      'Effective 1 May 2025, RDB requires foreign-owned entities (companies with over 50% foreign shareholding) to demonstrate a minimum paid-up capital of USD 50,000 at the time of incorporation. Evidence of capital introduction via a Rwandan bank must be provided before the Certificate of Incorporation is issued. This replaces the previous requirement of USD 10,000 for most sectors.',
    plainSummary:
      'Foreign-owned companies registering in Rwanda must now bring in at least USD 50,000 in paid-up capital, up from USD 10,000.',
    sourceName: 'Rwanda Development Board',
    sourceUrl: 'https://www.rdb.rw/doing-business/foreign-investment/',
    publishedAt: '2025-04-10T08:00:00Z',
    sectorTags: ['registration', 'foreign_investment', 'all_sectors'],
    regBodyCode: 'RDB',
    impactLevel: 'high',
    isReviewed: true,
  },

  // ── RISA / Data Protection ─────────────────────────────────────────────
  {
    title: 'RISA Begins Enforcement of Data Protection Law — First Fines Issued',
    summary:
      'Rwanda Information Society Authority (RISA) issued its first enforcement notices under Law No. 058/2021 on Personal Data Protection in March 2025, targeting three companies that failed to complete mandatory data controller registration. Fines range from RWF 5 million to RWF 50 million depending on the volume of data processed. RISA has announced it will conduct sector-wide audits in fintech, health, and education throughout Q2 and Q3 2025.',
    plainSummary:
      'RISA has started fining companies that haven\'t registered as data controllers — fines can reach RWF 50 million.',
    sourceName: 'RISA',
    sourceUrl: 'https://risa.gov.rw/data-protection',
    publishedAt: '2025-03-18T10:00:00Z',
    sectorTags: ['data_protection', 'fintech', 'health', 'education', 'all_sectors'],
    regBodyCode: 'RISA',
    impactLevel: 'high',
    isReviewed: true,
  },
  {
    title: 'RISA Releases Data Localisation Guidelines for Critical Sectors',
    summary:
      'RISA published implementation guidelines for data localisation obligations affecting operators in finance, health, and government services. Companies in these sectors must store primary copies of Rwandan citizens\' personal data on servers physically located within Rwanda by 31 December 2025. Cloud providers may be used for backup, provided the primary copy remains in-country. Operators must certify compliance and submit an annual Data Residency Attestation to RISA.',
    plainSummary:
      'Fintech, health, and government-adjacent companies must keep Rwandan personal data stored on servers inside Rwanda by end of 2025.',
    sourceName: 'RISA',
    sourceUrl: 'https://risa.gov.rw/data-localisation-guidelines',
    publishedAt: '2025-05-20T09:00:00Z',
    sectorTags: ['data_protection', 'fintech', 'health', 'cloud'],
    regBodyCode: 'RISA',
    impactLevel: 'high',
    isReviewed: true,
  },

  // ── RURA ──────────────────────────────────────────────────────────────────
  {
    title: 'RURA Introduces Class Licence for Small ICT Service Providers',
    summary:
      'Rwanda Utilities Regulatory Authority (RURA) introduced a new Class Licence for ICT service providers with annual revenue under RWF 100 million, effective 1 April 2025. The Class Licence replaces the previous Individual Licence for small operators, significantly reducing the application fee to RWF 200,000 and annual renewal to RWF 50,000. Class Licence holders do not require prior RURA approval for network changes below a defined threshold.',
    plainSummary:
      'Small ICT companies earning under RWF 100 million/year now qualify for a cheaper Class Licence from RURA, cutting fees by over 80%.',
    sourceName: 'RURA',
    sourceUrl: 'https://www.rura.rw/licensing/ict/',
    publishedAt: '2025-04-01T08:00:00Z',
    sectorTags: ['ict', 'telecoms', 'licensing'],
    regBodyCode: 'RURA',
    impactLevel: 'medium',
    isReviewed: true,
  },
  {
    title: 'RURA Updates Net Neutrality Rules for Internet Service Providers',
    summary:
      'RURA issued updated Net Neutrality Guidelines in September 2025, prohibiting licensed ISPs from throttling or blocking specific applications or services without RURA authorisation. ISPs must publish transparent traffic management policies on their websites. Violations carry fines of up to 2% of annual gross revenue. ISPs must implement required technical disclosures within 180 days of the guidelines\' effective date.',
    plainSummary:
      'Internet providers in Rwanda cannot slow down or block specific apps — RURA can fine violators up to 2% of their revenue.',
    sourceName: 'RURA',
    sourceUrl: 'https://www.rura.rw/regulations/net-neutrality/',
    publishedAt: '2025-09-10T09:00:00Z',
    sectorTags: ['ict', 'telecoms', 'internet'],
    regBodyCode: 'RURA',
    impactLevel: 'low',
    isReviewed: true,
  },

  // ── RSSB ──────────────────────────────────────────────────────────────────
  {
    title: 'RSSB Raises Pension Contribution Rate to 8% Employer / 5% Employee',
    summary:
      'The Rwanda Social Security Board (RSSB) has revised mandatory pension contribution rates effective 1 January 2026 under updated Social Security Law amendments. The employer contribution rises from 5% to 8% of gross salary, and the employee contribution rises from 3% to 5%. Both employer and employee contributions must be declared and remitted by the 15th of the following month via RSSB\'s e-Portal.',
    plainSummary:
      'From January 2026, employers must pay 8% and employees 5% of salary into the Rwanda pension scheme — increases from 5% and 3% respectively.',
    sourceName: 'RSSB',
    sourceUrl: 'https://www.rssb.rw/pension-contribution-rates/',
    publishedAt: '2025-10-15T08:00:00Z',
    sectorTags: ['payroll', 'pension', 'all_sectors'],
    regBodyCode: 'RSSB',
    impactLevel: 'high',
    isReviewed: true,
  },

  // ── Labour Law ────────────────────────────────────────────────────────────
  {
    title: 'Rwanda Labour Law Amendment Raises Minimum Wage to RWF 30,000/Month',
    summary:
      'The revised Labour Law (Law No. 66/2025) gazetted in November 2025 introduces Rwanda\'s first statutory minimum wage at RWF 30,000 per month for all private sector employees. The law also extends mandatory paid annual leave from 15 to 18 working days and requires employers with 10 or more employees to maintain a written employment policy accessible to all staff. Compliance is required from 1 January 2026.',
    plainSummary:
      'Rwanda now has a minimum wage of RWF 30,000 per month, and workers get 18 days of paid leave per year instead of 15.',
    sourceName: 'Ministry of Public Service and Labour',
    sourceUrl: 'https://www.mifotra.gov.rw/labour-law-2025',
    publishedAt: '2025-11-05T08:00:00Z',
    sectorTags: ['labour', 'payroll', 'all_sectors'],
    regBodyCode: 'RSSB',
    impactLevel: 'high',
    isReviewed: true,
  },

  // ── RDB — additional ──────────────────────────────────────────────────────
  {
    title: 'RDB Launches SME Certification Programme for Government Procurement',
    summary:
      'RDB introduced a national SME Certification Register in January 2026, enabling qualifying small and medium enterprises to access a preferential 30% reservation on public procurement contracts below RWF 500 million. To qualify, businesses must be registered in Rwanda, hold a valid TIN, have been operational for at least 12 months, and have at least 60% Rwandan ownership. Applications are processed via the RDB Investment Portal.',
    plainSummary:
      'Small businesses in Rwanda can now get certified by RDB to access reserved government contracts — 30% of smaller tenders must go to certified SMEs.',
    sourceName: 'Rwanda Development Board',
    sourceUrl: 'https://www.rdb.rw/sme-certification/',
    publishedAt: '2026-01-20T08:00:00Z',
    sectorTags: ['procurement', 'sme', 'all_sectors'],
    regBodyCode: 'RDB',
    impactLevel: 'medium',
    isReviewed: true,
  },
  {
    title: 'RSSB Launches Occupational Health Insurance Scheme for Informal Sector',
    summary:
      'RSSB launched a new voluntary Occupational Health Insurance (OHI) scheme targeting informal sector workers and self-employed individuals in February 2026. Participants pay a flat monthly contribution of RWF 3,000 and receive coverage for workplace injury, chronic illness, and up to 60% salary replacement during extended sick leave. Employers with fewer than 5 employees who enrol all workers receive a 20% subsidy on contributions for the first two years.',
    plainSummary:
      'Self-employed workers and small businesses in Rwanda can now access RSSB health and injury insurance for RWF 3,000 per month.',
    sourceName: 'RSSB',
    sourceUrl: 'https://www.rssb.rw/occupational-health-scheme/',
    publishedAt: '2026-02-10T08:00:00Z',
    sectorTags: ['health_insurance', 'informal_sector', 'sme', 'all_sectors'],
    regBodyCode: 'RSSB',
    impactLevel: 'medium',
    isReviewed: true,
  },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not set. Copy .env.local.example to .env.local and fill in the value.')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  console.log(`Seeding ${NEWS_ITEMS.length} news items...`)

  let inserted = 0
  for (const item of NEWS_ITEMS) {
    await sql`
      INSERT INTO news_items
        (title, summary, plain_summary, source_name, source_url, published_at,
         sector_tags, reg_body_code, impact_level, is_reviewed)
      VALUES
        (${item.title}, ${item.summary}, ${item.plainSummary}, ${item.sourceName},
         ${item.sourceUrl}, ${item.publishedAt}::timestamptz,
         ${item.sectorTags}, ${item.regBodyCode}, ${item.impactLevel}, ${item.isReviewed})
      ON CONFLICT DO NOTHING
    `
    inserted++
    console.log(`  [${inserted}/${NEWS_ITEMS.length}] ${item.regBodyCode} — ${item.title.slice(0, 60)}...`)
  }

  console.log(`\nDone. ${inserted} news items seeded.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message || err)
  process.exit(1)
})
