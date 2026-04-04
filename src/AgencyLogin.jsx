import { useEffect, useMemo, useState } from 'react'

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

function resolveRestrictionsUrl(path) {
  const base = import.meta.env.VITE_BACKEND_URL
  if (base) return `${normalizeBase(base)}/restrictions/${path}`
  return `/restrictions-api/${path}`
}

function mapErrorMessage(status, payload) {
  const text = String(payload?.error || payload?.message || '').toLowerCase()
  if (text.includes('phone')) return 'Wrong phone number.'
  if (text.includes('password')) return 'Wrong password.'
  if (status === 401) return 'Wrong phone number or password.'
  return 'Unable to login right now. Please try again.'
}

async function safeJson(response) {
  return response.json().catch(() => ({}))
}

const SESSION_KEY = 'hurdl_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function saveSession(token, agency) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, agency, ts: Date.now() }))
  } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (Date.now() - session.ts > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

function normalizeRestrictions(person) {
  return {
    ...person,
    restrictions: (person.restrictions || []).map((r) => (typeof r === 'string' ? { name: r } : r)),
  }
}

function fullName(person) {
  return `${person.first_name || ''} ${person.last_name || ''}`.trim()
}

function restrictionLabel(name, types) {
  const type = types.find((t) => t.name === name)
  if (!type) return name
  return type.category ? `${name} (${type.category})` : name
}

export default function AgencyLogin() {
  const loginUrl = useMemo(resolveLoginUrl, [])
  const cached = useMemo(loadSession, [])
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(!!cached)
  const [activeTab, setActiveTab] = useState('caregivers')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [clients, setClients] = useState([])
  const [caregivers, setCaregivers] = useState([])
  const [clientRestrictionTypes, setClientRestrictionTypes] = useState([])
  const [caregiverRestrictionTypes, setCaregiverRestrictionTypes] = useState([])
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(null)
  const [newClientRestrictionName, setNewClientRestrictionName] = useState('')
  const [newCaregiverRestrictionName, setNewCaregiverRestrictionName] = useState('')
  const [clientRestrictionNotes, setClientRestrictionNotes] = useState('')
  const [caregiverRestrictionNotes, setCaregiverRestrictionNotes] = useState('')
  const [token, setToken] = useState(cached?.token ?? null)
  const [agency, setAgency] = useState(cached?.agency ?? null)

  const canSubmit = phone.trim().length > 0 && password.length > 0 && !submitting

  const selectedClient = clients.find((client) => client.id === selectedClientId) || null
  const selectedCaregiver = caregivers.find((caregiver) => caregiver.id === selectedCaregiverId) || null
  const selectedClientRestrictionNames = new Set((selectedClient?.restrictions || []).map((r) => r.name))
  const selectedCaregiverRestrictionNames = new Set((selectedCaregiver?.restrictions || []).map((r) => r.name))
  const availableClientRestrictions = clientRestrictionTypes.filter((t) => !selectedClientRestrictionNames.has(t.name))
  const availableCaregiverRestrictions = caregiverRestrictionTypes.filter((t) => !selectedCaregiverRestrictionNames.has(t.name))

  function authHeaders() {
    return { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': '1' }
  }

  useEffect(() => {
    if (!isAuthenticated || !token) return
    const headers = authHeaders()

    fetch(resolveRestrictionsUrl('agency_caregivers'), { headers })
      .then((res) => (res.ok ? safeJson(res) : null))
      .then((data) => {
        if (data?.caregivers) {
          setCaregivers(data.caregivers.map(normalizeRestrictions))
          setSelectedCaregiverId((current) => current ?? data.caregivers[0]?.id ?? null)
        }
      })
      .catch(() => {})

    fetch(resolveRestrictionsUrl('agency_clients'), { headers })
      .then((res) => (res.ok ? safeJson(res) : null))
      .then((data) => {
        if (data?.clients) {
          setClients(data.clients.map(normalizeRestrictions))
          setSelectedClientId((current) => current ?? data.clients[0]?.id ?? null)
        }
      })
      .catch(() => {})

    fetch(resolveRestrictionsUrl('caregiver_types'), { headers })
      .then((res) => (res.ok ? safeJson(res) : null))
      .then((data) => {
        if (data?.caregiver_restriction_types) setCaregiverRestrictionTypes(data.caregiver_restriction_types)
      })
      .catch(() => {})

    fetch(resolveRestrictionsUrl('client_types'), { headers })
      .then((res) => (res.ok ? safeJson(res) : null))
      .then((data) => {
        if (data?.client_restriction_types) setClientRestrictionTypes(data.client_restriction_types)
      })
      .catch(() => {})
  }, [isAuthenticated, token])

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

      const payload = await safeJson(response)

      if (!response.ok) {
        setError(mapErrorMessage(response.status, payload))
        return
      }

      setToken(payload.token)
      setAgency(payload.agency)
      saveSession(payload.token, payload.agency)
      setIsAuthenticated(true)
      setSuccess('Login successful.')
    } catch {
      setError('Unable to connect to the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function syncCaregiverRestrictions(caregiverId, actions) {
    try {
      const res = await fetch(resolveRestrictionsUrl(`caregivers/${caregiverId}`), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ restrictions: actions }),
      })
      if (!res.ok) return
      const data = await safeJson(res)
      if (data?.restrictions) {
        setCaregivers((current) =>
          current.map((c) => (c.id === caregiverId ? { ...c, restrictions: data.restrictions } : c))
        )
      }
    } catch {}
  }

  async function syncClientRestrictions(clientId, actions) {
    try {
      const res = await fetch(resolveRestrictionsUrl(`clients/${clientId}`), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ restrictions: actions }),
      })
      if (!res.ok) return
      const data = await safeJson(res)
      if (data?.restrictions) {
        setClients((current) =>
          current.map((c) => (c.id === clientId ? { ...c, restrictions: data.restrictions } : c))
        )
      }
    } catch {}
  }

  function addClientRestriction() {
    if (!selectedClientId || !newClientRestrictionName) return
    syncClientRestrictions(selectedClientId, [
      { name: newClientRestrictionName, action: 'add', notes: clientRestrictionNotes.trim() },
    ])
    setClientRestrictionNotes('')
    setNewClientRestrictionName('')
  }

  function addCaregiverRestriction() {
    if (!selectedCaregiverId || !newCaregiverRestrictionName) return
    syncCaregiverRestrictions(selectedCaregiverId, [
      { name: newCaregiverRestrictionName, action: 'add', notes: caregiverRestrictionNotes.trim() },
    ])
    setCaregiverRestrictionNotes('')
    setNewCaregiverRestrictionName('')
  }

  function removeClientRestriction(name) {
    if (!selectedClientId) return
    syncClientRestrictions(selectedClientId, [{ name, action: 'remove' }])
  }

  function removeCaregiverRestriction(name) {
    if (!selectedCaregiverId) return
    syncCaregiverRestrictions(selectedCaregiverId, [{ name, action: 'remove' }])
  }

  if (isAuthenticated) {
    const isCaregivers = activeTab === 'caregivers'
    const people = isCaregivers ? caregivers : clients
    const selectedId = isCaregivers ? selectedCaregiverId : selectedClientId
    const restrictionTypes = isCaregivers ? caregiverRestrictionTypes : clientRestrictionTypes
    const availableRestrictions = isCaregivers ? availableCaregiverRestrictions : availableClientRestrictions
    const newRestrictionName = isCaregivers ? newCaregiverRestrictionName : newClientRestrictionName
    const setNewRestrictionName = isCaregivers ? setNewCaregiverRestrictionName : setNewClientRestrictionName
    const restrictionNotes = isCaregivers ? caregiverRestrictionNotes : clientRestrictionNotes
    const setRestrictionNotes = isCaregivers ? setCaregiverRestrictionNotes : setClientRestrictionNotes
    const addRestriction = isCaregivers ? addCaregiverRestriction : addClientRestriction
    const removeRestriction = isCaregivers ? removeCaregiverRestriction : removeClientRestriction

    function togglePerson(id) {
      const setter = isCaregivers ? setSelectedCaregiverId : setSelectedClientId
      setter((current) => (current === id ? null : id))
      if (isCaregivers) {
        setNewCaregiverRestrictionName('')
        setCaregiverRestrictionNotes('')
      } else {
        setNewClientRestrictionName('')
        setClientRestrictionNotes('')
      }
    }

    return (
      <main className="flex min-h-screen bg-[#f7f7f7] text-[#1a1a1a]">
        <aside
          className={`flex shrink-0 flex-col border-r border-[#ececec] bg-white overflow-hidden transition-[width] duration-200 ${
            sidebarOpen ? 'w-56' : 'w-14'
          }`}
        >
          <div className={`flex shrink-0 items-center border-b border-[#ececec] ${sidebarOpen ? 'h-16 justify-between px-4' : 'h-14 justify-center'}`}>
            {sidebarOpen && <img src="/hurdl_logo.png" alt="Hurdl" className="h-20" />}
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="rounded-lg p-1.5 text-[#666] transition-colors hover:bg-[#f7f7f7] hover:text-[#1a1a1a]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-2">
            <button
              type="button"
              onClick={() => setActiveTab('caregivers')}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                sidebarOpen ? 'gap-3' : 'justify-center'
              } ${activeTab === 'caregivers' ? 'bg-[#FFF6EC] text-[#F7941D] font-medium' : 'text-[#666] hover:bg-[#f7f7f7]'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {sidebarOpen && <span>My Caregivers</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                sidebarOpen ? 'gap-3' : 'justify-center'
              } ${activeTab === 'clients' ? 'bg-[#FFF6EC] text-[#F7941D] font-medium' : 'text-[#666] hover:bg-[#f7f7f7]'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {sidebarOpen && <span>My Clients</span>}
            </button>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 px-6 py-8 sm:px-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey there, <span className="text-[#F7941D]">{agency?.first_name || ''}</span>
          </h1>

          <div className="mt-8 space-y-3">
            {people.map((person) => {
              const isExpanded = person.id === selectedId
              return (
                <div key={person.id} className="overflow-hidden rounded-xl border border-[#ececec] bg-white">
                  <button
                    type="button"
                    onClick={() => togglePerson(person.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#fafafa]"
                  >
                    <span className="text-sm font-medium">{fullName(person)}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`h-4 w-4 text-[#999] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 border-t border-[#ececec] px-5 py-4">
                      <div className="space-y-2">
                        {(person.restrictions || []).map((entry) => (
                          <div
                            key={entry.name}
                            className="flex items-start justify-between gap-3 rounded-lg bg-[#f7f7f7] px-3 py-2.5"
                          >
                            <div>
                              <p className="text-sm">{restrictionLabel(entry.name, restrictionTypes)}</p>
                              {entry.notes ? <p className="mt-0.5 text-xs text-[#888]">{entry.notes}</p> : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRestriction(entry.name)}
                              className="shrink-0 text-xs text-[#b13d18] hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {(person.restrictions || []).length === 0 ? (
                          <p className="text-xs text-[#999]">No restrictions yet.</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <select
                          className="flex-1 rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                          value={newRestrictionName}
                          onChange={(e) => setNewRestrictionName(e.target.value)}
                        >
                          <option value="">Add a restriction...</option>
                          {availableRestrictions.map((type) => (
                            <option key={type.id} value={type.name}>
                              {restrictionLabel(type.name, restrictionTypes)}
                            </option>
                          ))}
                        </select>
                        <input
                          className="rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm sm:flex-1"
                          placeholder="Notes (optional)"
                          value={restrictionNotes}
                          onChange={(e) => setRestrictionNotes(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={addRestriction}
                          disabled={!newRestrictionName}
                          className="rounded-lg bg-[#F7941D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#DE8418] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {people.length === 0 ? (
              <p className="text-sm text-[#999]">No {isCaregivers ? 'caregivers' : 'clients'} found.</p>
            ) : null}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-white px-6 py-10 text-[#1a1a1a]"
      style={{ fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <section className="w-full max-w-[400px] px-6 py-8">
        <h1 className="mb-1 text-center text-5xl font-black tracking-[-0.02em] text-[#F7941D]">Hurdl</h1>

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
              className="block w-full rounded-[8px] border-[1.5px] border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#F7941D] focus:ring-[3px] focus:ring-[#F7941D]/12"
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
              className="block w-full rounded-[8px] border-[1.5px] border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#F7941D] focus:ring-[3px] focus:ring-[#F7941D]/12"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-[8px] bg-[#F7941D] px-5 py-[0.85rem] text-base font-medium text-white transition hover:bg-[#DE8418] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
