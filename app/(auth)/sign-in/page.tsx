'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function resolveSafeCallback(pathname: string | null) {
  if (!pathname) return '/dashboard'
  return pathname.startsWith('/') ? pathname : '/dashboard'
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const callbackUrl = useMemo(
    () => resolveSafeCallback(searchParams.get('callbackUrl')),
    [searchParams],
  )

  const signUpHref = callbackUrl === '/dashboard'
    ? '/sign-up'
    : `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const form = new FormData(e.currentTarget)

    const { error } = await signIn.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
      callbackURL: callbackUrl,
    })

    if (error) {
      const message = error.message || 'Sign in failed. Please check your credentials.'
      setErrorMessage(message)
      toast.error(message)
      setLoading(false)
      return
    }

    router.replace(callbackUrl)
  }

  return (
    <>
      {callbackUrl !== '/dashboard' && (
        <div className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
          Sign in required to continue to <span className="font-medium text-zinc-700 dark:text-zinc-300">{callbackUrl}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <CardFooter className="text-sm text-center text-zinc-500 dark:text-zinc-400 justify-center px-0 pt-5">
        No account?
        <Link href={signUpHref} className="ml-1 text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </>
  )
}

export default function SignInPage() {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your tender intelligence workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={(
            <div className="space-y-3 animate-pulse">
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          )}
        >
          <SignInForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
