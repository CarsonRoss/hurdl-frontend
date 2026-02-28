import { useMemo, useState } from 'react'

function normalizeBase(base) {
  return base.replace(/\/+$/, '')
}

function resolveLoginUrl() {
  const configured = import.meta.env.VITE_AGENCY_LOGIN_URL
  if (configured) return configured

  const base = import.meta.env.VITE_BACKEND_URL
  if (base) return `${normalizeBase(base)}/agency/login`

  // Netlify proxy path (configured in netlify.toml).
  return '/agency-api/login'
}

function mapErrorMessage(status, payload) {
  const text = String(payload?.error || payload?.message || '').toLowerCase()
  if (text.includes('phone')) return 'Wrong phone number.'
  if (text.includes('password')) return 'Wrong password.'
  if (status === 401) return 'Wrong phone number or password.'
  return 'Unable to login right now. Please try again.'
}

export default function AgencyLogin() {
  const loginUrl = useMemo(resolveLoginUrl, [])
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = phone.trim().length > 0 && password.length > 0 && !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone.trim(),
          password,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(mapErrorMessage(response.status, payload))
        return
      }

      setSuccess('Login successful.')
    } catch {
      setError('Unable to connect to the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-white px-6 py-10 text-[#1a1a1a]"
      style={{ fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <section className="w-full max-w-[400px] px-6 py-8">
        <h1 className="mb-1 text-center text-5xl font-black tracking-[-0.02em] text-[#ff6a33]">Hurdl</h1>

        <div className="mb-6">
          {error ? (
            <p className="rounded-lg border border-[#f5c6cb] bg-[#fdecea] px-4 py-3 text-[0.85rem] text-[#c0392b]">{error}</p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-[#b7e1a1] bg-[#eafbe7] px-4 py-3 text-[0.85rem] text-[#1a7f37]">{success}</p>
          ) : null}
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="phone" className="mb-[0.4rem] block text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-[#555]">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              className="block w-full rounded-[8px] border-[1.5px] border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#ff6a33] focus:ring-[3px] focus:ring-[#ff6a33]/12"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-[0.4rem] block text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-[#555]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="block w-full rounded-[8px] border-[1.5px] border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#ff6a33] focus:ring-[3px] focus:ring-[#ff6a33]/12"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-[8px] bg-[#ff6a33] px-5 py-[0.85rem] text-base font-black text-white transition hover:bg-[#e55a28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
