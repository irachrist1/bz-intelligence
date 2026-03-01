export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-semibold text-lg tracking-tight">
            BZ Intelligence
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
