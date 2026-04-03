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
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('clientRestrictions')
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
  const [token, setToken] = useState(null)
  const [agency, setAgency] = useState(null)

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
          setCaregivers(data.caregivers)
          setSelectedCaregiverId((current) => current ?? data.caregivers[0]?.id ?? null)
        }
      })
      .catch(() => {})

    fetch(resolveRestrictionsUrl('agency_clients'), { headers })
      .then((res) => (res.ok ? safeJson(res) : null))
      .then((data) => {
        if (data?.clients) {
          setClients(data.clients)
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
    return (
      <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#1a1a1a] sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 rounded-xl border border-[#ececec] bg-white px-5 py-4">
            <h1 className="text-2xl font-semibold text-[#ff6a33]">
              {agency?.legal_name ? `${agency.legal_name} Dashboard` : 'Agency Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-[#666]">
              Manage caregivers, clients, and restrictions. Client restrictions are the primary control surface for matching.
            </p>
          </header>

          <section className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#ececec] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#777]">Caregivers</p>
              <p className="mt-1 text-2xl font-semibold">{caregivers.length}</p>
            </div>
            <div className="rounded-xl border border-[#ececec] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#777]">Clients</p>
              <p className="mt-1 text-2xl font-semibold">{clients.length}</p>
            </div>
            <div className="rounded-xl border border-[#ececec] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#777]">Restriction Types</p>
              <p className="mt-1 text-2xl font-semibold">{clientRestrictionTypes.length + caregiverRestrictionTypes.length}</p>
            </div>
          </section>

          <nav className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('clientRestrictions')}
              className={`rounded-lg px-4 py-2 text-sm ${
                activeTab === 'clientRestrictions' ? 'bg-[#ff6a33] text-white' : 'bg-white text-[#444]'
              }`}
            >
              Client Restrictions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('caregivers')}
              className={`rounded-lg px-4 py-2 text-sm ${activeTab === 'caregivers' ? 'bg-[#ff6a33] text-white' : 'bg-white text-[#444]'}`}
            >
              Caregivers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`rounded-lg px-4 py-2 text-sm ${activeTab === 'clients' ? 'bg-[#ff6a33] text-white' : 'bg-white text-[#444]'}`}
            >
              Clients
            </button>
          </nav>

          {activeTab === 'clientRestrictions' ? (
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#ececec] bg-white p-4">
                <h2 className="text-lg font-semibold">Client Restrictions</h2>
                <p className="mt-1 text-sm text-[#666]">Add or remove restrictions for each client.</p>

                <label className="mt-4 block text-xs uppercase tracking-[0.08em] text-[#777]">Client</label>
                <select
                  className="mt-1 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                  value={selectedClientId ?? ''}
                  onChange={(event) => setSelectedClientId(Number(event.target.value))}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {fullName(client)}
                    </option>
                  ))}
                </select>

                <div className="mt-4 space-y-2">
                  {(selectedClient?.restrictions || []).map((entry) => (
                    <div key={entry.name} className="flex items-start justify-between gap-3 rounded-lg border border-[#efefef] p-3">
                      <div>
                        <p className="text-sm font-medium">{restrictionLabel(entry.name, clientRestrictionTypes)}</p>
                        {entry.notes ? <p className="text-xs text-[#666]">{entry.notes}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeClientRestriction(entry.name)}
                        className="text-xs text-[#b13d18] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(selectedClient?.restrictions || []).length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#ebebeb] p-3 text-xs text-[#777]">No restrictions assigned yet.</p>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-[#efefef] p-3">
                  <p className="text-sm font-medium">Add restriction</p>
                  <select
                    className="mt-2 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                    value={newClientRestrictionName}
                    onChange={(event) => setNewClientRestrictionName(event.target.value)}
                  >
                    <option value="">Select restriction</option>
                    {availableClientRestrictions.map((type) => (
                      <option key={type.id} value={type.name}>
                        {restrictionLabel(type.name, clientRestrictionTypes)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="mt-2 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                    placeholder="Notes (optional)"
                    value={clientRestrictionNotes}
                    onChange={(event) => setClientRestrictionNotes(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addClientRestriction}
                    disabled={!newClientRestrictionName}
                    className="mt-2 rounded-lg bg-[#ff6a33] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add Client Restriction
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#ececec] bg-white p-4">
                <h2 className="text-lg font-semibold">Caregiver Restrictions</h2>
                <p className="mt-1 text-sm text-[#666]">Track caregiver constraints for safe matching.</p>

                <label className="mt-4 block text-xs uppercase tracking-[0.08em] text-[#777]">Caregiver</label>
                <select
                  className="mt-1 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                  value={selectedCaregiverId ?? ''}
                  onChange={(event) => setSelectedCaregiverId(Number(event.target.value))}
                >
                  {caregivers.map((caregiver) => (
                    <option key={caregiver.id} value={caregiver.id}>
                      {fullName(caregiver)}
                    </option>
                  ))}
                </select>

                <div className="mt-4 space-y-2">
                  {(selectedCaregiver?.restrictions || []).map((entry) => (
                    <div key={entry.name} className="flex items-start justify-between gap-3 rounded-lg border border-[#efefef] p-3">
                      <div>
                        <p className="text-sm font-medium">{restrictionLabel(entry.name, caregiverRestrictionTypes)}</p>
                        {entry.notes ? <p className="text-xs text-[#666]">{entry.notes}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCaregiverRestriction(entry.name)}
                        className="text-xs text-[#b13d18] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(selectedCaregiver?.restrictions || []).length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#ebebeb] p-3 text-xs text-[#777]">No restrictions assigned yet.</p>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-[#efefef] p-3">
                  <p className="text-sm font-medium">Add restriction</p>
                  <select
                    className="mt-2 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                    value={newCaregiverRestrictionName}
                    onChange={(event) => setNewCaregiverRestrictionName(event.target.value)}
                  >
                    <option value="">Select restriction</option>
                    {availableCaregiverRestrictions.map((type) => (
                      <option key={type.id} value={type.name}>
                        {restrictionLabel(type.name, caregiverRestrictionTypes)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="mt-2 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                    placeholder="Notes (optional)"
                    value={caregiverRestrictionNotes}
                    onChange={(event) => setCaregiverRestrictionNotes(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addCaregiverRestriction}
                    disabled={!newCaregiverRestrictionName}
                    className="mt-2 rounded-lg bg-[#ff6a33] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add Caregiver Restriction
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'caregivers' ? (
            <section className="rounded-xl border border-[#ececec] bg-white p-4">
              <h2 className="text-lg font-semibold">My Caregivers</h2>
              <div className="mt-3 divide-y divide-[#efefef]">
                {caregivers.map((caregiver) => (
                  <div key={caregiver.id} className="py-3">
                    <p className="text-sm font-medium">{fullName(caregiver)}</p>
                  </div>
                ))}
                {caregivers.length === 0 && (
                  <p className="py-3 text-sm text-[#666]">No caregivers found.</p>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === 'clients' ? (
            <section className="rounded-xl border border-[#ececec] bg-white p-4">
              <h2 className="text-lg font-semibold">My Clients</h2>
              <div className="mt-3 divide-y divide-[#efefef]">
                {clients.map((client) => (
                  <div key={client.id} className="py-3">
                    <p className="text-sm font-medium">{fullName(client)}</p>
                  </div>
                ))}
                {clients.length === 0 && (
                  <p className="py-3 text-sm text-[#666]">No clients found.</p>
                )}
              </div>
            </section>
          ) : null}
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
            className="w-full rounded-[8px] bg-[#ff6a33] px-5 py-[0.85rem] text-base font-medium text-white transition hover:bg-[#e55a28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
