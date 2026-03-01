import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2 } from 'lucide-react'

async function getCompanies() {
  return db.select().from(companies).limit(50)
}

export default async function IntelligencePage() {
  const companyList = await getCompanies()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Company Directory</h1>
          <p className="text-zinc-500 text-sm">Verified companies operating in Rwanda</p>
        </div>
        <Badge variant="secondary">{companyList.length} companies</Badge>
      </div>

      {/* Search (static for now) */}
      <div className="mb-4">
        <Input placeholder="Search companies by name or sector..." className="max-w-sm" />
      </div>

      {companyList.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <Building2 className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Company directory is being built.</p>
          <p className="text-xs mt-1">Data ingestion pipeline coming in Phase 2.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companyList.map((company) => (
            <div key={company.id} className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm text-zinc-900">{company.name}</h3>
                {company.status && (
                  <Badge variant={company.status === 'active' ? 'secondary' : 'outline'} className="text-xs ml-2 shrink-0">
                    {company.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{company.description || 'No description available'}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {company.sector && <Badge variant="outline" className="text-xs">{company.sector}</Badge>}
                {company.stage && <span className="text-xs text-zinc-400">{company.stage}</span>}
                {company.hqDistrict && <span className="text-xs text-zinc-400">{company.hqDistrict}</span>}
              </div>
              {company.lastVerifiedAt && (
                <p className="text-xs text-zinc-300 mt-2">
                  Verified {new Date(company.lastVerifiedAt).toLocaleDateString('en-RW', { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
