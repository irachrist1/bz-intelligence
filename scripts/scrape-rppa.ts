import { resolve } from 'path'

process.loadEnvFile(resolve(process.cwd(), '.env.local'))

import * as cheerio from 'cheerio'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenders } from '@/lib/db/schema'

const LIST_URL = 'https://www.umucyo.gov.rw/eb/bav/selectListAdvertisingListForGU.do?menuId=EB01020100&leftTopFlag=l'
const DETAIL_URL = 'https://www.umucyo.gov.rw/eb/bav/selectAdvertisingDtlInfo.do'
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const RECORDS_PER_PAGE = 50
const MIN_PAGES = 3
const MAX_PAGES = 25
const DETAIL_CONCURRENCY = 6

type ListTender = {
  sourceId: string
  sourceUrl: string
  title: string
  tenderTypeCode: string
  datePosted: Date | null
  deadlineSubmission: Date | null
}

type TenderInsert = typeof tenders.$inferInsert

class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly url: string
  ) {
    super(`Request failed with status ${status} for ${url}`)
  }
}

function sleep(ms: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function parseRppaDate(value: string | null | undefined) {
  const normalized = normalizeText(value)
  if (!normalized) return null

  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2})(?::|h)(\d{2}))?/)
  if (!match) return null

  const [, day, month, year, hour, minute] = match
  const kigaliHour = hour ? Number(hour) : 12
  const kigaliMinute = minute ? Number(minute) : 0

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), kigaliHour - 2, kigaliMinute))
}

