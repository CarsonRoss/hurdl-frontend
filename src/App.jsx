import Home from './Home'
import AgencyLogin from './AgencyLogin'

export default function App() {
  if (window.location.pathname === '/agency' || window.location.pathname.startsWith('/agency/')) {
    return <AgencyLogin />
  }

  return <Home />
}
