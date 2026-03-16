import { resolve } from 'path'

process.loadEnvFile(resolve(process.cwd(), '.env.local'))

import { and, eq } from 'drizzle-orm'
import { load } from 'cheerio'
import { db } from '@/lib/db'
import { tenders } from '@/lib/db/schema'

const BASE_URL = 'https://www.umucyo.gov.rw'
const LIST_PATH = '/eb/bav/selectListAdvertisingListForGU.do'
const DETAIL_PATH = '/eb/bav/selectAdvertisingDtlInfo.do'
const LOCAL_TIMEZONE_OFFSET = '+02:00'
const DEFAULT_TARGET_COUNT = Number(process.env.SEED_TENDERS_LIMIT ?? 24)
const MAX_PAGES = 3
const RECORDS_PER_PAGE = 50
const FETCH_HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; bz-intelligence/1.0; +https://www.umucyo.gov.rw)',
}

type ListTender = {
  sourceId: string
  title: string
  statusLabel: string
  datePosted: Date | null
  listingDeadline: Date | null
  tenderStageCd: string
  tenderTypeCd: string
  sourceUrl: string
}

type SeedTender = {
  sourceId: string
  sourceUrl: string
  title: string
  issuingOrg: string
  description: string
  categoryTags: string[]
  deadlineSubmission: Date
  datePosted: Date | null
  estimatedValueRwf: number | null
  currency: string | null
  tenderType: string | null
}

