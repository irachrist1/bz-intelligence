# BZ Intelligence — Document Vault & AI Chat Strategy

> A product strategy document evaluating the Document Vault concept and redesigning the AI chat experience.
> Written as: believer vs. critic, with hard verdicts and no hedging.

---

## 1. Concept Evaluation — The Believer Case

### The Core Pain Is Real and Underserved

Every Rwanda founder who has gotten through registration has a folder — physical or digital — full of documents they barely understand, can barely find when needed, and have no system to track. Their incorporation certificate, TIN, VAT certificate, RSSB employer number, BNR approval letter, business license from the City of Kigali. These documents have different expiry cycles, issued by different bodies, with no unified view. When a bank asks for a tax clearance and the founder searches through their email for 20 minutes, that's the pain. It is universal, it is constant, and no one has solved it in Rwanda.

### The Compliance-to-Vault Bridge Is a Natural Product Extension

The compliance roadmap already tells founders what documents they need to get. The Document Vault is the natural "done" state for every step on that roadmap. Without the vault, a completed roadmap step is just a checkbox. With the vault, it becomes: "You checked off Step 4. Upload your RDB certificate of incorporation and we'll confirm it matches your profile and track its validity." That loop — roadmap generates requirement, vault stores evidence, AI confirms — is a genuinely differentiated product experience. No generic document tool can replicate it because they don't have the Rwanda-specific knowledge base.

### Expiry Alerts Are a Recurring High-Value Feature

A PSP license from BNR expires. A business permit expires. Tax clearance certificates expire annually. A digital lender's operating authorization expires. Right now, no system notifies founders when these things are coming up. A single prevented license lapse — which could shut down operations or trigger a regulatory penalty — justifies a full year of subscription fees. The ROI argument to the customer is not "this saves you time," it is "this prevents a business-threatening event." That is a fundamentally stronger selling proposition.

### The Consultant Product Unlocks a Different Market

Individual founders are low-ARPU customers who churn. Law firms and business advisory firms are high-ARPU customers with sticky institutional contracts. A consultant who manages 40 client compliance portfolios using BZ Intelligence is worth $79–$200/month and has near-zero churn because switching would mean migrating 40 client profiles. PSF (Private Sector Federation) has member firms across Kigali. RDB has authorized agents who help companies register. These are addressable channels. The consultant product is a B2B sales motion that individual-founder SaaS does not have.

### The Data Moat Gets Deeper

Every document a user uploads and that the AI analyzes trains a feedback loop. Over time, the system learns which document types appear at which compliance step, what common mistakes look like (missing stamps, wrong names, wrong dates), and how long each license type typically lasts. This is proprietary operational data that no competitor can replicate. It is not a day-one advantage, but it compounds.

### Revenue Model Is Clear

- Free tier: no vault
- Starter ($29/month): vault storage up to 20 documents, no expiry alerts
- Pro ($79/month): unlimited vault, expiry alerts, AI document analysis, roadmap mapping
- Team/Consultant ($149–$200/month): multi-client management, bulk alerts, exportable reports

The vault is a strong gating mechanism for the Pro tier. It transforms the Pro upgrade from "more AI queries" — which is abstract — to "protect your licenses and never miss an expiry" — which is concrete.

---

## 2. Concept Evaluation — The Critic Case

### Rwanda's Document Reality Is Messier Than the Ideal

The assumption is that founders have clean, digital PDF copies of their compliance documents. Many do not. Rwanda's regulatory bodies issue physical documents. BNR sends approval letters via email but the final license is sometimes a stamped physical document. RDB certificates are often printed on A3 paper. Founders photograph them with phones and the quality is low. The AI document analysis built on `generateObject` will produce unreliable extractions on blurry JPEG photos of physical certificates. The system will fail quietly — showing incomplete data — and the founder won't know whether to trust it. Garbage in, garbage out. And the UX cost of constantly flagging "we couldn't read this document" is friction that kills the product experience.

### Security and Liability Exposure Is Significant

When a law firm's BNR operating license is stored on your servers and something goes wrong — a data breach, a mistaken deletion, a corrupt file — you become liable. Not just reputationally, but potentially legally. Rwanda's data protection law (Law No. 058/2021) imposes obligations on entities that store personal and corporate data, including security obligations and breach notification duties. You are a small startup. You are not a legal custodian. If a user loses a document because of your storage failure, and that document was their only copy, the legal and reputational damage is disproportionate to the revenue.

