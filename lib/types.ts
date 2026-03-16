export type FirmProfile = {
  id: string
  orgId: string
  firmName: string | null
  legalEntityType: string | null
  serviceCategories: string[] | null
  sectors: string[] | null
  contractSizeMinUsd: number | null
  contractSizeMaxUsd: number | null
  fundingSources: string[] | null
  countries: string[] | null
  languages: string[] | null
  keywordsInclude: string[] | null
  keywordsExclude: string[] | null
  createdAt: Date | null
  updatedAt: Date | null
}
