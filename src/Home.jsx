import { useCallback, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion'
import { ArrowUpRight, Broadcast, CalendarCheck, ChatCircleText, CheckCircle } from '@phosphor-icons/react'

const ORANGE = '#F89434'
const NAV_OFFSET = 96

const STEPS = [
  {
    number: '01',
    title: 'The call-out',
    description: "A caregiver can't make their shift, so they text their operating director directly. No separate app to open.",
    icon: ChatCircleText,
  },
  {
    number: '02',
    title: 'Hurdl takes over',
    description:
      'The moment the OD gets that text, Hurdl engages automatically, texting every qualifying caregiver in the network to find coverage.',
    icon: Broadcast,
  },
  {
    number: '03',
    title: 'Coverage confirmed',
    description: 'The first caregiver who can help replies yes, and Hurdl locks them in for the shift.',
    icon: CheckCircle,
  },
  {
    number: '04',
    title: 'Hands-off, start to finish',
    description:
      "Hurdl assigns the caregiver in your scheduling software and texts the OD that it's filled. No calls, no spreadsheets.",
    icon: CalendarCheck,
  },
]

function encodeFormData(data) {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&')
}

function scrollToId(id, shouldReduceMotion) {
  const el = document.getElementById(id)
  if (!el) return
  const offset = id === 'top' ? 0 : NAV_OFFSET
  const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset)

  if (shouldReduceMotion) {
    window.scrollTo({ top: targetY, behavior: 'instant' })
    return
  }

  const controls = animate(window.scrollY, targetY, {
    duration: 0.9,
    ease: [0.16, 1, 0.3, 1],
    onUpdate: (v) => window.scrollTo({ top: v, behavior: 'instant' }),
  })

  const cancel = () => controls.stop()
  window.addEventListener('wheel', cancel, { once: true, passive: true })
  window.addEventListener('touchstart', cancel, { once: true, passive: true })
  controls.then(() => {
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
  })
}

function useScrollLink() {
  const shouldReduceMotion = useReducedMotion()
  return useCallback(
    (id) => (event) => {
      event.preventDefault()
      scrollToId(id, shouldReduceMotion)
    },
    [shouldReduceMotion]
  )
}

function NavBar() {
  const handleScrollTo = useScrollLink()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.04] bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2.5 sm:px-8 sm:py-3">
        <a href="#top" onClick={handleScrollTo('top')} aria-label="Hurdl home">
          <img src="/hurdl_logo.png" alt="Hurdl" className="h-10 w-auto sm:h-14" />
        </a>
        <a
          href="#schedule-demo"
          onClick={handleScrollTo('schedule-demo')}
          className="group inline-flex items-center gap-2 rounded-full bg-[#F89434] py-2 pl-4 pr-1.5 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
        >
          Schedule a Demo
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            <ArrowUpRight size={13} weight="bold" />
          </span>
        </a>
      </div>
    </header>
  )
}

function Hero() {
  const shouldReduceMotion = useReducedMotion()
  const handleScrollTo = useScrollLink()

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center sm:px-8">
      <motion.h1
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mt-6 text-[clamp(2.75rem,8vw,6.5rem)] font-black leading-[0.98] tracking-[-0.035em] text-[#0a0a0a]"
      >
        Call outs,
        <br />
        simplified.
      </motion.h1>

      <motion.p
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        className="mt-6 max-w-xl text-base leading-7 text-black/55 sm:text-lg"
      >
        When a caregiver can&apos;t make a shift, Hurdl handles the rest: texting your network, confirming
        coverage, and updating your schedule. Your operations director never has to make a call.
      </motion.p>

      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.25 }}
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <a
          href="#schedule-demo"
          onClick={handleScrollTo('schedule-demo')}
          className="group inline-flex items-center gap-2 rounded-full bg-[#F89434] py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Schedule a Demo
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            <ArrowUpRight size={16} weight="bold" />
          </span>
        </a>
        <a
          href="#how-it-works"
          onClick={handleScrollTo('how-it-works')}
          className="text-sm font-medium text-black/60 transition-colors hover:text-black"
        >
          See how it works
        </a>
      </motion.div>
    </section>
  )
}