### The AI Mapping Is Harder Than It Looks

"Your BNR license satisfies step 6 of your roadmap." This sounds simple. In practice, it requires the AI to:
1. Correctly extract the license type from the document
2. Correctly identify which of the ~50 compliance steps that license type maps to
3. Handle edge cases: the license is for one activity, the step covers another; the license is expired; the license covers branch A but step 6 was for nationwide operations

This is not a demo problem, it is a production reliability problem. An incorrect mapping — telling a founder their compliance step is done when the document is wrong or misread — is worse than not having the feature at all. In a compliance context, false positives have real consequences.

### Focus Risk Is the Biggest Threat

Phase 1 is Compliance MVP. The knowledge base is not yet seeded. The AI is not working because the API key is invalid. The onboarding is insufficient. Zero real users have touched the product. Adding the Document Vault now means splitting engineering effort across: knowledge base content, accurate AI responses, reliable document upload, AI extraction, expiry tracking, alert emails, and UI for a compliance dashboard. None of these are trivial. The risk is that everything is half-built and nothing is trustworthy enough to pay for.

### Consultants in Rwanda May Not Be Ready to Pay Software Prices

"A law firm will pay $79/month for this" is an assumption that deserves stress-testing. Rwanda's professional services market — law firms, accountants, business advisors — is a mix of large established firms (who already have their own internal systems, however rudimentary) and small practitioners who operate with minimal tooling and minimal budget. The sophisticated firms don't need you. The small practitioners can't pay $79. The middle segment — firms with 5–20 clients who want to professionalize but haven't — is real but requires a sales motion, onboarding support, and trust-building that is expensive for a startup to execute.

### Build vs. Buy: Existing Partial Solutions

Box, Dropbox, and Google Drive already solve "store my files." Many founders already use Google Drive with manual folder structure. You are not competing with zero — you are competing with "it's fine, I have a Google Drive folder." The differentiation is the Rwanda compliance intelligence layer, but that layer is only as good as the underlying knowledge base, which does not yet exist. Without the knowledge base, the Document Vault is just a more expensive Google Drive.

### Cloud Storage Is a Cost Center With No Natural Free-Tier Ceiling

Storing user documents costs real money. Cloudflare R2 is $0.015/GB/month. At 1,000 users each uploading 50 documents averaging 2MB each, that's 100GB = $1.50/month. Not a crisis. But consider: one user uploads a large financial statement in poor scan quality at 15MB per page — 10 pages = 150MB per document. They upload 20 such documents. Now one user costs $0.045/month in storage alone. At scale, storage + extraction + embeddings per document adds up. Free-tier document storage must be hard-limited or it will be abused.

---

## 3. Verdict

**Build the Document Vault. But not now, and not in full.**

The believer case wins strategically. The critic case wins tactically. The resolution is sequencing.

### Conditions That Must Be Met Before Building the Vault

1. The compliance AI is working accurately. At least 80% of test queries return correct, cited answers. This requires a valid API key and a seeded knowledge base.
2. At least 20 real Rwanda founders have used the compliance chat and roadmap. This validates that the compliance product itself has product-market fit before adding complexity.
3. Phase 1 is complete by the success criteria defined in the roadmap.

### What to Build When Ready

Build Concept A (Business Document Vault) first. Do not build Concept B (Consultant Directory) until at least 3 law firms have manually expressed interest and agreed to a 30-day pilot. The consultant product is not something to build speculatively — it is something to build when a consultant is standing in front of you asking for it.

The vault is the right Phase 3 first feature because the schema is already designed (`org_documents` table, `compliance_step_id` foreign key, `extractedData` jsonb, `expiresAt` date). The R2 storage infrastructure is already planned. This is not new architecture — it is completing the designed system.

The liability concerns are real but manageable with the right disclaimers, encryption, and a clear terms of service. Do not store raw financial statements from third parties in the early version. Store only the compliance documents the founder themselves generated (licenses, certificates, permits). These are less sensitive than financial records and more clearly the founder's own documents.

---

## 4. AI Compliance Chat vs. AI Market Analyst — Designing a Real Difference

These two UIs are currently the same component with different API endpoints. That is a product failure. They need to feel like different tools for different jobs.

### Compliance Chat: The Strict Regulatory Advisor

**Mental model:** A meticulous Rwanda-admitted lawyer who refuses to speculate.

