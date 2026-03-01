import { seedRegulatoryBodies } from './regulatory-bodies'
import { seedComplianceSteps } from './compliance-steps'

async function main() {
  console.log('🌱 Starting database seed...\n')
  await seedRegulatoryBodies()
  await seedComplianceSteps()
  console.log('\n✅ Seed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
