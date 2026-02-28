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

function resolveDashboardUrl() {
  const configured = import.meta.env.VITE_AGENCY_DASHBOARD_URL
  if (configured) return configured

  const base = import.meta.env.VITE_BACKEND_URL
  if (base) return `${normalizeBase(base)}/agency/dashboard`

  return '/agency-api/dashboard'
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

const DEFAULT_RESTRICTIONS = [
  { id: 1, name: 'Dog in home', category: 'Environment' },
  { id: 2, name: 'Cat in home', category: 'Environment' },
  { id: 3, name: 'Requires heavy lifting', category: 'Physical' },
  { id: 4, name: 'Stairs required', category: 'Physical' },
  { id: 5, name: 'Perfume sensitivity', category: 'Allergy' },
]

const DEFAULT_CLIENTS = [
  {
    id: 101,
    first_name: 'Maria',
    last_name: 'Alvarez',
    city: 'Tampa',
    state: 'FL',
    requires_spanish_speaker: true,
    client_restrictions: [
      { restriction_id: 1, notes: 'Large dog in home daily.' },
      { restriction_id: 5, notes: 'Avoid strong scents.' },
    ],
  },
  {
    id: 102,
    first_name: 'David',
    last_name: 'Miles',
    city: 'Brandon',
    state: 'FL',
    requires_spanish_speaker: false,
    client_restrictions: [{ restriction_id: 3, notes: 'Transfer support required.' }],
  },
]

const DEFAULT_CAREGIVERS = [
  {
    id: 201,
    first_name: 'Sophia',
    last_name: 'Nguyen',
    phone_number: '(813) 555-0198',
    is_spanish_speaking: true,
    caregiver_restrictions: [{ restriction_id: 1, notes: 'Scared of dogs.' }],
  },
  {
    id: 202,
    first_name: 'Robert',
    last_name: 'Hale',
    phone_number: '(813) 555-0112',
    is_spanish_speaking: false,
    caregiver_restrictions: [{ restriction_id: 4, notes: 'Recent knee injury.' }],
  },
]

function fullName(person) {
  return `${person.first_name || ''} ${person.last_name || ''}`.trim()
}

function restrictionLabel(restriction) {
  if (!restriction) return 'Unknown restriction'
  return restriction.category ? `${restriction.name} (${restriction.category})` : restriction.name
}

function hydrateDashboard(payload) {
  return {
    restrictions: Array.isArray(payload?.restrictions) && payload.restrictions.length > 0 ? payload.restrictions : DEFAULT_RESTRICTIONS,
    clients: Array.isArray(payload?.clients) && payload.clients.length > 0 ? payload.clients : DEFAULT_CLIENTS,
    caregivers: Array.isArray(payload?.caregivers) && payload.caregivers.length > 0 ? payload.caregivers : DEFAULT_CAREGIVERS,
  }
}

function removeRestrictionFromEntity(items, targetId, restrictionId, key) {
  return items.map((item) => {
    if (item.id !== targetId) return item
    return {
      ...item,
      [key]: (item[key] || []).filter((entry) => entry.restriction_id !== restrictionId),
    }
  })
}

function addRestrictionToEntity(items, targetId, restrictionId, notes, key) {
  return items.map((item) => {
    if (item.id !== targetId) return item
    const current = item[key] || []
    const alreadyExists = current.some((entry) => entry.restriction_id === restrictionId)
    if (alreadyExists) return item
    return {
      ...item,
      [key]: [...current, { restriction_id: restrictionId, notes: notes.trim() }],
    }
  })
}

export default function AgencyLogin() {
  const loginUrl = useMemo(resolveLoginUrl, [])
  const dashboardUrl = useMemo(resolveDashboardUrl, [])
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('clientRestrictions')
  const [clients, setClients] = useState([])
  const [caregivers, setCaregivers] = useState([])
  const [restrictions, setRestrictions] = useState([])
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(null)
  const [newClientRestrictionId, setNewClientRestrictionId] = useState('')
  const [newCaregiverRestrictionId, setNewCaregiverRestrictionId] = useState('')
  const [clientRestrictionNotes, setClientRestrictionNotes] = useState('')
  const [caregiverRestrictionNotes, setCaregiverRestrictionNotes] = useState('')

  const canSubmit = phone.trim().length > 0 && password.length > 0 && !submitting

  const selectedClient = clients.find((client) => client.id === selectedClientId) || null
  const selectedCaregiver = caregivers.find((caregiver) => caregiver.id === selectedCaregiverId) || null
  const selectedClientRestrictionIds = new Set((selectedClient?.client_restrictions || []).map((entry) => entry.restriction_id))
  const selectedCaregiverRestrictionIds = new Set(
    (selectedCaregiver?.caregiver_restrictions || []).map((entry) => entry.restriction_id)
  )
  const availableClientRestrictions = restrictions.filter((restriction) => !selectedClientRestrictionIds.has(restriction.id))
  const availableCaregiverRestrictions = restrictions.filter((restriction) => !selectedCaregiverRestrictionIds.has(restriction.id))

  function applyDashboardData(payload, preserveSelection = false) {
    const next = hydrateDashboard(payload)
    setClients(next.clients)
    setCaregivers(next.caregivers)
    setRestrictions(next.restrictions)
    if (preserveSelection) {
      setSelectedClientId((current) => current ?? next.clients[0]?.id ?? null)
      setSelectedCaregiverId((current) => current ?? next.caregivers[0]?.id ?? null)
      return
    }
    setSelectedClientId(next.clients[0]?.id ?? null)
    setSelectedCaregiverId(next.caregivers[0]?.id ?? null)
  }

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

      applyDashboardData(payload)
      setIsAuthenticated(true)
      setSuccess('Login successful.')

      fetch(dashboardUrl)
        .then((dashboardResponse) => {
          if (!dashboardResponse.ok) return null
          return safeJson(dashboardResponse)
        })
        .then((dashboardPayload) => {
          if (!dashboardPayload) return
          applyDashboardData(dashboardPayload, true)
        })
        .catch(() => {
          // Backend dashboard endpoint is optional during frontend-only work.
        })
    } catch {
      setError('Unable to connect to the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function addClientRestriction() {
    if (!selectedClientId || !newClientRestrictionId) return
    const restrictionId = Number(newClientRestrictionId)
    setClients((current) =>
      addRestrictionToEntity(current, selectedClientId, restrictionId, clientRestrictionNotes, 'client_restrictions')
    )
    setClientRestrictionNotes('')
    setNewClientRestrictionId('')
  }

  function addCaregiverRestriction() {
    if (!selectedCaregiverId || !newCaregiverRestrictionId) return
    const restrictionId = Number(newCaregiverRestrictionId)
    setCaregivers((current) =>
      addRestrictionToEntity(current, selectedCaregiverId, restrictionId, caregiverRestrictionNotes, 'caregiver_restrictions')
    )
    setCaregiverRestrictionNotes('')
    setNewCaregiverRestrictionId('')
  }

  function removeClientRestriction(restrictionId) {
    if (!selectedClientId) return
    setClients((current) => removeRestrictionFromEntity(current, selectedClientId, restrictionId, 'client_restrictions'))
  }

  function removeCaregiverRestriction(restrictionId) {
    if (!selectedCaregiverId) return
    setCaregivers((current) => removeRestrictionFromEntity(current, selectedCaregiverId, restrictionId, 'caregiver_restrictions'))
  }

  function lookupRestriction(restrictionId) {
    return restrictions.find((restriction) => restriction.id === restrictionId)
  }

  if (isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#1a1a1a] sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 rounded-xl border border-[#ececec] bg-white px-5 py-4">
            <h1 className="text-2xl font-semibold text-[#ff6a33]">Agency Dashboard</h1>
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
              <p className="mt-1 text-2xl font-semibold">{restrictions.length}</p>
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
                  {(selectedClient?.client_restrictions || []).map((entry) => (
                    <div key={entry.restriction_id} className="flex items-start justify-between gap-3 rounded-lg border border-[#efefef] p-3">
                      <div>
                        <p className="text-sm font-medium">{restrictionLabel(lookupRestriction(entry.restriction_id))}</p>
                        {entry.notes ? <p className="text-xs text-[#666]">{entry.notes}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeClientRestriction(entry.restriction_id)}
                        className="text-xs text-[#b13d18] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(selectedClient?.client_restrictions || []).length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#ebebeb] p-3 text-xs text-[#777]">No restrictions assigned yet.</p>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-[#efefef] p-3">
                  <p className="text-sm font-medium">Add restriction</p>
                  <select
                    className="mt-2 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                    value={newClientRestrictionId}
                    onChange={(event) => setNewClientRestrictionId(event.target.value)}
                  >
                    <option value="">Select restriction</option>
                    {availableClientRestrictions.map((restriction) => (
                      <option key={restriction.id} value={restriction.id}>
                        {restrictionLabel(restriction)}
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
                    disabled={!newClientRestrictionId}
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
                  {(selectedCaregiver?.caregiver_restrictions || []).map((entry) => (
                    <div key={entry.restriction_id} className="flex items-start justify-between gap-3 rounded-lg border border-[#efefef] p-3">
                      <div>
                        <p className="text-sm font-medium">{restrictionLabel(lookupRestriction(entry.restriction_id))}</p>
                        {entry.notes ? <p className="text-xs text-[#666]">{entry.notes}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCaregiverRestriction(entry.restriction_id)}
                        className="text-xs text-[#b13d18] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(selectedCaregiver?.caregiver_restrictions || []).length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#ebebeb] p-3 text-xs text-[#777]">No restrictions assigned yet.</p>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-[#efefef] p-3">
                  <p className="text-sm font-medium">Add restriction</p>
                  <select
                    className="mt-2 w-full rounded-lg border border-[#dfdfdf] bg-white px-3 py-2 text-sm"
                    value={newCaregiverRestrictionId}
                    onChange={(event) => setNewCaregiverRestrictionId(event.target.value)}
                  >
                    <option value="">Select restriction</option>
                    {availableCaregiverRestrictions.map((restriction) => (
                      <option key={restriction.id} value={restriction.id}>
                        {restrictionLabel(restriction)}
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
                    disabled={!newCaregiverRestrictionId}
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
              <h2 className="text-lg font-semibold">Caregiver List</h2>
              <div className="mt-3 divide-y divide-[#efefef]">
                {caregivers.map((caregiver) => (
                  <div key={caregiver.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{fullName(caregiver)}</p>
                      <p className="text-xs text-[#666]">{caregiver.phone_number || 'No phone on file'}</p>
                    </div>
                    <p className="text-xs text-[#666]">{caregiver.is_spanish_speaking ? 'Spanish speaking' : 'English only'}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'clients' ? (
            <section className="rounded-xl border border-[#ececec] bg-white p-4">
              <h2 className="text-lg font-semibold">Client List</h2>
              <div className="mt-3 divide-y divide-[#efefef]">
                {clients.map((client) => (
                  <div key={client.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{fullName(client)}</p>
                      <p className="text-xs text-[#666]">
                        {[client.city, client.state].filter(Boolean).join(', ') || 'Location not available'}
                      </p>
                    </div>
                    <p className="text-xs text-[#666]">
                      {client.requires_spanish_speaker ? 'Needs Spanish-speaking caregiver' : 'No language requirement'}
                    </p>
                  </div>
                ))}
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
        <h1 className="mb-1 text-center text-5xl font-medium tracking-[-0.02em] text-[#ff6a33]">Hurdl</h1>

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