function parseInteger(value: string | null | undefined) {
  if (!value) return null

  const cleaned = value.replace(/[^\d]/g, '')
  if (!cleaned) return null

  const parsed = Number.parseInt(cleaned, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function buildDetailUrl(sourceId: string, tendStageCd: string, tenderTypeCode: string) {
  const url = new URL(DETAIL_URL)
  url.searchParams.set('tendReferNo', sourceId)
  url.searchParams.set('tendStageCd', tendStageCd)
  url.searchParams.set('tendTypeCd', tenderTypeCode)
  return url.toString()
}

async function fetchHtml(url: string, init: RequestInit = {}, label = 'request') {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; BZ-Intelligence/1.0; +https://www.umucyo.gov.rw)',
          accept: 'text/html,application/xhtml+xml',
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (!response.ok) {
        throw new HttpStatusError(response.status, url)
      }

      return await response.text()
    } catch (error) {
      lastError = error
      const reason = error instanceof Error ? error.message : String(error)

      if (attempt < MAX_RETRIES) {
        console.warn(`[rppa] ${label} failed (attempt ${attempt}/${MAX_RETRIES}): ${reason}`)
        await sleep(attempt * 750)
        continue
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

function parseLastPageNumber($: cheerio.CheerioAPI) {
  const lastPageLink = $('a.last_page').attr('onclick') ?? ''
  const match = lastPageLink.match(/fn_pageview\((\d+)\)/)
  return match ? Number.parseInt(match[1], 10) : MIN_PAGES
}

function parseListPage(html: string) {
  const $ = cheerio.load(html)
  const rows = $('form[name="frm_advSearchList"] table.article_table tbody tr')
  const tendersOnPage: ListTender[] = []

  rows.each((_, row) => {
    const $row = $(row)
    const inputValue = $row.find('input[name="tenderNo"]').attr('value')
    if (!inputValue) return

    const parts = inputValue.split('|').map((part) => normalizeText(part))
    if (parts.length < 8) return

    const [sourceId, title, , , tendStageCd, , tenderTypeCode, deadlineValue] = parts
    if (!sourceId || !title || !tendStageCd || !tenderTypeCode) return

    const cells = $row.find('td')
    const datePosted = parseRppaDate(cells.eq(4).text())
    const deadlineSubmission = parseRppaDate(deadlineValue || cells.eq(5).text())

    tendersOnPage.push({
      sourceId,
      sourceUrl: buildDetailUrl(sourceId, tendStageCd, tenderTypeCode),
      title,
      tenderTypeCode,
      datePosted,
      deadlineSubmission,
    })
  })

  return {
    tenders: tendersOnPage,
    lastPage: parseLastPageNumber($),
  }
}

function getFieldValue($: cheerio.CheerioAPI, label: string) {
  let value: string | null = null

  $('th').each((_, cell) => {
    const text = normalizeText($(cell).text())
    if (text !== label) return

    value = normalizeText($(cell).next('td').text())
    return false
  })

  return value
}

function stripHtml(html: string | null | undefined) {
  const normalized = normalizeText(html)
  if (!normalized) return null
  return normalizeText(cheerio.load(`<div>${normalized}</div>`).text())
}

function normalizeTenderType(value: string | null | undefined, tenderTypeCode: string) {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized.includes('consultant')) return 'consultant_services'
  if (normalized.includes('non consultant')) return 'non_consultant_services'
  if (normalized.includes('goods')) return 'goods'
  if (normalized.includes('works')) return 'works'

  if (tenderTypeCode === 'C') return 'consultant_services'
  if (tenderTypeCode === 'NC') return 'non_consultant_services'
  if (tenderTypeCode === 'G') return 'goods'
  if (tenderTypeCode === 'W') return 'works'

  return null
}

function deriveCategoryTags(params: {
  title: string
  description: string | null
  tenderType: string | null
}) {
  const haystack = `${params.title} ${params.description ?? ''}`.toLowerCase()
  const tags: string[] = []

  const pushTag = (tag: string, condition: boolean) => {
    if (condition && !tags.includes(tag)) {
      tags.push(tag)
    }
  }

  pushTag('consulting', params.tenderType === 'consultant_services' || /\bconsult\w*/.test(haystack))
  pushTag('legal', /\blegal\b|\blaw\b|\battorney\b|\blaw firm/.test(haystack))
  pushTag('it', /\bit\b|\bict\b|software|system|digital|developer|gps|platform|application|iot/.test(haystack))
  pushTag('audit', /\baudit\b/.test(haystack))
  pushTag('training', /\btraining\b|workshop|capacity building/.test(haystack))
  pushTag('advisory', /advisory|evaluation|assessment|survey|study|analyst|valuation|supervision/.test(haystack))
  pushTag('construction', params.tenderType === 'works' || /construction|rehabilitation|road|building|bridge|irrigation/.test(haystack))
  pushTag('maintenance', /maintenance|repair|servicing/.test(haystack))
  pushTag('insurance', /insurance/.test(haystack))
  pushTag('supply', params.tenderType === 'goods' || /supply|equipment|materials|fuel|furniture|hardware/.test(haystack))
  pushTag('services', params.tenderType === 'non_consultant_services' || /\bservices?\b/.test(haystack))

  if (tags.length === 0 && params.tenderType === 'goods') tags.push('supply')
  if (tags.length === 0 && params.tenderType === 'works') tags.push('construction')
  if (tags.length === 0 && params.tenderType === 'consultant_services') tags.push('consulting')
  if (tags.length === 0 && params.tenderType === 'non_consultant_services') tags.push('services')

  return tags.slice(0, 3)
}

function parseEstimatedValueRwf($: cheerio.CheerioAPI) {
  let value: number | null = null

  $('th').each((_, cell) => {
    const label = normalizeText($(cell).text()).toLowerCase()
    if (!/(estimated|estimate|budget|project cost|procurement value|tender value)/.test(label)) return
    if (/security|fee/.test(label)) return

    const candidate = normalizeText($(cell).next('td').text())
    if (!candidate) return

    const parsed = parseInteger(candidate)
    if (parsed && /(frw|rwf|rwandan)/i.test(candidate)) {
      value = parsed
      return false
    }
  })

  return value
}

async function collectActiveTenders() {
  const collected: ListTender[] = []
  const seenSourceIds = new Set<string>()
  const now = new Date()
  let page = 1
  let lastPage = MIN_PAGES

  while (page <= Math.min(lastPage, MAX_PAGES)) {
    const body = new URLSearchParams({
      tendStatCd: 'ADV',
      recordCountPerPage: String(RECORDS_PER_PAGE),
      currentPageNo: String(page),
    })

    const html = await fetchHtml(
      LIST_URL,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
      },
      `fetch list page ${page}`
    )

    const parsed = parseListPage(html)
    lastPage = Math.max(lastPage, parsed.lastPage)

    if (parsed.tenders.length === 0) {
      if (page >= MIN_PAGES) break
      page += 1
      continue
    }

    const activeOnPage = parsed.tenders.filter((tender) => {
      if (!tender.deadlineSubmission) return false
      return tender.deadlineSubmission.getTime() > now.getTime()
    })

    for (const tender of activeOnPage) {
      if (seenSourceIds.has(tender.sourceId)) continue
      seenSourceIds.add(tender.sourceId)
      collected.push(tender)
    }

    if (page >= MIN_PAGES && activeOnPage.length === 0) {
      break
    }

    page += 1
  }

  return collected
}

function parseDetailPage(listTender: ListTender, html: string): TenderInsert {
  const $ = cheerio.load(html)
  const descriptionHtml = $('#eBBAVInvitVO\\.contnt').attr('value')
  const description = stripHtml(descriptionHtml) ?? getFieldValue($, 'Brief Description')
  const title = listTender.title || getFieldValue($, 'Tender Name') || 'Untitled tender'
  const issuingOrg = getFieldValue($, 'Advertising/Procuring Entity') ?? 'Unknown issuer'
  const tenderType = normalizeTenderType(getFieldValue($, 'Tender Type'), listTender.tenderTypeCode)
  const deadlineSubmission =
    parseRppaDate(getFieldValue($, 'Deadline for Bids Submission')) ?? listTender.deadlineSubmission
  const categoryTags = deriveCategoryTags({ title, description, tenderType })

  return {
    source: 'rppa',
    sourceId: listTender.sourceId,
    title,
    issuingOrg,
    tenderType,
    categoryTags,
    description,
    estimatedValueRwf: parseEstimatedValueRwf($),
    estimatedValueUsd: null,
    deadlineSubmission,
    datePosted: listTender.datePosted,
    sourceUrl: listTender.sourceUrl,
    status: 'open',
    reviewStatus: 'pending',
    country: 'rw',
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

async function loadExistingSourceIds() {
  const rows = await db
    .select({ sourceId: tenders.sourceId })
    .from(tenders)
    .where(eq(tenders.source, 'rppa'))

  return new Set(rows.map((row) => row.sourceId).filter((value): value is string => Boolean(value)))
}

async function main() {
  const existingSourceIds = await loadExistingSourceIds()
  const fetchedTenders = await collectActiveTenders()
  const fetchedCount = fetchedTenders.length

  let duplicateCount = 0
  const newCandidates: ListTender[] = []

  for (const tender of fetchedTenders) {
    if (existingSourceIds.has(tender.sourceId)) {
      duplicateCount += 1
      continue
    }

    existingSourceIds.add(tender.sourceId)
    newCandidates.push(tender)
  }

  let failedCount = 0

  const parsedRecords = await mapWithConcurrency(newCandidates, DETAIL_CONCURRENCY, async (tender) => {
    try {
      const html = await fetchHtml(tender.sourceUrl, {}, `fetch detail ${tender.sourceId}`)
      return parseDetailPage(tender, html)
    } catch (error) {
      failedCount += 1
      const reason = error instanceof Error ? error.message : String(error)
      console.warn(`[rppa] Skipping ${tender.sourceId}: ${reason}`)
      return null
    }
  })

  let insertedCount = 0

  for (const record of parsedRecords) {
    if (!record) continue

    await db.insert(tenders).values(record)
    insertedCount += 1
  }

  console.log(`[rppa] Summary: fetched ${fetchedCount}, new ${insertedCount}, skipped duplicates ${duplicateCount}`)

  if (failedCount > 0) {
    console.warn(`[rppa] Warnings: ${failedCount} tender(s) were skipped after repeated fetch/parse failures.`)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[rppa] Scrape failed: ${message}`)
    process.exit(1)
  })
