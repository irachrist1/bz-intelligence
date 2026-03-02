'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function resolveSafeCallback(pathname: string | null) {
  if (!pathname) return '/dashboard'
  return pathname.startsWith('/') ? pathname : '/dashboard'
}

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const callbackUrl = useMemo(
    () => resolveSafeCallback(searchParams.get('callbackUrl')),
    [searchParams],
  )

  const onboardingTarget = callbackUrl === '/dashboard'
    ? '/onboarding'
    : `/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`

  const signInHref = callbackUrl === '/dashboard'
    ? '/sign-in'
    : `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const form = new FormData(e.currentTarget)

    const { error } = await signUp.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
      name: form.get('name') as string,
      callbackURL: onboardingTarget,
    })

    if (error) {
      const message = error.message || 'Sign up failed. Please try again.'
      setErrorMessage(message)
      toast.error(message)
      setLoading(false)
      return
    }

    router.replace(onboardingTarget)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" type="text" required autoComplete="name" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Use at least 8 characters.</p>
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <CardFooter className="text-sm text-center text-zinc-500 dark:text-zinc-400 justify-center px-0 pt-5">
        Already have an account?
        <Link href={signInHref} className="ml-1 text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </>
  )
}

export default function SignUpPage() {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Set up your tender monitoring workspace in under 2 minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={(
            <div className="space-y-3 animate-pulse">
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          )}
        >
          <SignUpForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