function StepCard({ step, isLit }) {
  const shouldReduceMotion = useReducedMotion()
  const Icon = step.icon

  return (
    <motion.li
      className="relative pl-14 sm:pl-20"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, filter: 'blur(6px)' }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-15% 0px -15% 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ease-out sm:h-10 sm:w-10"
        style={{
          borderColor: isLit ? ORANGE : 'rgba(0,0,0,0.1)',
          backgroundColor: isLit ? ORANGE : '#ffffff',
          color: isLit ? '#ffffff' : 'rgba(0,0,0,0.35)',
        }}
      >
        <Icon size={18} weight="light" />
      </div>

      <div
        className="rounded-[1.75rem] p-1.5 transition-colors duration-300 ease-out"
        style={{
          background: isLit ? 'rgba(248,148,52,0.05)' : 'rgba(0,0,0,0.02)',
          boxShadow: `inset 0 0 0 1px ${isLit ? 'rgba(248,148,52,0.18)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        <div className="rounded-[1.4rem] bg-white p-6 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.12)] sm:p-8">
          <span className="text-xs font-semibold tracking-[0.2em] text-black/30">{step.number}</span>
          <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{step.title}</h3>
          <p className="mt-2 max-w-md text-[15px] leading-6 text-black/60">{step.description}</p>
        </div>
      </div>
    </motion.li>
  )
}

function StoryTimeline() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.8', 'end 0.35'],
  })
  const lineProgress = useSpring(scrollYProgress, { stiffness: 280, damping: 40, restDelta: 0.001 })
  const [litCount, setLitCount] = useState(0)

  useMotionValueEvent(lineProgress, 'change', (v) => {
    setLitCount(Math.round(v * STEPS.length))
  })

  return (
    <section id="how-it-works" ref={sectionRef} className="relative mx-auto max-w-3xl scroll-mt-24 px-6 py-32 sm:px-8 md:py-40">
      <div className="mb-20 max-w-xl">
        <span className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">
          How it works
        </span>
        <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.05] tracking-[-0.02em]">
          One text starts it.
          <br />
          Hurdl finishes it.
        </h2>
      </div>

      <div className="relative">
        <div className="absolute bottom-2 left-4 top-2 w-px bg-black/10 sm:left-5" />
        <motion.div
          className="absolute bottom-2 left-4 top-2 w-px origin-top bg-[#F89434] sm:left-5"
          style={{ scaleY: lineProgress }}
        />
        <ol className="space-y-16 sm:space-y-20">
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} isLit={i < litCount} />
          ))}
        </ol>
      </div>
    </section>
  )
}

function DemoSection({ demoForm, demoStatus, onFieldChange, onSubmit, successEnterY, formExitY }) {
  return (
    <section id="schedule-demo" className="scroll-mt-24 bg-[#fafafa] px-6 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-black tracking-[-0.02em]">Schedule a Demo</h2>
          <p className="mt-3 text-black/55">See how Hurdl handles your next call-out, hands-off.</p>
        </div>

        <div className="mt-10 rounded-[2rem] bg-black/[0.02] p-2" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
          <div className="rounded-[1.6rem] bg-white p-8 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.15)] sm:p-10">
            <AnimatePresence mode="wait">
              {demoStatus === 'success' ? (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: successEnterY }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="py-6 text-center text-black/70"
                >
                  Thanks! We got your request and will reach out shortly.
                </motion.p>
              ) : (
                <motion.form
                  key="form"
                  exit={{ opacity: 0, y: formExitY }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  name="schedule-demo"
                  onSubmit={onSubmit}
                  className="space-y-4"
                >
                  <input type="hidden" name="form-name" value="schedule-demo" />
                  <p className="hidden">
                    <label>
                      Don&apos;t fill this out: <input name="bot-field" onChange={onFieldChange} />
                    </label>
                  </p>

                  <div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={demoForm.firstName}
                      onChange={onFieldChange}
                      className="block w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-[#0a0a0a] outline-none transition placeholder:text-black/35 focus:border-[#F89434] focus:ring-2 focus:ring-[#F89434]/15"
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={demoForm.lastName}
                      onChange={onFieldChange}
                      className="block w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-[#0a0a0a] outline-none transition placeholder:text-black/35 focus:border-[#F89434] focus:ring-2 focus:ring-[#F89434]/15"
                      placeholder="Last name"
                    />
                  </div>

                  <div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={demoForm.email}
                      onChange={onFieldChange}
                      className="block w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-[#0a0a0a] outline-none transition placeholder:text-black/35 focus:border-[#F89434] focus:ring-2 focus:ring-[#F89434]/15"
                      placeholder="you@agency.com"
                    />
                  </div>

                  {demoStatus === 'error' && (
                    <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={demoStatus === 'submitting'}
                    className="mt-2 w-full rounded-full bg-[#F89434] py-3.5 text-sm font-semibold text-white transition hover:bg-[#E0841E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {demoStatus === 'submitting' ? 'Sending…' : 'Request Demo'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-black/[0.06] bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-sm text-black/55 sm:grid-cols-4 sm:px-8">
        <div className="col-span-2 sm:col-span-1">
          <img src="/hurdl_logo.png" alt="Hurdl" className="h-7 w-auto" />
          <p className="mt-3 leading-6">Autonomy, designed for everyday care.</p>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-black/35">Information</p>
          <a href="/privacy" className="block transition-colors hover:text-black">
            Privacy Policy
          </a>
          <a href="/terms" className="mt-2 block transition-colors hover:text-black">
            Terms &amp; Conditions
          </a>
        </div>
        <div className="sm:text-right">
          <p>&copy; {currentYear} Hurdl</p>
        </div>
      </div>
      <p className="pointer-events-none -mt-4 select-none text-center text-[22vw] font-black leading-[0.7] tracking-tight text-black/[0.03] sm:text-[16vw]">
        Hurdl
      </p>
    </footer>
  )
}

export default function Home() {
  const [demoForm, setDemoForm] = useState({ firstName: '', lastName: '', email: '' })
  const [demoStatus, setDemoStatus] = useState('idle') // idle | submitting | success | error
  const shouldReduceMotion = useReducedMotion()
  const successEnterY = shouldReduceMotion ? 0 : 8
  const formExitY = shouldReduceMotion ? 0 : -8

  const handleDemoFieldChange = useCallback((event) => {
    const { name, value } = event.target
    setDemoForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleDemoSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setDemoStatus('submitting')
      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encodeFormData({ 'form-name': 'schedule-demo', ...demoForm }),
        })
        if (!response.ok) throw new Error('Submission failed')
        setDemoStatus('success')
        setDemoForm({ firstName: '', lastName: '', email: '' })
      } catch {
        setDemoStatus('error')
      }
    },
    [demoForm]
  )

  return (
    <main id="top" className="bg-white text-[#0a0a0a] antialiased">
      <NavBar />
      <Hero />
      <StoryTimeline />
      <DemoSection
        demoForm={demoForm}
        demoStatus={demoStatus}
        onFieldChange={handleDemoFieldChange}
        onSubmit={handleDemoSubmit}
        successEnterY={successEnterY}
        formExitY={formExitY}
      />
      <Footer />
    </main>
  )
}
