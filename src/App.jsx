import LavaHero from './LavaHero'
import AgencyLogin from './AgencyLogin'

export default function App() {
  if (window.location.pathname === '/agency' || window.location.pathname.startsWith('/agency/')) {
    return <AgencyLogin />
  }

  return <LavaHero />
}