**Purpose:** Answer the single question: "What do I need to do to be compliant?" This chat is grounded in the user's specific business profile. The AI knows the founder is building a fintech startup with foreign shareholders and BNR-regulated activities. Every answer is filtered through that lens.

**Personality:** Precise, cautious, citation-heavy. Uses the word "required" frequently. Flags uncertainty explicitly. Never extrapolates beyond what the source documents say. Ends every substantive answer with: "This is general guidance only. Consult a qualified attorney for advice specific to your situation."

**Constraints:** Grounded ONLY in the Rwanda regulatory knowledge base. If asked about market competitors or investment opportunities, it declines and redirects: "I'm your compliance advisor. For market questions, switch to Market Analyst mode."

**When a user uses it:** Before making a compliance decision. "Do I need BNR approval for this?" "What happens if I miss the RSSB registration deadline?" "What documents does RRA require for VAT registration?"

**What makes it distinct from a generic chatbot:** It has your business profile. It knows you handle money, have foreign investors, and operate nationally. The system prompt injects this context. When it tells you that you need a BNR Payment Service Provider license, it is telling you because of what you told it about your business — not because it is giving generic fintech advice.

**UI signals:**
- Color identity: Blue. The blue of government forms and official documents — serious, authoritative.
- Header: "Compliance Advisor" with a shield or document icon. Never "chat" in the label.
- Input placeholder: "Ask about your compliance requirements..."
- Every response includes a mandatory citation block at the bottom: source title, regulatory body, last verified date.
- If no knowledge base results are found: "I don't have verified information on this topic yet. Ask me about RDB registration, RRA tax requirements, BNR licensing, RURA permits, or RSSB employer registration."
- A persistent status indicator showing: "Answers based on your profile: [Fintech / Ltd Company / BNR-regulated]"

**Tier gating:** The first 5 queries per month are free. Beyond that, it is Pro. The free queries give enough value to demonstrate the product without giving away the whole thing.

### Market Analyst AI: The Curious Research Partner

**Mental model:** A Bloomberg terminal that can talk — curious, analytical, comparative, speculative.

**Purpose:** Answer the question: "What does the market look like?" This chat is grounded in company data, funding data, sector trends, and market intelligence. The user is not asking about their own compliance — they are asking about the ecosystem.

**Personality:** Analytical, willing to synthesize, comfortable with uncertainty when labeled as such. Uses phrases like "the data suggests," "based on available records," "this may indicate." It can and should make market observations, not just recite facts.

**Constraints:** Grounded in the public knowledge base and company directory. Cannot access private user data from other companies. When data is missing or uncertain, it says so — but it does not refuse to analyze. It distinguishes between "here is what the data shows" and "here is my interpretation."

**When a user uses it:** For research and discovery. "Who are the active investors in Rwanda's fintech sector?" "Which sub-sectors of ICT are underrepresented?" "What BNR licenses have been granted in the last 12 months?" "How does this company's regulatory position compare to its competitors?"

**What makes it distinct:** It operates at market level, not individual level. It synthesizes across many companies. It is genuinely exploratory — the user does not know what they are going to find. This is inherently different from the compliance chat, where the user knows what they are looking for (their requirements) and wants a definitive answer.

**UI signals:**
- Color identity: Amber/orange. The colors of data, charts, market heat maps — dynamic, analytical.
- Header: "Market Analyst" with a chart or graph icon. Never "chat."
- Input placeholder: "Explore Rwanda's market landscape..."
- Responses can include embedded data snippets: "3 licensed PSPs in Rwanda as of January 2026: [Company A], [Company B], [Company C]."
- No mandatory disclaimer on every response (this is market data, not legal guidance).
- A filter panel on the left: "Focus on: [Sector] [Stage] [Location]" — these pre-filter the knowledge base before the AI sees the query.
- Chat history shows the analytical "thread" — like a research session, not a support ticket.

**Tier gating:** Market Analyst is Pro-only, entirely. Free-tier users can see the company directory (read-only, first 20 results) but cannot use the AI. This creates a clear, compelling upgrade reason: "Unlock unlimited market research." The Compliance Chat has a free tier because every founder needs it. Market Analyst is a power tool for people who are already paying for value.

### Summary of Differences

