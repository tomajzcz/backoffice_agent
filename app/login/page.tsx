"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get("from") ?? "/"
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError("Nesprávné heslo")
        setLoading(false)
        return
      }
      router.replace(from)
    } catch {
      setError("Přihlášení selhalo")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 p-6 rounded-xl border border-border/40 bg-secondary/20"
      >
        <div>
          <h1 className="text-lg font-semibold text-foreground">Back Office Agent</h1>
          <p className="text-xs text-muted-foreground mt-1">Zadej heslo pro přístup.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
          placeholder="Heslo"
          className="w-full text-sm bg-background border border-border/40 rounded px-3 py-2 outline-none focus:border-primary/40"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full text-sm font-medium px-3 py-2 rounded bg-primary/80 text-primary-foreground hover:bg-primary disabled:opacity-50"
        >
          {loading ? "Přihlašuji…" : "Přihlásit"}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
