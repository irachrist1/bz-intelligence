'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const { error } = await signIn.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
      callbackURL: searchParams.get('callbackUrl') || '/dashboard',
    })

    if (error) {
      toast.error(error.message || 'Sign in failed')
      setLoading(false)
    } else {
      router.push(searchParams.get('callbackUrl') || '/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}

export default function SignInPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<div className="space-y-3 animate-pulse"><div className="h-9 bg-zinc-100 rounded" /><div className="h-9 bg-zinc-100 rounded" /><div className="h-9 bg-zinc-100 rounded" /></div>}>
          <SignInForm />
        </Suspense>
      </CardContent>
      <CardFooter className="text-sm text-center text-zinc-500 justify-center">
        No account?{' '}
        <Link href="/sign-up" className="ml-1 text-zinc-900 font-medium hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  )
}
