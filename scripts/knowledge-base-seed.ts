/**
 * Rwanda regulatory knowledge base — initial seed documents.
 *
 * Content is manually curated from official Rwanda government sources.
 * Every document here has been verified against primary sources.
 * Last human review: March 2026.
 *
 * Sources:
 * - RDB: https://org.rdb.rw
 * - RRA: https://www.rra.gov.rw
 * - BNR: https://www.bnr.rw
 * - RURA: https://www.rura.rw
 * - RISA: https://www.risa.gov.rw
 * - RSSB: https://www.rssb.rw
 * - Official Gazette: https://www.minaloc.gov.rw
 */

import type { DocumentInput } from './ingest-document'

export const DOCUMENTS: DocumentInput[] = [
  // ─── RDB: Company Registration ───────────────────────────────────────────

  {
    title: 'Rwanda Company Registration Guide — Private Limited Company (RDB)',
    sourceUrl: 'https://org.rdb.rw',
    sourceDate: '2025-01-01',
    regBody: 'RDB',
    docType: 'guideline',
    sectorTags: ['all'],
    content: `
Registering a Private Limited Company (Ltd) in Rwanda

The Rwanda Development Board (RDB) is the government agency responsible for company registration in Rwanda. All businesses intending to operate commercially in Rwanda must be registered with RDB before commencing operations. The process is designed to be completed within 6 hours for standard applications through the online portal.

Types of Business Entities in Rwanda:
- Private Limited Company (Société à Responsabilité Limitée – SARL): The most common business structure for SMEs and startups. Requires at least one shareholder and one director. Liability is limited to the amount invested.
- Sole Proprietorship (Entreprise Individuelle): A business owned and operated by a single individual. Simpler to register but the owner bears unlimited personal liability.
- Public Limited Company (Société Anonyme – SA): Required for companies seeking to raise capital from the public or list on the Rwanda Stock Exchange. Minimum share capital of RWF 10 million.
- Non-Governmental Organization (NGO) / Association: Registered under the law governing associations. Requires registration with RDB and in some cases additional approval from the relevant line ministry.
- Branch of a Foreign Company: Foreign companies wishing to have a permanent presence in Rwanda must register a branch. Requires certified copy of parent company documents, translated into French or English if necessary.
- Cooperative Society: Registered with RDB in partnership with MINICOM. Requires minimum 7 founding members.

Step-by-Step Registration Process for a Private Limited Company:

Step 1: Reserve your company name (online)
Before full registration, reserve your preferred company name on the RDB portal (org.rdb.rw). The system checks for uniqueness automatically. Name reservation is valid for 30 days. Cost: Free.

Step 2: Prepare required documents
- Memorandum and Articles of Association (MEMARTS): Must be notarized by a licensed Rwandan notary. For companies with a single shareholder, a standard template is available from RDB. For multiple shareholders, the articles must clearly state share distribution, voting rights, and governance structure.
- National Identity Cards or Passports of all shareholders and directors: All pages of the passport or both sides of the national ID must be provided.
- Proof of registered office address in Rwanda: This can be a lease agreement, utility bill, or letter from the property owner. Virtual office addresses are accepted.
- Application form: Completed online through the RDB company registration portal.

Step 3: Submit application online
Submit all documents via org.rdb.rw. The system assigns a tracking number. Processing time is typically 1–3 business days, though simple applications can be approved same-day.

Step 4: Receive Certificate of Incorporation
Upon approval, RDB issues a Certificate of Incorporation (Certificat d'Incorporation) containing the Business Registration Number (BRN). This certificate is your primary proof of legal entity.

Step 5: Tax Identification Number (TIN)
TIN registration is automatic and happens simultaneously with RDB registration. Your TIN is generated along with your BRN. You do not need to separately apply to RRA for a TIN when registering through the RDB online portal.

Costs:
- Company registration: Free for most entity types as of 2024. Some special purpose entities may have nominal fees.
- Notarization of MEMARTS: Approximately RWF 30,000–50,000 depending on the notary.
- Virtual office (if required): RWF 100,000–300,000 per year depending on provider.

Post-Registration Requirements:
After receiving your Certificate of Incorporation, you must:
1. Register for relevant taxes with RRA (VAT, PAYE if hiring, etc.)
2. Open a business bank account (most banks require the Certificate of Incorporation and directors' IDs)
3. Register employees with RSSB (Rwanda Social Security Board) if hiring staff
4. Obtain sector-specific licenses if operating in a regulated industry (fintech → BNR; ICT/telecom → RURA; food/manufacturing → RSB)

Special Note for Foreign Nationals:
Foreign shareholders or directors do not need to be physically present in Rwanda to register a company, but must provide:
- Certified copy of passport (all pages)
- Certificate of good conduct from country of residence (may be required for directors)
- Apostille or legalization of foreign documents if not in French or English
Foreign-owned companies in certain sectors (media, real estate) may have ownership restrictions. Check with RDB Investment Advisory for sector-specific restrictions.

Timeline Summary:
- Online name reservation: Instant
- Document preparation (including notarization): 1–5 business days
- RDB review and approval: 1–3 business days
- Certificate issued: Same day as approval
- Full process (from start to certificate): Typically 3–7 business days

Contact:
RDB One-Stop Center, KN 6 Ave 13, Kigali
Phone: +250 252 595 500
Email: info@rdb.rw
Online portal: org.rdb.rw
Office hours: Monday–Friday, 7:00 AM – 5:00 PM
    `.trim(),
  },

  // ─── RRA: TIN and Tax Registration ──────────────────────────────────────

  {
    title: 'Rwanda Tax Registration Guide — TIN, VAT, PAYE (RRA)',
    sourceUrl: 'https://www.rra.gov.rw',
    sourceDate: '2025-01-01',
    regBody: 'RRA',
    docType: 'guideline',
    sectorTags: ['all'],
    content: `
Rwanda Revenue Authority (RRA) — Tax Registration and Compliance Guide

The Rwanda Revenue Authority (RRA) is responsible for administering Rwanda's tax system. Every business entity operating in Rwanda must fulfill specific tax registration obligations. The primary taxes applicable to businesses are: Corporate Income Tax (CIT), Value Added Tax (VAT), Pay As You Earn (PAYE), and Withholding Tax.

Tax Identification Number (TIN):
The TIN (Tax Identification Number) is the foundational tax identifier in Rwanda. For companies registered through RDB's online portal, TIN registration is automatic — you receive your TIN simultaneously with your Business Registration Number (BRN). For individuals and businesses registering separately, TIN registration is done via the RRA eTax portal (etax.rra.gov.rw) or at any RRA service center.

The TIN is required for:
- All tax filings and payments
- Government procurement bids
- Opening a business bank account (some banks)
- Applying for business licenses with other government agencies
- Importing and exporting goods

Corporate Income Tax (CIT):
- Standard rate: 30% on net taxable profits
- SME preferential rate: 3% of turnover (for companies with turnover between RWF 20M and RWF 400M)
- Micro-enterprise rate: 3% flat rate (for turnover under RWF 20M)
- Filing deadline: 31 March of the following year for calendar-year taxpayers
- Tax return must be filed even if there is no profit (nil return)
- Quarterly advance payments required for companies with annual tax above RWF 100,000

Value Added Tax (VAT):
VAT is charged at 18% on taxable goods and services supplied in Rwanda. VAT registration is mandatory for businesses with annual taxable turnover exceeding RWF 20,000,000 (approximately USD 14,000 at current exchange rates).

Businesses with turnover below RWF 20M may register voluntarily for VAT, which is beneficial if supplying to VAT-registered businesses (allows input tax recovery).

VAT Registration Process:
1. Log into etax.rra.gov.rw
2. Navigate to Registration → VAT Registration
3. Upload: TIN certificate, evidence of turnover (bank statements or invoices), lease agreement for business premises
4. RRA reviews within 5 business days
5. Upon approval, a VAT registration certificate is issued

VAT filing obligations:
- Monthly VAT returns: Due by the 15th of the following month
- Zero-rated supplies: Exports, some basic food items, certain medicines
- Exempt supplies: Financial services, residential housing rental, certain educational services
- Input VAT recovery: VAT paid on business purchases can be offset against output VAT

PAYE (Pay As You Earn):
Employers must deduct income tax from employee salaries (PAYE) and remit to RRA monthly. This is mandatory for all employers with salaried staff.

Income tax rates for employees (2024/2025):
- 0% on monthly income up to RWF 30,000
- 20% on monthly income from RWF 30,001 to RWF 100,000
- 30% on monthly income above RWF 100,000

PAYE Registration:
1. After obtaining TIN, register for PAYE via etax.rra.gov.rw
2. Provide list of employees with their TINs
3. Submit monthly PAYE return by the 15th of the following month
4. Employer contribution to RSSB (pension, health) is separate from PAYE

Withholding Tax:
Rwanda applies withholding tax on specific payments:
- 15% on dividends paid to non-residents
- 15% on interest paid to non-residents
- 15% on royalties
- 3% on payments to unregistered suppliers (collected by the paying business)

Penalties for Non-Compliance:
- Late filing: 10% of tax due per month, maximum 100%
- Late payment: 1.5% per month on overdue tax
- Non-registration for VAT when required: Penalty of RWF 500,000 per month for each month of non-registration
- Fraudulent returns: Criminal prosecution possible

RRA eTax Portal: etax.rra.gov.rw
RRA Contact Center: +250 252 595 500
Regional Offices: Kigali (KBC Building), Musanze, Huye, Rubavu, Nyagatare
    `.trim(),
  },

  // ─── RSSB: Employee Registration ────────────────────────────────────────

  {
    title: 'RSSB Employer Registration and Social Security Contributions Guide',
    sourceUrl: 'https://www.rssb.rw',
    sourceDate: '2025-01-01',
    regBody: 'RSSB',
    docType: 'guideline',
    sectorTags: ['all'],
    content: `
Rwanda Social Security Board (RSSB) — Employer Registration and Contributions

The Rwanda Social Security Board (RSSB) manages social security benefits for workers in Rwanda, including pension, health insurance (through the Community Based Health Insurance scheme - CBHI/Mutuelle), and occupational hazard insurance.

Who Must Register:
All employers with at least one employee on a regular employment contract must register with RSSB. This includes:
- Companies (Ltd, SA, branches)
- Sole proprietors with employees
- NGOs and associations with paid staff
- Government contractors

Self-employed individuals and business owners without employees are not required to register as employers but may voluntarily contribute.

RSSB Registration Process:
1. Create an employer account on the RSSB eServices portal (eservices.rssb.rw)
2. Provide: Company registration certificate (BRN), TIN, contact details, list of all employees with their national IDs or passport numbers, employment start dates, and gross monthly salaries
3. RSSB assigns an Employer Registration Number (ERN) within 3 business days
4. Each employee receives an RSSB member number

Mandatory Contribution Rates (as of 2024):
Pension contributions:
- Employee contribution: 3% of gross salary
- Employer contribution: 5% of gross salary
- Total: 8% of gross salary

Community Based Health Insurance (CBHI/Mutuelle):
- Calculated annually per household. Rates vary by income bracket.
- For formal sector employees, CBHI contribution is shared between employer and employee.

Occupational Hazard Insurance:
- Employer contribution: 0.2% to 2% of gross salary (varies by industry risk level)
- Employee contribution: 0%

Maternity Benefits:
- Rwanda law entitles female employees to 12 weeks of paid maternity leave
- The employer pays 100% of salary for the first 6 weeks
- RSSB reimburses the employer for the remaining 6 weeks

Monthly Reporting and Payment:
- RSSB contribution returns must be filed by the 10th of the following month
- Payment must accompany the return
- Reporting is done through the RSSB eServices portal or at RSSB offices

Penalties for Non-Compliance:
- Failure to register employees: Fine of RWF 10,000 per employee per month of non-registration
- Late contributions: Interest of 1.5% per month on overdue amounts
- False declarations: Criminal prosecution for deliberate fraud

Employment Law Context:
Rwanda's Labor Law (Law No. 66/2018) governs employment relationships and sets minimum standards:
- Minimum wage: Rwanda does not have a statutory national minimum wage (as of 2025), but sector-specific minimums may apply
- Working hours: 45 hours per week, 9 hours per day maximum
- Annual leave: Minimum 18 working days per year for each completed year of service
- Notice period: 14 days for probation period termination; 1 month for confirmed employees; 3 months for senior management
- Probation period: Maximum 6 months (may not be extended)
- Overtime: Must be compensated at 1.5x normal rate for the first 2 hours, 2x thereafter

RSSB eServices Portal: eservices.rssb.rw
Phone: +250 788 200 200
Head Office: Kacyiru, Kigali
    `.trim(),
  },

  // ─── BNR: Payment Service Provider Licensing ─────────────────────────────

  {
    title: 'BNR Payment Service Provider (PSP) Licensing Framework — Rwanda',
    sourceUrl: 'https://www.bnr.rw/financial-stability/payment-system-oversight/',
    sourceDate: '2025-01-01',
    regBody: 'BNR',
    docType: 'regulation',
    sectorTags: ['fintech'],
    content: `
National Bank of Rwanda (BNR) — Payment Service Provider Licensing

The National Bank of Rwanda (Banque Nationale du Rwanda – BNR) is the central bank and primary financial sector regulator in Rwanda. Any company wishing to provide payment services must obtain authorization from BNR before commencing operations.

Legal Basis:
- Law No. 48/2017 of 23/09/2017 governing the payment system in Rwanda
- BNR Regulation No. 02/2019 on licensing and supervision of payment service providers
- BNR Regulation on Electronic Money Issuers

Types of Payment Service Provider Licenses:

1. Payment System Operator (PSO)
Covers companies operating payment infrastructure: switches, clearing houses, settlement systems. Typically for financial infrastructure providers, not app-level payment companies.

2. Payment Service Provider (PSP) — Type A
Covers: mobile money services, digital wallets, money transfer services (domestic and international), payment aggregation, merchant payment processing, collections services.
Minimum capital requirement: RWF 200,000,000 (approximately USD 130,000)

3. Payment Service Provider (PSP) — Type B
Covers: limited-scope payment services such as closed-loop prepaid cards, niche merchant payment services with restricted functionality.
Minimum capital requirement: RWF 100,000,000

4. Electronic Money Issuer (EMI)
Covers: companies issuing electronic money stored in mobile wallets or digital accounts. MTN Mobile Money, Airtel Money, and bank-linked mobile wallets fall under this category.
This license requires a banking license or is granted only to mobile network operators or banks.

PSP Application Process:

Step 1: Pre-application consultation
Contact BNR's Payment System Oversight Department for a pre-application meeting. BNR will assess whether your proposed service requires a PSP license or falls under an exemption.

Step 2: Prepare application dossier
Required documents:
- Completed application form (available from BNR)
- Certificate of Incorporation and MEMARTS
- Audited financial statements for the last 3 years (or financial projections for new companies)
- Business plan with product description, target market, revenue projections for 3 years
- AML/CFT Policy — Anti-Money Laundering and Countering the Financing of Terrorism policy document
- IT Security Assessment Report — conducted by an independent qualified assessor
- Background check clearance for all shareholders owning 5%+ and all directors (criminal record check, credit check)
- Proof of minimum capital deposited in a segregated account
- Description of governance structure and internal controls
- Data protection and privacy policy

Step 3: Submit to BNR
Submit the complete dossier to BNR's Legal and Compliance Department. BNR charges an application fee (currently RWF 500,000 — confirm with BNR as fees may change).

Step 4: BNR review process
BNR conducts a desk review followed by an on-site assessment of IT systems and operations. Timeline: 60–120 days from submission of complete application. BNR may request additional information during review, which resets the review clock.

Step 5: Authorization granted
Upon approval, BNR issues a Letter of Authorization. The company is then listed on BNR's public registry of licensed PSPs.

Step 6: Ongoing compliance
Licensed PSPs must:
- Submit monthly transaction reports to BNR
- Maintain minimum capital ratios at all times
- Report AML/CFT suspicious transactions (STRs) to the Financial Intelligence Unit (FIU)
- Maintain customer funds in segregated accounts — cannot be used as working capital
- Undergo annual external audit
- Notify BNR within 24 hours of any material IT incident or breach
- Obtain BNR's prior approval before any change in ownership above 5% threshold

Common Reasons for Application Rejection:
- Incomplete documentation
- Insufficient minimum capital
- Inadequate AML/CFT policies
- Shareholders or directors with adverse background check results
- Business model that does not require a PSP license (e.g., simple invoice payment that is already handled by a licensed PSP partner)

Important Distinction — Using a Licensed PSP vs. Obtaining Your Own License:
Many businesses do not need their own PSP license. If you are:
- An e-commerce platform accepting payments through an existing gateway (e.g., Flutterwave, DPO, Pesapal)
- A SaaS company billing through a bank's collection service

...then you are using a licensed intermediary's infrastructure and do not need your own license. You need your OWN PSP license only if you are moving, storing, or settling money on behalf of third parties using your own technology and accounts.

Contact BNR Payment System Oversight:
National Bank of Rwanda, KN 6 Ave, P.O. Box 531, Kigali
Email: info@bnr.rw
Website: www.bnr.rw
    `.trim(),
  },

  // ─── BNR: Digital Lending / MFI Framework ────────────────────────────────

  {
    title: 'BNR Digital Lending and Microfinance Institution (MFI) Licensing — Rwanda',
    sourceUrl: 'https://www.bnr.rw',
    sourceDate: '2025-01-01',
    regBody: 'BNR',
    docType: 'regulation',
    sectorTags: ['fintech'],
    content: `
National Bank of Rwanda (BNR) — Microfinance and Digital Lending Regulation

Rwanda's microfinance and digital lending sector is regulated by the National Bank of Rwanda (BNR) under the Law No. 40/2008 of 26/08/2008 relating to microfinance activities and the updated BNR regulations issued in 2023 on digital financial services.

Who Requires an MFI License:
Any company that provides credit (loans) to individuals or businesses using Rwanda-held funds — whether via physical branches, mobile app, USSD, or digital platform — must obtain a Microfinance Institution (MFI) license from BNR.

This includes:
- Digital lending apps (mobile-first consumer credit)
- Buy-Now-Pay-Later (BNPL) providers targeting Rwandan consumers
- Trade finance platforms providing credit to SMEs
- Agricultural input loan providers
- Asset financing companies

Exemptions:
- Companies lending exclusively from offshore funds to offshore borrowers (no Rwanda presence required for the lending activity itself)
- Banks already licensed by BNR (they lend under their banking license)
- Invoice discounting where no new credit is created

MFI License Categories:

Tier 1 MFI — Deposit-taking MFI
Can accept deposits from members/customers. Must maintain minimum capital of RWF 500,000,000 and meet capital adequacy ratios. Equivalent to a small bank. Requires extensive on-site inspection.

Tier 2 MFI — Non-deposit-taking MFI (credit-only)
Provides loans from own capital and borrowed funds. Cannot accept public deposits. Minimum capital: RWF 100,000,000. This is the most common license for digital lending startups.

Tier 3 — Cooperative Financial Institution (SACCO)
Member-owned cooperative that accepts deposits from and lends to members only. Regulated jointly by BNR and the Cooperative Promotion Department.

Digital Lending Specific Requirements (BNR Directive, 2023):
BNR issued specific guidance for digital lenders in 2023 addressing:
- Interest rate disclosure: Total cost of loan must be disclosed in annual percentage rate (APR) terms before credit agreement is signed
- Maximum interest rates: BNR sets reference rates; digital lenders may not exceed the BNR-published maximum lending rate plus a permitted spread
- Collection practices: No threatening, abusive, or humiliating collection contact; maximum 3 contact attempts per day
- Data use: Borrower data may only be used for credit assessment and not sold to third parties
- Cooling-off period: Borrowers have a right to cancel a loan within 48 hours without penalty

MFI Application Process:

Required documents (Tier 2 MFI — non-deposit-taking):
1. Application form (from BNR website)
2. Certificate of Incorporation
3. Business plan with 3-year financial projections, lending methodology, target market
4. Credit policy and risk management framework
5. Evidence of minimum capital (certified by auditor, deposited in escrow)
6. IT systems documentation (loan management system, cybersecurity measures)
7. Consumer protection policy (including complaints handling procedure)
8. AML/CFT policy
9. Background checks for all directors and shareholders with 5%+ ownership
10. Organizational chart and CVs of key management

Timeline: BNR targets 90 days for Tier 2 applications with complete documentation. In practice, 4–6 months is common.

Ongoing Compliance Obligations:
- Quarterly financial returns to BNR
- Annual external audit (BNR-approved auditor)
- Monthly data reporting via BNR's Credit Reference Bureau (CRB)
- All borrowers must be checked against the Credit Reference Bureau before loan disbursement above a threshold
- Disclosure of non-performing loan ratios must meet BNR-prescribed limits
- Capital adequacy: Minimum ratio of capital to risk-weighted assets

Interest Rate Context:
As of 2024, BNR's published average lending rate for MFIs is approximately 15–18% per annum. Digital lenders commonly charge 3–7% per month on short-term consumer loans, but must disclose this as APR (which would be 36–84%). BNR monitors this closely after consumer complaints about predatory lending.

Key Contact at BNR:
Microfinance Supervision Department
National Bank of Rwanda, KN 6 Ave
P.O. Box 531, Kigali
Phone: +250 252 588 600
    `.trim(),
  },

  // ─── RISA: Data Protection ───────────────────────────────────────────────

  {
    title: 'Rwanda Data Protection Law and RISA Registration Requirements',
    sourceUrl: 'https://www.risa.gov.rw/index.php?id=107',
    sourceDate: '2025-01-01',
    regBody: 'RISA',
    docType: 'regulation',
    sectorTags: ['all'],
    content: `
Rwanda Data Protection Law and RISA Registration

Rwanda enacted the Law No. 058/2021 of 13/10/2021 on Protection of Personal Data and Privacy. This law is Rwanda's primary data protection legislation and applies to any organization — public or private, foreign or domestic — that collects, processes, stores, or transfers personal data of individuals in Rwanda.

Rwanda Information Society Authority (RISA) is responsible for data protection regulation and enforcement.

Who Must Comply:
The law applies to any "data controller" or "data processor" that:
- Collects personal data of Rwanda residents or people physically in Rwanda
- Processes, stores, or transfers such data
- Operates in Rwanda, even if servers are located outside Rwanda

Examples of personal data covered: Name, national ID number, phone number, email address, biometric data (fingerprints, face ID), health information, financial data, location data, employee records, browsing behavior when linked to identifiable individuals.

Key Definitions:
- Data Controller: The entity that determines the purpose and means of processing personal data (typically the business)
- Data Processor: An entity that processes data on behalf of a controller (e.g., a cloud provider, analytics service)
- Data Subject: The individual whose data is being processed

Mandatory Obligations for Data Controllers:

1. Registration with RISA
All data controllers must register with RISA before commencing any personal data processing activities. Registration is done online at risa.gov.rw. Registration is free of charge. A unique Registration Number is issued upon approval.

2. Legal Basis for Processing
Personal data may only be processed with a valid legal basis:
- Consent of the data subject (freely given, specific, informed, and unambiguous)
- Performance of a contract with the data subject
- Legal obligation
- Vital interests of the data subject
- Legitimate interests of the controller (must not override the rights of the data subject)

3. Privacy Notice / Privacy Policy
You must provide data subjects with a clear privacy notice at the time of data collection explaining:
- What data you collect
- Why you collect it (purpose)
- How long you retain it
- Who you share it with
- The rights of the data subject

4. Data Subject Rights (must be facilitated):
- Right to access their data
- Right to correct inaccurate data
- Right to erasure ("right to be forgotten") in certain circumstances
- Right to data portability
- Right to object to processing
- Right to withdraw consent at any time

5. Data Retention
Data must not be retained longer than necessary for the purpose for which it was collected. You must have a documented data retention policy.

6. Data Breach Notification
In the event of a personal data breach:
- Notify RISA within 72 hours of becoming aware of the breach
- If the breach poses a high risk to individuals, notify affected data subjects "without undue delay"
- Maintain an internal register of all data breaches

7. Cross-Border Data Transfers
Personal data may only be transferred outside Rwanda to countries that have been assessed by RISA as providing adequate data protection, OR with the explicit consent of the data subject, OR under a contractual arrangement approved by RISA.

8. Data Protection Officer (DPO)
Organizations that process large volumes of sensitive data (health, financial, biometric) or carry out systematic monitoring of individuals must appoint a Data Protection Officer. For most SMEs, this is optional but recommended.

9. Data Processing Register
Controllers must maintain an internal register (Record of Processing Activities — ROPA) documenting all processing activities, their purpose, legal basis, data categories, retention periods, and security measures.

Registration Process with RISA:
1. Go to risa.gov.rw
2. Navigate to Data Protection → Register as Data Controller
3. Complete the online registration form (company details, description of data processing activities, data categories, purposes, retention periods, technical security measures)
4. RISA issues a Data Controller Registration Certificate, typically within 14 business days
5. Registration must be renewed annually and updated whenever processing activities change materially

Penalties:
- Fine up to RWF 10,000,000 (approximately USD 7,000) or 2% of annual global turnover (whichever is higher)
- Criminal penalties for deliberate or gross negligence violations
- Data processing may be suspended or prohibited by RISA pending compliance

Practical Advice for Startups:
1. Include a privacy policy on your website and app before launch
2. Get explicit consent through your user onboarding (consent checkbox, not pre-ticked)
3. Register with RISA at the same time you register with RDB — it costs nothing and takes 10–14 days
4. Keep a simple spreadsheet documenting what data you collect, why, how long you keep it, and who has access — this is your initial Record of Processing Activities
5. If using AWS, Google Cloud, or Azure for data storage — confirm they have Data Processing Agreements (DPAs) available and sign them before storing Rwandan personal data

RISA Contact:
Data Protection Division, Rwanda Information Society Authority
KG 9 Ave, Kigali
Website: risa.gov.rw
Email: dataprotection@risa.gov.rw
    `.trim(),
  },

  // ─── RURA: ICT Licensing ────────────────────────────────────────────────

  {
    title: 'RURA ICT and Telecommunications Licensing in Rwanda',
    sourceUrl: 'https://www.rura.rw/index.php/services-a-licensing',
    sourceDate: '2025-01-01',
    regBody: 'RURA',
    docType: 'regulation',
    sectorTags: ['ict'],
    content: `
Rwanda Utilities Regulatory Authority (RURA) — ICT Licensing

RURA (Rwanda Utilities Regulatory Authority) regulates the telecommunications and ICT sector in Rwanda under Law No. 44/2001 and its subsequent amendments. RURA issues licenses and authorizations to companies providing telecommunications, internet, and value-added ICT services.

Who Needs a RURA License or Authorization:
A license or authorization is required for:
- Internet Service Providers (ISPs): Companies providing internet connectivity to consumers or businesses
- Telecom Operators (MNOs/MVNOs): Mobile network operators or virtual operators
- VoIP Providers: Companies providing voice calls over the internet (e.g., calling apps, business PBX services that traverse the public network)
- Value-Added Service (VAS) Providers: Companies offering content, messaging aggregation, or specialized services on telecoms infrastructure
- Resellers: Companies reselling connectivity or mobile services under a licensed operator's infrastructure

Who Does NOT Need a RURA License:
- Software companies that create applications (apps, SaaS platforms) — software development does not require RURA authorization
- Companies using RURA-licensed services as customers (e.g., using MTN or Airtel for business SMS via an approved aggregator)
- Internal IT systems and private networks not offered to the public
- Websites and online services that do not involve telecommunications infrastructure

License Categories:

1. Individual License (Telecommunications)
Required for: MNOs, ISPs using radio frequency spectrum, international gateway operators.
Process: Full application with technical specifications, frequency requests, financial capacity demonstration. Timeline: 90–180 days.
Fee: Significant licensing fee (RWF 10M+) plus annual regulatory fees.

2. General Authorization (ICT Services)
Required for: Value-added service providers, resellers, VoIP providers, data center operators.
Simpler than an individual license. Application involves describing the service, compliance with RURA technical standards, and payment of an authorization fee (typically RWF 200,000 – 1,000,000).
Timeline: 30–60 days.

3. Class License (Broadcasting)
For FM radio, TV broadcasters — separate category, not covered here.

Practical Guidance for Tech Startups:
Most tech startups building apps, SaaS platforms, or digital services DO NOT need a RURA license. The common scenarios:

Scenario A — You build a mobile app that sends SMS notifications
You need to work with an approved SMS aggregator (licensed by RURA). The aggregator holds the license; you simply use their API. No RURA license needed for you.

Scenario B — You build a calling/communications app (like WhatsApp for business)
If your app uses the public telephone network (PSTN) for calls, you may need a VoIP authorization. If calls are purely app-to-app over the internet (no PSTN connectivity), you likely do not need authorization, but confirm with RURA.

Scenario C — You want to provide internet connectivity as a business (WiFi hotspots, last-mile ISP)
You need an Individual License from RURA.

Scenario D — You build a ride-hailing, e-commerce, or enterprise SaaS platform
No RURA license needed. You are a software/platform company, not a telecom provider.

General Authorization Application Process:
1. Submit application via RURA website (rura.rw) or in person at RURA offices
2. Documents required: Certificate of Incorporation, company profile, technical description of service, contact details of technical director
3. Pay authorization fee (amount varies by service type)
4. RURA reviews and may request a demonstration of the service
5. Authorization issued within 30–60 days

Ongoing Obligations (for authorized providers):
- Report quarterly to RURA on subscriber numbers, traffic volumes, and outages
- Comply with RURA's quality of service standards
- Notify RURA before making material changes to the service
- Pay annual authorization renewal fees

Contact RURA:
Avenue de l'Armée, Kigali
Phone: +250 252 500 800
Website: rura.rw
Email: info@rura.rw
    `.trim(),
  },

  // ─── Rwanda Labour Law Summary ───────────────────────────────────────────

  {
    title: 'Rwanda Labour Law Summary — Employment Contracts, Leave, Termination',
    sourceUrl: 'https://www.mifotra.gov.rw',
    sourceDate: '2025-01-01',
    regBody: 'RSSB',
    docType: 'guideline',
    sectorTags: ['all'],
    content: `
Rwanda Labour Law Overview — Key Requirements for Employers

Rwanda's employment relationships are governed primarily by Law No. 66/2018 of 30/08/2018 regulating labour in Rwanda (Labour Code), and the associated presidential orders and ministerial orders.

Employment Contracts:
Every employment relationship must be governed by a written employment contract. The contract must specify:
- Names and details of employer and employee
- Job title and description of duties
- Place of work
- Start date
- Remuneration (salary, benefits)
- Duration (fixed-term or indefinite/permanent)
- Working hours
- Applicable leave entitlements
- Notice period

Types of contracts:
- Permanent/indefinite-term contract (Contrat à durée indéterminée – CDI): No end date. Must be terminated with proper notice or grounds.
- Fixed-term contract (Contrat à durée déterminée – CDD): Has a specified end date. Maximum duration of 3 years; may be renewed once. If renewed twice or if the employee continues working after expiry without a new contract, the contract becomes permanent.

Probation Period:
- Maximum 6 months for standard roles
- May not be extended beyond 6 months
- During probation, either party may terminate with 14 days' notice
- Probation period should be stipulated in the employment contract

Working Hours:
- Standard: 45 hours per week, maximum 9 hours per day
- Employees may not be required to work more than 6 consecutive days without a rest day
- Overtime must be voluntary (except in emergencies) and compensated:
  - First 2 hours of overtime on a weekday: 130% of normal rate (or time off in lieu)
  - Additional hours: 150% of normal rate
  - Sunday/public holiday work: 200% of normal rate

Annual Leave:
- Minimum 18 working days per year after completing 1 year of continuous service
- Accrues at 1.5 days per month
- Leave must be taken — cannot be replaced by cash payment during active employment (exception: at end of employment)
- Employer sets the schedule for leave in consultation with the employee

Maternity and Paternity Leave:
- Maternity leave: 12 weeks (84 days), with 100% salary
  - First 6 weeks: paid by employer
  - Last 6 weeks: reimbursed to employer by RSSB (requires RSSB registration)
- Paternity leave: 4 working days, 100% salary, paid by employer
- No employee may be dismissed or demoted due to pregnancy or during maternity leave

Sick Leave:
- Employees are entitled to paid sick leave with a valid medical certificate
- 2 months (60 days) of paid sick leave per year
- After 60 days, the employer may terminate if the employee cannot return (with severance)

Termination of Employment:

Notice periods for termination without cause (employer-initiated):
- During probation: 14 days
- After probation (confirmed employee, up to 5 years service): 30 days
- After 5 years of service: 60 days
- Senior management / specialized roles: 90 days (by contract)

Dismissal for cause (employee misconduct):
An employer may dismiss an employee without notice for serious misconduct, including:
- Theft, fraud, or willful destruction of company property
- Serious breach of confidentiality
- Repeated documented performance failures after warnings
- Abandonment of post (consecutive unexplained absences above 5 days)
All dismissals for cause must follow a disciplinary procedure: written notice of allegations → employee given opportunity to respond → written decision.

Severance Pay:
- Only payable on termination of a permanent contract by the employer without the employee's fault
- Not applicable during probation
- Not applicable for fixed-term contracts that expire naturally
- Amount: Based on years of service (refer to presidential order for exact calculation)
- Calculation basis: Average of last 3 months' salary × years of service × factor (varies by years of service)

Non-Compete Clauses:
Rwanda allows non-compete clauses in employment contracts but they must be:
- Limited in time (maximum 2 years post-employment)
- Limited in geographic scope (reasonable)
- Compensated (employee must receive consideration for the restriction)
Courts may void overly broad non-competes.

Foreign Employee Work Permits:
Foreign nationals working in Rwanda must hold a valid work permit issued by the Directorate General of Immigration and Emigration (DGIE). Employers sponsoring a foreign employee must demonstrate that the skill is not readily available locally. Work permits are typically valid for 1–3 years and renewable.

Employer Filing Obligations:
- Register all employees with RSSB before or on their first day of work
- Register for PAYE with RRA before the first payroll
- Maintain employee files including: contract, national ID copy, pay slips, leave records
- File monthly PAYE returns with RRA (by 15th of following month)
- File monthly RSSB contributions (by 10th of following month)

Ministry of Public Service and Labour (MIFOTRA) handles labour disputes and inspections.
MIFOTRA Contact: KG 7 Ave, Kigali | Phone: +250 252 580 080
    `.trim(),
  },
]
