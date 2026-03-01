export type BusinessProfile = {
  id: string
  orgId: string
  userId: string
  bizName: string | null
  bizType: string | null
  sector: string | null
  subSector: string[] | null
  customerType: string | null
  currentStatus: string | null
  // Compliance trigger flags
  handlesMoney: boolean | null
  collectsData: boolean | null
  foreignOwnership: boolean | null
  operatesProvince: boolean | null
  employeeRange: string | null // '1' | '2-10' | '11-50' | '50+'
  // Legacy
  transactionType: string[] | null
  revenueModel: string | null
  employeeTarget: number | null
  hqDistrict: string | null
  tin: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type ComplianceStep = {
  id: string
  title: string
  description: string
  plainLanguage: string
  regBodyCode: string | null
  appliesSector: string[] | null
  appliesBizType: string[] | null
  appliesCustomer: string[] | null
  documentsReq: { name: string; description?: string; template_url?: string }[] | null
  applyUrl: string | null
  applyLocation: string | null
  costRwf: number | null
  timelineDays: number | null
  penaltyDescription: string | null
  stepOrder: number | null
  isOptional: boolean | null
  lastVerifiedAt: Date | null
}

export type ComplianceStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export type RoadmapEntry = ComplianceStep & {
  status: ComplianceStepStatus
  historyId: string | null
  notes: string | null
}

export type Citation = {
  title: string | null
  url: string | null
  date: string | null
  regBody: string | null
  lastVerified: string | undefined
}
