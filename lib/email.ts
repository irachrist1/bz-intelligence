/**
 * Email utilities via Resend.
 * Fails gracefully — email errors are logged but never bubble up to users.
 *
 * Before sending in production, verify your domain at resend.com/domains
 * and update FROM_ADDRESS below.
 */

const FROM_ADDRESS = process.env.EMAIL_FROM || 'BZ Intelligence <onboarding@resend.dev>'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

export async function sendWelcomeEmail(opts: {
  email: string
  name?: string | null
  sector?: string | null
  mode: 'compliance' | 'intelligence' | 'both' | 'tender'
}): Promise<void> {
  const displayName = opts.name || 'there'
  const modeText = opts.mode === 'intelligence'
    ? 'company intelligence and market research'
    : opts.mode === 'tender'
      ? 'tender monitoring and pipeline tracking'
      : 'business compliance guidance'
  const ctaUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
  const ctaHref = opts.mode === 'intelligence'
    ? `${ctaUrl}/dashboard/intelligence`
    : opts.mode === 'tender'
      ? `${ctaUrl}/dashboard/tenders`
      : `${ctaUrl}/dashboard/compliance`

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #111;">
      <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Welcome to BZ Intelligence</h1>
      <p style="color: #555; margin-top: 0;">Hi ${displayName},</p>
      <p style="color: #555;">
        Your workspace is ready. We've set up your personalized ${modeText} based on your business profile.
      </p>
      ${opts.sector ? `<p style="color: #555;">Sector: <strong>${opts.sector}</strong></p>` : ''}
      <a href="${ctaHref}" style="display: inline-block; background: #18181b; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; margin-top: 8px;">
        Open your dashboard →
      </a>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; margin: 0;">
        BZ Intelligence · The operating system for doing business in Rwanda<br />
        This is informational guidance, not legal advice.
      </p>
    </body>
    </html>
  `.trim()

  await sendEmail({
    to: opts.email,
    subject: opts.mode === 'tender'
      ? 'Your tender intelligence workspace is ready'
      : 'Your Rwanda compliance workspace is ready',
    html,
  })
}

// ─── Tender Alert Emails ──────────────────────────────────────────────────────

type TenderEmailInfo = {
  id: string
  title: string
  issuingOrg: string
  source: string
  fundingSource: string | null
  deadlineSubmission: Date | null
  estimatedValueUsd: number | null
  sourceUrl: string
}

function formatDeadline(date: Date | null): string {
  if (!date) return 'No deadline specified'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function deadlineColor(date: Date | null): string {
  if (!date) return '#6b7280'
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
  if (days <= 2) return '#dc2626'
  if (days <= 7) return '#d97706'
  return '#16a34a'
}

function tenderCard(tender: TenderEmailInfo, appUrl: string): string {
  const color = deadlineColor(tender.deadlineSubmission)
  const deadline = formatDeadline(tender.deadlineSubmission)
  const value = tender.estimatedValueUsd ? `$${tender.estimatedValueUsd.toLocaleString()}` : null
  const href = `${appUrl}/dashboard/tenders/${tender.id}`
  return `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="margin-bottom:6px;">
        <span style="font-size:11px;background:#f4f4f5;color:#52525b;padding:2px 8px;border-radius:999px;text-transform:uppercase;">${tender.source.replace('_', ' ')}</span>
        ${tender.fundingSource ? `<span style="font-size:11px;background:#f4f4f5;color:#52525b;padding:2px 8px;border-radius:999px;margin-left:4px;">${tender.fundingSource}</span>` : ''}
      </div>
      <p style="font-size:14px;font-weight:600;color:#111827;margin:6px 0 4px;">${tender.title}</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">${tender.issuingOrg}</p>
      <div style="font-size:12px;color:${color};font-weight:500;margin-bottom:4px;">Deadline: ${deadline}</div>
      ${value ? `<div style="font-size:12px;color:#374151;">Estimated value: ${value}</div>` : ''}
      <a href="${href}" style="display:inline-block;margin-top:10px;font-size:13px;color:#2563eb;text-decoration:none;">View tender →</a>
    </div>
  `
}

function emailShell(title: string, preheader: string, body: string): string {
  const settingsUrl = `${process.env.BETTER_AUTH_URL || ''}/dashboard/alerts`
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;padding:40px 20px;color:#111827;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <p style="font-size:13px;color:#6b7280;margin:0 0 24px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">BZ Intelligence</p>
  <h1 style="font-size:20px;font-weight:600;margin:0 0 20px;line-height:1.3;">${title}</h1>
  ${body}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
  <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
    BZ Intelligence · Procurement intelligence for East Africa<br />
    <a href="${settingsUrl}" style="color:#9ca3af;">Manage alert preferences</a>
  </p>
</body>
</html>`
}

