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
  mode: 'compliance' | 'intelligence' | 'both'
}): Promise<void> {
  const displayName = opts.name || 'there'
  const modeText =
    opts.mode === 'intelligence'
      ? 'company intelligence and market research'
      : 'business compliance guidance'
  const ctaUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
  const ctaHref =
    opts.mode === 'intelligence'
      ? `${ctaUrl}/dashboard/intelligence`
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
    subject: 'Your Rwanda compliance workspace is ready',
    html,
  })
}
