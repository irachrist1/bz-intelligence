'use client'

import { useEffect, useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  FolderLock,
  FileText,
  Receipt,
  Shield,
  MapPin,
  Upload,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Category config ───────────────────────────────────────────────────────────

type Category = 'incorporation' | 'license' | 'tax_cert' | 'permit'

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: 'incorporation',
    label: 'Incorporation',
    icon: FileText,
    description: 'Certificate of incorporation, memorandum & articles of association',
  },
  {
    value: 'license',
    label: 'Licenses',
    icon: Shield,
    description: 'Operating licenses from BNR, RURA, RISA, and other regulatory bodies',
  },
  {
    value: 'tax_cert',
    label: 'Tax Certificates',
    icon: Receipt,
    description: 'TIN certificate, VAT registration, PAYE clearance certificates',
  },
  {
    value: 'permit',
    label: 'Permits',
    icon: MapPin,
    description: 'Local government permits, trading licences, sector-specific approvals',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function expiryStatus(expiresAt: string | null): 'ok' | 'soon' | 'expired' | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  const days = diff / (1000 * 60 * 60 * 24)
  if (days < 0) return 'expired'
  if (days < 30) return 'soon'
  return 'ok'
}

// ── Document row ──────────────────────────────────────────────────────────────

type DocRow = {
  id: string
  filename: string
  mimeType: string | null
  sizeBytes: number | null
  docCategory: string | null
  expiresAt: string | null
  uploadedAt: string | null
}

function DocItem({ doc, onDelete }: { doc: DocRow; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const status = expiryStatus(doc.expiresAt)

  async function handleDelete() {
    if (!confirm(`Remove "${doc.filename}" from the vault?`)) return
    setDeleting(true)
    await fetch(`/api/compliance/documents?id=${doc.id}`, { method: 'DELETE' })
    onDelete(doc.id)
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 group">
      <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{doc.filename}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {doc.sizeBytes ? (
            <span className="text-xs text-zinc-400">{formatBytes(doc.sizeBytes)}</span>
          ) : null}
          {doc.uploadedAt ? (
            <span className="text-xs text-zinc-400">Uploaded {formatDate(doc.uploadedAt)}</span>
          ) : null}
          {doc.expiresAt ? (
            <span
              className={cn('text-xs flex items-center gap-1', {
                'text-red-500 dark:text-red-400': status === 'expired',
                'text-amber-500 dark:text-amber-400': status === 'soon',
                'text-zinc-400': status === 'ok',
              })}
            >
              {status === 'expired' && <AlertTriangle className="h-3 w-3" />}
              {status === 'soon' && <Clock className="h-3 w-3" />}
              {status === 'ok' && <CheckCircle2 className="h-3 w-3" />}
              Expires {formatDate(doc.expiresAt)}
            </span>
          ) : null}
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50"
        title="Remove document"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection({
  category,
  docs,
  onDelete,
}: {
  category: (typeof CATEGORIES)[number]
  docs: DocRow[]
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const Icon = category.icon
  const hasAlert = docs.some((d) => {
    const s = expiryStatus(d.expiresAt)
    return s === 'expired' || s === 'soon'
  })

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{category.label}</span>
            {docs.length > 0 && (
              <Badge variant="secondary" className="text-xs h-4 px-1.5">{docs.length}</Badge>
            )}
            {hasAlert && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{category.description}</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4">
          {docs.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No {category.label.toLowerCase()} documents yet</p>
            </div>
          ) : (
            docs.map((doc) => (
              <DocItem key={doc.id} doc={doc} onDelete={onDelete} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Upload zone (Phase 3 placeholder — requires R2) ──────────────────────────

function UploadZone() {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false) }}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
        dragging
          ? 'border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50'
          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900',
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
        <Upload className="h-5 w-5 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload documents</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        PDF, PNG, or JPG · Incorporation certificates, licenses, tax documents, permits
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        File upload coming in Phase 3 — requires Cloudflare R2 setup
      </div>
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" disabled />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentVaultPage() {
  const [docs, setDocs] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/compliance/documents')
      .then((r) => r.json())
      .then((data) => {
        setDocs(data.documents ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleDelete(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  const totalDocs = docs.length
  const expiringCount = docs.filter((d) => {
    const s = expiryStatus(d.expiresAt)
    return s === 'expired' || s === 'soon'
  }).length

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
              <FolderLock className="h-4 w-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Document Vault</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Store and track your compliance documents — licenses, certificates, permits
          </p>
        </div>

        {!loading && totalDocs > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {totalDocs} document{totalDocs !== 1 ? 's' : ''}
            </span>
            {expiringCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiringCount} expiring soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Upload zone */}
      <div className="mb-6">
        <UploadZone />
      </div>

      {/* Document categories */}
      {loading ? (
        <div className="space-y-3">
          {CATEGORIES.map((c) => (
            <div key={c.value} className="h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((category) => (
            <CategorySection
              key={category.value}
              category={category}
              docs={docs.filter((d) => d.docCategory === category.value)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center mt-6">
        Documents are encrypted at rest and accessible only to your organisation.
      </p>
    </div>
  )
}