export async function sendNewTenderMatchEmail(opts: {
  email: string
  name?: string | null
  tenders: TenderEmailInfo[]
}): Promise<void> {
  const appUrl = process.env.BETTER_AUTH_URL || 'https://app.bzintelligence.com'
  const displayName = opts.name || 'there'
  const count = opts.tenders.length
  const subject = count === 1
    ? '1 new tender matches your profile'
    : `${count} new tenders match your profile`

  const body = `
    <p style="color:#374151;margin:0 0 20px;">Hi ${displayName}, new procurement opportunities matching your firm profile just went live.</p>
    ${opts.tenders.map((t) => tenderCard(t, appUrl)).join('')}
    <a href="${appUrl}/dashboard/tenders" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500;margin-top:8px;">View all open tenders →</a>
  `

  await sendEmail({
    to: opts.email,
    subject,
    html: emailShell(subject, `${count} new tender${count === 1 ? '' : 's'} matching your profile.`, body),
  })
}

export async function sendDeadlineReminderEmail(opts: {
  email: string
  name?: string | null
  tender: TenderEmailInfo
  hoursUntilDeadline: number
}): Promise<void> {
  const appUrl = process.env.BETTER_AUTH_URL || 'https://app.bzintelligence.com'
  const displayName = opts.name || 'there'
  const days = Math.round(opts.hoursUntilDeadline / 24)
  const isCritical = days <= 2
  const urgencyLabel = isCritical ? '48-hour deadline alert' : '7-day deadline reminder'
  const urgencyColor = isCritical ? '#dc2626' : '#d97706'
  const timeText = isCritical ? 'closes in less than 48 hours' : `closes in ${days} days`
  const shortTitle = opts.tender.title.length > 70
    ? `${opts.tender.title.slice(0, 70)}…`
    : opts.tender.title

  const body = `
    <p style="color:#374151;margin:0 0 16px;">Hi ${displayName},</p>
    <p style="color:${urgencyColor};font-weight:600;margin:0 0 20px;">Submission deadline ${timeText} for a tender you saved.</p>
    ${tenderCard(opts.tender, appUrl)}
    <a href="${appUrl}/dashboard/tenders/${opts.tender.id}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500;margin-top:8px;">View tender →</a>
  `

  await sendEmail({
    to: opts.email,
    subject: `${urgencyLabel}: ${shortTitle}`,
    html: emailShell(urgencyLabel, `Submission deadline ${timeText}.`, body),
  })
}

export async function sendWeeklyDigestEmail(opts: {
  email: string
  name?: string | null
  tenders: TenderEmailInfo[]
  weekStart: Date
}): Promise<void> {
  const appUrl = process.env.BETTER_AUTH_URL || 'https://app.bzintelligence.com'
  const displayName = opts.name || 'there'
  const weekLabel = opts.weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  const count = opts.tenders.length
  const subject = `Weekly tender digest — week of ${weekLabel}`

  const body = count === 0
    ? `<p style="color:#6b7280;margin:0 0 20px;">Hi ${displayName}, no new tenders matching your firm profile were published last week. We're monitoring all sources and will alert you when something relevant appears.</p>`
    : `
      <p style="color:#374151;margin:0 0 20px;">Hi ${displayName}, here ${count === 1 ? 'is 1 tender' : `are ${count} tenders`} matching your firm profile published this week.</p>
      ${opts.tenders.map((t) => tenderCard(t, appUrl)).join('')}
      <a href="${appUrl}/dashboard/tenders" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500;margin-top:8px;">View all open tenders →</a>
    `

  await sendEmail({
    to: opts.email,
    subject,
    html: emailShell(subject, count === 0 ? 'No new matching tenders this week.' : `${count} new tender${count === 1 ? '' : 's'} this week.`, body),
  })
}