function normalizeWhitespace(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function stripHtml(value: string | null | undefined): string {
  if (!value) return ''
  const $ = load(`<div>${value}</div>`)
  return normalizeWhitespace($.text())
}

function parseRppaDate(value: string): Date | null {
  const match = normalizeWhitespace(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  const parsed = new Date(`${year}-${month}-${day}T12:00:00${LOCAL_TIMEZONE_OFFSET}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseRppaDateTime(value: string): Date | null {
  const match = normalizeWhitespace(value).match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  if (!match) return null
  const [, day, month, year, hour, minute] = match
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:00${LOCAL_TIMEZONE_OFFSET}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseMoney(value: string): number | null {
  const digits = normalizeWhitespace(value).replace(/[^\d]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : null
}

function buildListUrl(page: number): string {
  const url = new URL(LIST_PATH, BASE_URL)
  url.searchParams.set('menuId', 'EB01020100')
  url.searchParams.set('leftTopFlag', 'l')
  url.searchParams.set('tendTypeCd', 'C')
  url.searchParams.set('recordCountPerPage', String(RECORDS_PER_PAGE))
  url.searchParams.set('currentPageNo', String(page))
  return url.toString()
}

function buildDetailUrl(sourceId: string, tenderStageCd: string, tenderTypeCd: string): string {
  const url = new URL(DETAIL_PATH, BASE_URL)
  url.searchParams.set('tendReferNo', sourceId)
  url.searchParams.set('tendStageCd', tenderStageCd)
  url.searchParams.set('tendTypeCd', tenderTypeCd)
  url.searchParams.set('currentPageNo', '1')
  return url.toString()
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: FETCH_HEADERS })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

function parseListPage(html: string): ListTender[] {
  const $ = load(html)
  const rows = $('form[name="frm_advSearchList"] table.article_table tbody tr').toArray()
  const items: ListTender[] = []

  for (const row of rows) {
    const anchor = $(row).find('a[href*="ViewDetail"]').first()
    const href = anchor.attr('href') ?? ''
    const match = href.match(/ViewDetail\('([^']+)','([^']+)','([^']+)'\)/)
    if (!match) continue

    const [, sourceId, tenderStageCd, tenderTypeCd] = match
    const cells = $(row).find('td')
    const statusLabel = normalizeWhitespace(cells.eq(3).text())
    const datePosted = parseRppaDate(cells.eq(4).text())
    const listingDeadline = parseRppaDateTime(cells.eq(5).text())
    const title = normalizeWhitespace(anchor.text())

    items.push({
      sourceId,
      title,
      statusLabel,
      datePosted,
      listingDeadline,
      tenderStageCd,
      tenderTypeCd,
      sourceUrl: buildDetailUrl(sourceId, tenderStageCd, tenderTypeCd),
    })
  }

  return items
}

function findCellValue($: ReturnType<typeof load>, label: string): string {
  const normalizedLabel = normalizeWhitespace(label).toLowerCase()

  for (const th of $('th').toArray()) {
    const current = normalizeWhitespace($(th).text()).toLowerCase()
    if (current === normalizedLabel) {
      return normalizeWhitespace($(th).next('td').text())
    }
  }

  return ''
}

function deriveCategoryTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const tags = new Set<string>(['consulting'])

  const keywordTags: Array<[RegExp, string]> = [
    [/\blegal\b|law|attorney|compliance/, 'legal'],
    [/\baudit\b|assurance|financial statements?|internal control/, 'audit'],
    [/\btraining\b|capacity building|workshop|coaching/, 'training'],
    [/\bit\b|ict|software|system|platform|developer|digital|application/, 'it'],
    [/\badvisory\b|strategy|evaluation|baseline|survey|research|assessment|study/, 'advisory'],
    [/\bvaluation\b|certification|accreditation|iso|quality management/, 'quality'],
    [/\bsupervision\b|engineering|design|feasibility|road/, 'engineering'],
  ]

  for (const [pattern, tag] of keywordTags) {
    if (pattern.test(text)) tags.add(tag)
    if (tags.size >= 3) break
  }

  return Array.from(tags).slice(0, 3)
}

function extractDescription($: ReturnType<typeof load>): string {
  const invitationHtml = $('input[name="eBBAVInvitVO.contnt"]').attr('value') ?? ''
  const invitationText = stripHtml(invitationHtml)
  const briefDescription = findCellValue($, 'Brief Description')
  const description = invitationText || briefDescription
  return description ? description.slice(0, 5000) : ''
}

function extractPublishedValueRwf($: ReturnType<typeof load>): number | null {
  // Umucyo's public tender notices do not consistently expose a contract estimate.
  // The most reliable public monetary field on consultant notices is the published tender security amount.
  const tableAmount = $('h4')
    .filter((_, element) => normalizeWhitespace($(element).text()).toLowerCase() === 'consultant services')
    .first()
    .nextAll('table')
    .first()
    .find('tbody tr')
    .first()
    .find('td')
    .eq(2)
    .text()

  const parsedTableAmount = parseMoney(tableAmount)

  if (parsedTableAmount) return parsedTableAmount

  return parseMoney(findCellValue($, 'Tender Security (sum of LOTs)'))
}

function parseTenderType(tenderTypeText: string): string | null {
  const normalized = tenderTypeText.toLowerCase()
  if (normalized.includes('consultant')) return 'rfp'
  if (normalized.includes('goods')) return 'rfq'
  if (normalized.includes('works')) return 'rfp'
  return null
}

async function parseDetail(item: ListTender): Promise<SeedTender | null> {
  const html = await fetchHtml(item.sourceUrl)
  const $ = load(html)

  const title =
    normalizeWhitespace($('input[name="eBBAVInvitVO.title"]').attr('value')) ||
    normalizeWhitespace(findCellValue($, 'Tender Name')) ||
    item.title
  const issuingOrg = findCellValue($, 'Advertising/Procuring Entity')
  const deadlineSubmission =
    parseRppaDateTime($('input[name="submDlineDt"]').attr('value') ?? '') ?? item.listingDeadline
  const tenderTypeText = findCellValue($, 'Tender Type')
  const description = extractDescription($)
  const estimatedValueRwf = extractPublishedValueRwf($)

  if (!title || !issuingOrg || !description || !deadlineSubmission) return null

  return {
    sourceId: item.sourceId,
    sourceUrl: item.sourceUrl,
    title,
    issuingOrg,
    description,
    categoryTags: deriveCategoryTags(title, description),
    deadlineSubmission,
    datePosted: item.datePosted,
    estimatedValueRwf,
    currency: estimatedValueRwf ? 'RWF' : null,
    tenderType: parseTenderType(tenderTypeText),
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex], currentIndex)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker())
  await Promise.all(workers)
  return results
}

async function collectSeedCandidates(targetCount: number): Promise<SeedTender[]> {
  const listingItems: ListTender[] = []

  for (let page = 1; page <= MAX_PAGES && listingItems.length < targetCount * 2; page += 1) {
    const html = await fetchHtml(buildListUrl(page))
    const pageItems = parseListPage(html).filter((item) => {
      const deadline = item.listingDeadline
      if (!deadline) return false
      if (deadline.getTime() <= Date.now()) return false
      return item.statusLabel === 'Published' || item.statusLabel === 'Amended'
    })

    listingItems.push(...pageItems)
  }

  const uniqueListings = Array.from(
    new Map(listingItems.map((item) => [item.sourceId, item])).values()
  )

  const detailed = await mapWithConcurrency(uniqueListings, 5, async (item) => {
    try {
      return await parseDetail(item)
    } catch (error) {
      console.warn(`Skipping ${item.sourceId}: ${(error as Error).message}`)
      return null
    }
  })

  return detailed
    .filter((item): item is SeedTender => item !== null)
    .filter((item) => item.deadlineSubmission.getTime() > Date.now())
    .slice(0, targetCount)
}

async function seed() {
  const targetCount = Math.max(20, DEFAULT_TARGET_COUNT)
  console.log(`Fetching live RPPA consultant tenders (target: ${targetCount})...`)

  const candidates = await collectSeedCandidates(targetCount)
  if (candidates.length < 20) {
    throw new Error(`Only found ${candidates.length} qualifying open RPPA tenders; need at least 20.`)
  }

  const existing = await db
    .select({ id: tenders.id, sourceId: tenders.sourceId, sourceUrl: tenders.sourceUrl })
    .from(tenders)
    .where(eq(tenders.source, 'rppa'))

  const existingBySourceId = new Map(
    existing.filter((row) => row.sourceId).map((row) => [row.sourceId as string, row.id])
  )
  const existingBySourceUrl = new Map(
    existing.filter((row) => row.sourceUrl).map((row) => [row.sourceUrl as string, row.id])
  )

  let inserted = 0
  let updated = 0

  for (const tender of candidates) {
    const existingId = existingBySourceId.get(tender.sourceId) ?? existingBySourceUrl.get(tender.sourceUrl)
    const values = {
      source: 'rppa' as const,
      sourceId: tender.sourceId,
      title: tender.title,
      issuingOrg: tender.issuingOrg,
      tenderType: tender.tenderType,
      categoryTags: tender.categoryTags,
      description: tender.description,
      estimatedValueRwf: tender.estimatedValueRwf,
      currency: tender.currency,
      deadlineSubmission: tender.deadlineSubmission,
      datePosted: tender.datePosted,
      sourceUrl: tender.sourceUrl,
      status: 'open' as const,
      reviewStatus: 'approved' as const,
      country: 'rw' as const,
      updatedAt: new Date(),
    }

    if (existingId) {
      await db.update(tenders).set(values).where(and(eq(tenders.id, existingId), eq(tenders.source, 'rppa')))
      updated += 1
      continue
    }

    await db.insert(tenders).values(values)
    inserted += 1
  }

  console.log(`Seed complete. Qualified live tenders: ${candidates.length}`)
  console.log(`Inserted: ${inserted}`)
  console.log(`Updated existing: ${updated}`)
  console.log(`Skipped duplicates: ${Math.max(candidates.length - inserted - updated, 0)}`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