| Dimension | Compliance Chat | Market Analyst |
|-----------|----------------|----------------|
| Color | Blue | Amber |
| Tone | Cautious, precise | Analytical, exploratory |
| Grounded in | User's business profile + Rwanda regulations | Public company + market data |
| Disclaimers | Always on compliance guidance | Only when data is uncertain |
| Free tier | Yes, 5 queries/month | No — Pro only |
| Declines what | Market questions, speculation | Compliance/legal questions |
| Typical query | "Do I need a BNR license for this?" | "Who are the active investors in fintech?" |
| Success metric | User makes correct compliance decision | User discovers new market insight |

---

## 5. Minimum Viable Document Vault — 2-Week Build

One rule: build only what delivers a clear "wow" moment to the first user who touches it. No expiry email system, no consultant features, no complex permissions. Prove the core loop first.

### The Core Loop to Prove

User uploads a document → AI reads it → AI shows what it found → AI says which compliance step it satisfies.

That is it. Everything else is Phase 3.1 polish.

### What to Build

**Week 1: Upload + Storage**

Day 1–2: R2 integration. Set up the Cloudflare R2 bucket with org-scoped paths (`{orgId}/{docId}/{filename}`). Write the upload API route: `POST /api/documents/upload`. The route receives a multipart form submission, streams the file to R2 using the `@aws-sdk/client-s3` library already in the stack, writes a row to `org_documents` with `storage_path`, `filename`, `mimeType`, `sizeBytes`. Return the document ID.

Day 3–4: Document list UI. A simple grid on `/dashboard/compliance/documents` showing all uploaded documents for the org. Each card shows: filename, upload date, a placeholder for document type (shows "Processing..." until AI runs), a delete button. Use shadcn/ui `Card` components. No complex styling yet.

Day 5: Upload UI. A drag-and-drop upload zone using shadcn/ui `Dropzone` pattern (or a simple file input styled with Tailwind). Accept PDF, JPG, PNG. Hard size limit: 10MB per file. Hard count limit: 20 documents on free tier (enforced server-side before upload).

**Week 2: AI Extraction + Roadmap Mapping**

Day 6–7: AI extraction. After upload, trigger an async call to `generateObject` with the document text (extracted via a simple text extraction from PDF — use `pdf-parse` Node.js package, no Python pipeline needed for MVP). The Zod schema already exists in the tech stack documentation:

```typescript
const DocumentAnalysisSchema = z.object({
  category: z.enum(['incorporation', 'license', 'tax_certificate', 'permit', 'other']),
  companyName: z.string(),
  registrationNumber: z.string().optional(),
  issuingBody: z.string(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  licenseType: z.string().optional(),
  complianceStepFulfilled: z.string().optional(),
  flags: z.array(z.string()),
})
```

Write the extracted data into `org_documents.extracted_data` and `org_documents.expires_at`.

Day 8: Roadmap mapping. After extraction, look up which compliance step this document satisfies. The `complianceStepFulfilled` field from the AI extraction is a text description — do a fuzzy match against the compliance steps in the database by embedding the description and running a pgvector similarity search against step titles. If a match is found above a confidence threshold, update `org_documents.compliance_step_id`.

Day 9: Document detail view. A drawer or modal showing the AI-extracted fields for a document: type, issuing body, registration number, issue date, expiry date, which compliance step it satisfies. Show a "Verify" disclaimer: "Extracted by AI. Always verify against your original document." If expiry is within 60 days, show a red warning badge.

Day 10: Roadmap integration. On the compliance roadmap page, each step that has a mapped document shows a small green document icon. Clicking it opens the document detail. Steps without documents show an "Upload document" link.

### What NOT to Build in Week 2

- Email expiry alerts (implement in Phase 3.1 polish — set up a Resend cron job later)
- Sharing documents between users in an org (single-user vault first)
- Downloading documents (R2 signed URLs — add later)
- OCR for scanned images (use pdf-parse for PDFs only in MVP; skip image OCR)
- Consultant multi-client management (entirely separate product)
- Bulk upload (single file at a time in MVP)

### Definition of Done for MVP Vault

A Rwanda founder can upload their RDB certificate, the AI reads it, identifies it as an incorporation certificate, extracts the company name and registration number, maps it to Step 1 on their roadmap, and shows a green checkmark on that step. That is a real, complete, valuable product experience — and it can be built in 2 weeks.

---

## 6. The Consultant Product — B2B Design

### Who the Consultant Is

Not a solo freelance accountant. The target is a professional services firm: a law firm with 3–8 lawyers handling company registration and compliance advisory, or an RDB-authorized agent who processes 10–30 new company registrations per month. These firms have real pain: they are managing client compliance across spreadsheets, WhatsApp messages, and scattered email threads. They are not looking for a productivity tool — they are looking for a client management system.

