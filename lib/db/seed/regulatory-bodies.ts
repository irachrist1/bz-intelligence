import { db } from '@/lib/db'
import { regulatoryBodies } from '@/lib/db/schema'

const BODIES = [
  {
    code: 'RDB',
    name: 'Rwanda Development Board',
    description: 'Handles company registration, investment facilitation, and business environment improvement',
    website: 'https://rdb.rw',
    sectors: ['all'],
  },
  {
    code: 'RRA',
    name: 'Rwanda Revenue Authority',
    description: 'Tax administration: TIN registration, VAT, PAYE, corporate income tax',
    website: 'https://www.rra.gov.rw',
    sectors: ['all'],
  },
  {
    code: 'BNR',
    name: 'National Bank of Rwanda',
    description: 'Regulates financial institutions: banks, MFIs, payment service providers, forex bureaux',
    website: 'https://www.bnr.rw',
    sectors: ['fintech', 'banking', 'microfinance', 'insurance'],
  },
  {
    code: 'RURA',
    name: 'Rwanda Utilities Regulatory Authority',
    description: 'Regulates ICT, telecommunications, electricity, water, and transport sectors',
    website: 'https://www.rura.rw',
    sectors: ['ict', 'telecom', 'energy', 'transport'],
  },
  {
    code: 'RSB',
    name: 'Rwanda Standards Board',
    description: 'Standards, quality assurance, conformity assessment, and metrology',
    website: 'https://www.rsb.gov.rw',
    sectors: ['manufacturing', 'food', 'construction'],
  },
  {
    code: 'PSF',
    name: 'Private Sector Federation',
    description: 'Apex body for the private sector in Rwanda, advocacy and business services',
    website: 'https://www.psf.org.rw',
    sectors: ['all'],
  },
  {
    code: 'RSSB',
    name: 'Rwanda Social Security Board',
    description: 'Manages employee social security contributions (pension, health insurance)',
    website: 'https://www.rssb.rw',
    sectors: ['all'],
  },
  {
    code: 'RISA',
    name: 'Rwanda Information Society Authority',
    description: 'Regulates data protection and ICT policy in Rwanda',
    website: 'https://www.risa.gov.rw',
    sectors: ['ict', 'fintech', 'healthtech'],
  },
]

export async function seedRegulatoryBodies() {
  console.log('Seeding regulatory bodies...')
  for (const body of BODIES) {
    await db
      .insert(regulatoryBodies)
      .values(body)
      .onConflictDoUpdate({
        target: regulatoryBodies.code,
        set: { name: body.name, description: body.description, website: body.website, sectors: body.sectors },
      })
  }
  console.log(`✓ Seeded ${BODIES.length} regulatory bodies`)
}
