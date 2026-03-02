import { resolve } from 'path'
// Load .env.local before any module that reads process.env (tsx doesn't auto-load it)
process.loadEnvFile(resolve(process.cwd(), '.env.local'))

import { db } from '@/lib/db'
import { tenderSources } from '@/lib/db/schema'

const sources = [
  {
    code: 'rppa',
    name: 'Rwanda Public Procurement Authority',
    url: 'https://www.rppa.gov.rw',
    scraperType: 'html',
    scraperStatus: 'manual',
    country: 'rw',
    active: true,
  },
  {
    code: 'world_bank',
    name: 'World Bank STEP',
    url: 'https://step.worldbank.org',
    scraperType: 'api',
    scraperStatus: 'manual',
    country: 'rw',
    active: true,
  },
  {
    code: 'ungm',
    name: 'UN Global Marketplace',
    url: 'https://www.ungm.org',
    scraperType: 'html',
    scraperStatus: 'manual',
    country: 'multi',
    active: true,
  },
  {
    code: 'adb',
    name: 'African Development Bank',
    url: 'https://www.afdb.org/en/projects-and-operations/procurement',
    scraperType: 'html',
    scraperStatus: 'manual',
    country: 'multi',
    active: true,
  },
  {
    code: 'usaid',
    name: 'USAID Rwanda',
    url: 'https://www.usaid.gov/rwanda',
    scraperType: 'html',
    scraperStatus: 'manual',
    country: 'rw',
    active: true,
  },
  {
    code: 'eu',
    name: 'EU Delegations (EuropeAid)',
    url: 'https://webgate.ec.europa.eu/europeaid/online-services/index.cfm',
    scraperType: 'html',
    scraperStatus: 'manual',
    country: 'multi',
    active: true,
  },
  {
    code: 'giz',
    name: 'GIZ Rwanda',
    url: 'https://www.giz.de/en/worldwide/363.html',
    scraperType: 'html',
    scraperStatus: 'manual',
    country: 'rw',
    active: true,
  },
  {
    code: 'kigali_city',
    name: 'City of Kigali Procurement',
    url: 'https://www.kigalicity.gov.rw',
    scraperType: 'html',
    scraperStatus: 'manual',
    country: 'rw',
    active: true,
  },
]

async function seed() {
  for (const source of sources) {
    await db.insert(tenderSources).values(source).onConflictDoNothing()
  }
  console.log(`Seeded ${sources.length} tender sources.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