### How a Consultant Account Differs from a Founder Account

A consultant account is a parent account that manages multiple child organizations.

**Data model change required:**
- Add a `consultants` table with a `consultant_id`, their firm name, plan tier.
- Add a `consultant_clients` join table: `consultant_id`, `org_id`, `client_name`, `added_at`.
- The consultant can see all documents and compliance status for their client orgs, but each client org is still data-isolated — the consultant sees only their clients, and clients cannot see each other.

**Consultant dashboard layout:**
- Left sidebar: list of clients (search + filter by status)
- Main view: a client roster table with columns: Client Name | Sector | Open Steps | Expiring Soon | Last Updated
- Click a client row → opens a read-only view of that client's compliance roadmap and vault
- Top of page: alert banner "3 clients have documents expiring in the next 30 days"
- A "Generate Report" button per client: one-click PDF compliance summary (Puppeteer, Phase 3.2)

**What the consultant can do that a founder cannot:**
- View all clients in a single unified dashboard
- Export compliance status reports per client (PDF)
- Add notes to a client's compliance record on behalf of the firm
- Receive a weekly digest email: all expiring documents across all clients
- Invite a client to create their own BZ account (the client becomes linked to the consultant's portfolio)

**What the consultant cannot do:**
- Upload documents on behalf of a client without the client's consent (this is a liability issue — the client must be the one who uploads)
- See the actual document files of a client (they can see extracted metadata but not the raw R2 file — another liability protection)
- Create compliance roadmaps from scratch (these are generated from the knowledge base, not manually authored)

### Pricing

**$149/month for up to 20 client organizations.** This is the right price point. Here is the reasoning:

$79/month is a founder's price — it is what a startup pays. A law firm billing clients $200–$500 for compliance advisory is not price-sensitive at $149/month. If the tool saves 2 hours per client per month across 10 clients, that is 20 hours saved — at even a $30/hour opportunity cost, that is $600 in value. $149 is a 4x ROI on a generous estimate.

For firms managing more than 20 clients, charge $199/month for unlimited clients. Do not create a per-client pricing model — it disincentivizes adding clients to the platform.

**Do not offer a free tier for consultant accounts.** The value proposition is clear enough that asking for payment upfront is reasonable. Offer a 14-day trial with no credit card required. End of trial, either convert or lose the account.

### The Single Most Compelling Pitch to a Law Firm

"Every client you have with an expiring license is a liability for your firm. You signed off on their compliance. When their PSP license lapses because no one was tracking it, they blame you. BZ Intelligence tracks all of it automatically and emails you 60 days before anything expires. It is your early warning system."

This pitch works because it activates professional liability anxiety, not efficiency aspiration. Law firms do not buy software to be more efficient — they buy software to avoid professional risk. Frame the product as risk management, not productivity.

### Rwanda Market Reality Check

There are roughly 300–400 formal professional services firms (law firms + accounting firms + business advisory firms) in Rwanda operating above the micro-enterprise level, concentrated in Kigali. Getting 20 of them as paying consultant accounts is the Year 1 goal. That is $149 x 20 = $2,980/month in consultant ARR alone. It is not transformative revenue on its own — but combined with individual Pro subscribers, it pushes the business toward sustainability. More importantly, each consulting firm client is worth 10–30x more in LTV than an individual founder, and they bring their clients as eventual users.

Reach these firms through: direct outreach to PSF member firms, presenting at RDB-organized events for company registration agents, partnering with the Institute of Certified Public Accountants of Rwanda (ICPAR) for accountant members.

---

## 7. Security and Liability

### The Legal Risks of Storing Client Documents

**Risk 1: Data breach.** If the R2 bucket is misconfigured or credentials are leaked, user compliance documents become publicly accessible. These documents contain company registration numbers, director names, financial data, and license details — all of which can be used for identity fraud and corporate impersonation.

**Risk 2: Data loss.** If a user loses their only copy of a compliance certificate because of a deletion bug or a storage failure, the business harm to them is real and potentially irreversible (re-obtaining some regulatory documents takes months).

**Risk 3: Incorrect AI extraction.** If the AI extracts a wrong expiry date (e.g., reads "22/11/2026" as "11/22/2026") and the system tells the user their license expires on a different date, the user may fail to renew in time. This is an AI error with a real-world compliance consequence.

**Risk 4: Rwanda data protection liability.** Law No. 058/2021 on Personal Data Protection requires data controllers to implement adequate security measures and notify subjects of breaches. Storing corporate documents (which often contain personal data of directors) makes BZ Intelligence a data controller.

### Minimum Viable Security Architecture

**Encryption at rest:** Every file in R2 must be uploaded with `ServerSideEncryption: 'AES256'`. This is a single line in the upload command and is already shown in the tech stack documentation. Non-negotiable.

**Org-scoped storage paths:** R2 key structure must be `{orgId}/{docId}/{filename}` — never just `{filename}`. The API layer must verify that the requesting user's `orgId` matches the document's `orgId` before generating a signed URL. This is already the design in `TECHSTACK.md`.

**Signed URLs only:** Never make document URLs public. Always use `getSignedUrl` from `@aws-sdk/s3-request-presigner` with a maximum 1-hour expiry. Documents are never accessible via a persistent URL.

**No admin override:** No employee of BZ Intelligence should be able to access user documents by default. Build the system such that accessing a document requires org membership. If support access is ever needed, it must be granted explicitly by the user and logged.

**Soft deletes:** Never hard-delete a document immediately. Add a `deletedAt` timestamp column. Mark as deleted, stop showing it in the UI, and run an actual R2 deletion after 30 days. This protects against accidental deletions.

**Audit log:** Log every document upload, view (signed URL generation), and deletion with timestamp, userId, and IP address. Store in a separate `document_audit_log` table. Never delete audit logs.

### Disclaimers and Terms Required

The Terms of Service must state explicitly:
1. BZ Intelligence is a document storage and organization tool. We are not a custodian of legal documents.
2. We do not guarantee the accuracy of AI-extracted data. Users must verify all extracted information against original documents.
3. We do not guarantee document preservation in perpetuity. Users are responsible for maintaining their own primary copies.
4. AI-based compliance guidance does not constitute legal advice. Reliance on AI-generated compliance information is at the user's own risk.
5. In the event of a service termination, users will have 30 days to export their documents before deletion.

Every document upload screen must show a visible disclaimer: "BZ Intelligence stores your documents for your organizational convenience. This does not replace your obligation to retain primary copies."

Every AI extraction result must show: "Extracted by AI. Verify against the original document before relying on this information."

### What NOT to Do

**Never store raw financial statements from third parties.** If a consultant is uploading a client's bank statements or financial audits, that is a different level of sensitivity. The MVP vault is for compliance documents: certificates, licenses, permits, tax clearances. These are the founder's own regulatory documents. Do not accept balance sheets, payroll records, or shareholder agreements until you have a formal data processing agreement in place.

**Never run AI extraction on documents without the user's explicit consent.** The upload UI must clearly state: "We will use AI to analyze this document to extract key dates and information." Do not bury this in terms of service.

**Never allow documents to be cross-shared between organizations without explicit user action.** The multi-tenancy enforcement via `orgId` scoping must be applied to every document query. Write a test that verifies User A from Org A cannot retrieve User B's documents from Org B, even if they know the document ID.

**Never train your AI models on user documents.** This should be explicitly stated in the privacy policy. The `generateObject` call for document extraction goes to Anthropic's API. Ensure Anthropic's API is configured with data retention disabled (this is available via Anthropic's API settings). Do not use user document content to fine-tune models.

**Do not store documents indefinitely on the free tier.** Free tier should have a 90-day document retention policy. After 90 days, free-tier documents are soft-deleted. This controls storage costs and creates a compelling upgrade reason.

---

## Decision Summary

| Decision | Verdict |
|----------|---------|
| Build Document Vault? | Yes — but only after Phase 1 compliance MVP is validated |
| Build Consultant Product? | Only after 3 law firms manually request it |
| Two chat UIs look the same? | Redesign immediately — color, tone, tier gating, constraints |
| Compliance Chat free tier? | Yes — 5 queries/month free |
| Market Analyst free tier? | No — Pro only, entirely |
| Vault on free tier? | No vault at all — Pro tier feature |
| Consultant pricing? | $149/month for up to 20 clients |
| Store financial statements? | No — compliance documents only in MVP |
| AI extraction liability? | Manageable with correct disclaimers and mandatory user verification |
| Build Concept B (consultant) speculatively? | No — validate with 3 paying firms before building |
