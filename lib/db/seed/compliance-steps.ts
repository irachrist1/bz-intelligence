import { db } from '@/lib/db'
import { complianceSteps } from '@/lib/db/schema'

const STEPS = [
  // ─── General (all businesses) ─────────────────────────────────────────────
  {
    title: 'Register your company with RDB',
    description:
      'All businesses operating in Rwanda must be registered with the Rwanda Development Board (RDB). This creates your legal entity and assigns you a Business Registration Number (BRN). Registration can be done online via the RDB portal in 1–3 business days.',
    plainLanguage: 'Register your company with the Rwanda Development Board to make it a legal entity.',
    regBodyCode: 'RDB',
    appliesSector: [] as string[],
    appliesBizType: ['ltd', 'sole_prop', 'branch', 'cooperative'],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Notarized memorandum and articles of association (for Ltd)' },
      { name: 'National ID or passport of all shareholders/directors' },
      { name: 'Proof of registered office address' },
      { name: 'Application form (online via RDB portal)' },
    ],
    applyUrl: 'https://org.rdb.rw',
    applyLocation: 'Online (org.rdb.rw) or RDB one-stop center, Kigali',
    costRwf: 0,
    timelineDays: 3,
    penaltyDescription: 'Operating without registration is illegal and subject to fines and closure.',
    stepOrder: 1,
    isOptional: false,
  },
  {
    title: 'Obtain your Tax Identification Number (TIN)',
    description:
      'Every business entity must register with the Rwanda Revenue Authority (RRA) to receive a TIN. This is required for all tax obligations including PAYE, corporate tax, VAT, and withholding tax. TIN registration is automatic upon RDB registration for companies.',
    plainLanguage: 'Get your Tax ID (TIN) from the Rwanda Revenue Authority — required for all tax filings.',
    regBodyCode: 'RRA',
    appliesSector: [] as string[],
    appliesBizType: ['ltd', 'sole_prop', 'ngo', 'branch', 'cooperative'],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Certificate of incorporation or registration' },
      { name: 'National ID of directors' },
      { name: 'Application form (RRA eTax portal)' },
    ],
    applyUrl: 'https://www.rra.gov.rw/index.php?id=17',
    applyLocation: 'Online via RRA eTax portal or any RRA office',
    costRwf: 0,
    timelineDays: 1,
    penaltyDescription: 'Tax filing without a TIN is impossible; penalties apply for late registration.',
    stepOrder: 2,
    isOptional: false,
  },
  {
    title: 'Register for PAYE (if you have employees)',
    description:
      'If your business employs staff, you must register for Pay As You Earn (PAYE) with the Rwanda Revenue Authority. PAYE must be deducted from employee salaries and remitted to RRA monthly.',
    plainLanguage: 'Register for PAYE with RRA if you plan to hire employees.',
    regBodyCode: 'RRA',
    appliesSector: [] as string[],
    appliesBizType: ['ltd', 'sole_prop', 'ngo', 'branch', 'cooperative'],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'TIN registration certificate' },
      { name: 'List of employees with their TINs' },
    ],
    applyUrl: 'https://etax.rra.gov.rw',
    applyLocation: 'Online via RRA eTax portal',
    costRwf: 0,
    timelineDays: 1,
    penaltyDescription: '10% penalty on unpaid PAYE plus 1.5% interest per month.',
    stepOrder: 3,
    isOptional: false,
  },
  {
    title: 'Register employees with RSSB',
    description:
      'All employers must register their employees with the Rwanda Social Security Board (RSSB) for pension and mandatory community health insurance (CBHI). Contributions are shared between employer and employee.',
    plainLanguage: 'Register your employees with the Rwanda Social Security Board for pension and health insurance.',
    regBodyCode: 'RSSB',
    appliesSector: [] as string[],
    appliesBizType: ['ltd', 'sole_prop', 'ngo', 'branch', 'cooperative'],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Employee national IDs or passports' },
      { name: 'Company registration certificate' },
      { name: 'Employee employment contracts' },
    ],
    applyUrl: 'https://www.rssb.rw/eservices',
    applyLocation: 'Online via RSSB portal or RSSB offices',
    costRwf: 0,
    timelineDays: 3,
    penaltyDescription: 'Failure to register employees is an offense under the Labor Code.',
    stepOrder: 4,
    isOptional: false,
  },
  {
    title: 'Register for VAT (if turnover exceeds RWF 20M/year)',
    description:
      'Businesses with annual turnover exceeding RWF 20,000,000 (approx. $14,000 USD) must register for Value Added Tax (VAT) with the Rwanda Revenue Authority. VAT is charged at 18% on taxable supplies and filed monthly.',
    plainLanguage: 'Register for VAT with RRA once your annual revenue exceeds RWF 20 million.',
    regBodyCode: 'RRA',
    appliesSector: [] as string[],
    appliesBizType: ['ltd', 'sole_prop', 'branch'],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'TIN certificate' },
      { name: 'Evidence of turnover (bank statements, invoices)' },
    ],
    applyUrl: 'https://etax.rra.gov.rw',
    applyLocation: 'Online via RRA eTax portal',
    costRwf: 0,
    timelineDays: 5,
    penaltyDescription: '50% penalty of unpaid VAT for late registration. 20% penalty on assessment.',
    stepOrder: 5,
    isOptional: false,
  },

  // ─── Fintech specific ──────────────────────────────────────────────────────
  {
    title: 'Obtain a Payment Service Provider (PSP) License from BNR',
    description:
      'Any company providing payment services (mobile money, digital wallets, payment aggregation, merchant payments) in Rwanda must obtain a PSP license from the National Bank of Rwanda (BNR). This is mandatory before launching any payment product.',
    plainLanguage: 'Get a Payment Service Provider license from BNR before launching any payment product.',
    regBodyCode: 'BNR',
    appliesSector: ['fintech'],
    appliesBizType: [] as string[],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Certificate of incorporation' },
      { name: 'Audited financial statements (last 3 years if existing, or projections)' },
      { name: 'Business plan and financial projections' },
      { name: 'AML/CFT policy documentation' },
      { name: 'IT security assessment report' },
      { name: 'Background checks on shareholders and directors' },
      { name: 'Minimum capital proof (BNR requirement varies by license category)' },
    ],
    applyUrl: 'https://www.bnr.rw/financial-stability/payment-system-oversight/',
    applyLocation: 'National Bank of Rwanda, KN 6 Ave, Kigali',
    costRwf: 500000,
    timelineDays: 90,
    penaltyDescription: 'Providing payment services without a license is a criminal offense under BNR regulations.',
    stepOrder: 6,
    isOptional: false,
  },
  {
    title: 'Obtain a Microfinance Institution (MFI) License from BNR',
    description:
      'Companies providing credit/lending services to individuals or small businesses must obtain an MFI license from BNR. This applies to digital lending apps, BNPL services, and traditional microfinance operations.',
    plainLanguage: 'Get a Microfinance Institution license from BNR if you are providing loans or credit products.',
    regBodyCode: 'BNR',
    appliesSector: ['fintech'],
    appliesBizType: [] as string[],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Certificate of incorporation' },
      { name: 'Credit policy and risk management framework' },
      { name: 'Minimum capital evidence (varies by tier)' },
      { name: 'Business plan with lending projections' },
      { name: 'Consumer protection policy' },
      { name: 'IT systems documentation' },
    ],
    applyUrl: 'https://www.bnr.rw',
    applyLocation: 'National Bank of Rwanda, KN 6 Ave, Kigali',
    costRwf: 300000,
    timelineDays: 120,
    penaltyDescription: 'Unlicensed lending is illegal and subject to criminal penalties.',
    stepOrder: 7,
    isOptional: false,
  },

  // ─── ICT specific ──────────────────────────────────────────────────────────
  {
    title: 'Obtain ICT service authorization from RURA',
    description:
      'Companies providing ICT services (internet, VoIP, value-added services) in Rwanda must obtain the relevant authorization from RURA. Software companies may be exempt; telecom/ISP operators must be licensed.',
    plainLanguage: 'Check if your ICT service requires authorization from RURA (Rwanda Utilities Regulatory Authority).',
    regBodyCode: 'RURA',
    appliesSector: ['ict'],
    appliesBizType: [] as string[],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Company registration certificate' },
      { name: 'Technical description of services' },
      { name: 'Network diagram (for connectivity providers)' },
    ],
    applyUrl: 'https://www.rura.rw/index.php/services-a-licensing',
    applyLocation: 'RURA offices, Kigali',
    costRwf: 200000,
    timelineDays: 60,
    penaltyDescription: 'Operating ICT services without authorization: fine up to RWF 5 million.',
    stepOrder: 8,
    isOptional: false,
  },

  // ─── Foreign ownership / foreign directors ────────────────────────────────
  {
    title: 'Declare foreign shareholders and directors with RDB',
    description:
      'Companies with foreign shareholders or directors must submit additional documentation to RDB at registration and on an ongoing basis. This includes a notarized copy of the foreign national\'s passport, proof of legal entry or residency, and shareholder agreements that comply with Rwanda\'s foreign investment regulations. Foreign-owned companies must also register with the Rwanda Investment Promotion Agency (RIPA) to access investment protections.',
    plainLanguage:
      'If your company has foreign shareholders or directors, you must file extra documents with RDB and register with RIPA for investment protections.',
    regBodyCode: 'RDB',
    appliesSector: [] as string[],
    appliesBizType: ['foreign'] as string[], // virtual flag: applies when foreignOwnership = true
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Notarized passport copies for all foreign shareholders/directors' },
      { name: 'Proof of legal entry or residency in Rwanda' },
      { name: 'Shareholder agreement (if applicable)' },
      { name: 'RIPA investment registration application' },
    ],
    applyUrl: 'https://org.rdb.rw',
    applyLocation: 'RDB one-stop center or online portal',
    costRwf: 0,
    timelineDays: 7,
    penaltyDescription: 'Failure to disclose foreign ownership is grounds for deregistration and fines.',
    stepOrder: 10,
    isOptional: false,
  },
  {
    title: 'Obtain BNR approval for foreign currency transactions (if applicable)',
    description:
      'If your business will receive investment in foreign currency, repatriate profits abroad, or conduct cross-border payment flows, you must notify the National Bank of Rwanda (BNR) and comply with the Foreign Exchange Act. Businesses with foreign shareholders that pay dividends abroad must obtain prior BNR approval for remittances above certain thresholds. This also applies to branch companies of foreign entities.',
    plainLanguage:
      'If you have foreign investors and plan to send money abroad (dividends, loan repayments), you need BNR approval for foreign exchange transactions.',
    regBodyCode: 'BNR',
    appliesSector: [] as string[],
    appliesBizType: ['foreign'] as string[], // virtual flag: applies when foreignOwnership = true
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Board resolution approving dividend remittance or profit repatriation' },
      { name: 'Audited financial statements' },
      { name: 'Foreign exchange transaction application form (BNR)' },
      { name: 'Shareholder register showing foreign ownership percentage' },
    ],
    applyUrl: 'https://www.bnr.rw',
    applyLocation: 'National Bank of Rwanda, KN 6 Ave, Kigali',
    costRwf: 0,
    timelineDays: 21,
    penaltyDescription: 'Unauthorized foreign currency transfers are subject to seizure and criminal penalties under the Foreign Exchange Act.',
    stepOrder: 11,
    isOptional: false,
  },

  // ─── Data protection ───────────────────────────────────────────────────────
  {
    title: 'Register as a Data Controller/Processor with RISA',
    description:
      'Under the Rwanda Data Protection Law (Law No. 058/2021), any business that collects, stores, or processes personal data of Rwanda residents must register with RISA and implement a data protection framework.',
    plainLanguage: 'Register with RISA as a data controller if you collect personal data from users.',
    regBodyCode: 'RISA',
    appliesSector: ['fintech', 'healthtech', 'ict'],
    appliesBizType: [] as string[],
    appliesCustomer: [] as string[],
    documentsReq: [
      { name: 'Data protection policy' },
      { name: 'Record of processing activities' },
      { name: 'Privacy notice for data subjects' },
      { name: 'Data breach response plan' },
    ],
    applyUrl: 'https://www.risa.gov.rw/index.php?id=107',
    applyLocation: 'Online via RISA portal',
    costRwf: 0,
    timelineDays: 14,
    penaltyDescription: 'Fine up to RWF 10 million or 2% of annual global turnover for non-compliance.',
    stepOrder: 9,
    isOptional: false,
  },
]

export async function seedComplianceSteps() {
  console.log('Seeding compliance steps...')
  for (const step of STEPS) {
    await db.insert(complianceSteps).values(step).onConflictDoNothing()
  }
  console.log(`✓ Seeded ${STEPS.length} compliance steps`)
}
