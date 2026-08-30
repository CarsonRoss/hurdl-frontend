import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { ReactLenis, useLenis } from 'lenis/react'
import {
  ArrowUpRight,
  CaretRightIcon,
  ChatCircleText,
  MagnifyingGlass,
  Code,
  Handshake,
} from '@phosphor-icons/react'

const ORANGE = '#F89434'
const NAV_OFFSET = 96
const EASE_OUT = [0.16, 1, 0.3, 1]

const SERVICES = [
  {
    title: 'Fractional CTO',
    description:
      "Architecture decisions, vendor evaluation, technical hiring, or roadmap planning. Hurdl makes the judgment calls without the full-time hire.",
  },
  {
    title: 'AI Implementation',
    description: 'We integrate AI into your existing workflows so it actually moves the needle, not just a chatbot bolted on.',
  },
  {
    title: 'Custom Software',
    description: 'When off-the-shelf software doesn’t cut it, we design and build the product that gets you the outcome.',
  },
  {
    title: 'Architecture & Systems Design',
    description: 'A technical foundation that scales with the business instead of fighting it.',
  },
  {
    title: 'Technical Due Diligence',
    description: 'A second, senior opinion before you buy software, hire a vendor, or sign the contract.',
  },
  {
    title: 'Ongoing Partnership',
    description: 'We stay embedded as your technical advisor, so the next hard decision doesn’t stall the business.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Discovery call',
    description: "We start with a conversation about the technical problem you're facing.",
    icon: ChatCircleText,
  },
  {
    number: '02',
    title: 'Technical audit',
    description: "We assess what you have, what's missing, and where AI or custom software actually moves the needle.",
    icon: MagnifyingGlass,
  },
  {
    number: '03',
    title: 'Build & implement',
    description: 'We design, build, and ship to production.',
    icon: Code,
  },
  {
    number: '04',
    title: 'Ongoing partnership',
    description: "We stay on as your technical advisor, so the next decision doesn't stall the business again.",
    icon: Handshake,
  },
]

function encodeFormData(data) {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&')
}

function useScrollLink() {
  const lenis = useLenis()
  return useCallback(
    (id) => (event) => {
      event.preventDefault()
      const el = document.getElementById(id)
      if (!el || !lenis) return
      lenis.scrollTo(el, { offset: id === 'top' ? 0 : -NAV_OFFSET, duration: 1.2 })
    },
    [lenis]
  )
}

function RevealWords({
  text,
  trigger = 'view',
  play = true,
  baseDelay = 0,
  duration = 0.9,
  stagger = 0.05,
  viewportMargin = '-15% 0px',
  className,
}) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <span className={className}>
        {text.split('\n').map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </span>
    )
  }

  const lines = text.split('\n')
  let wordIndex = 0

  const revealProps =
    trigger === 'mount'
      ? { animate: play ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined }
      : { whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: viewportMargin } }

  return (
    <span className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((word) => {
            const i = wordIndex++
            return (
              // Space lives outside the inline-block span — a trailing space
              // inside an inline-block collapses to zero width in the browser.
              <Fragment key={i}>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 20, filter: 'blur(2px)' }}
                  {...revealProps}
                  transition={{ duration, ease: EASE_OUT, delay: baseDelay + i * stagger }}
                >
                  {word}
                </motion.span>
                {' '}
              </Fragment>
            )
          })}
        </span>
      ))}
    </span>
  )
}

// Continuously tints each word from muted grey to full white as the block
// scrolls through view, rather than RevealWords' one-shot fade-in — used for
// flowing paragraph copy, never headlines.
function ScrollTintWord({ progress, range, children }) {
  const color = useTransform(progress, range, ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.95)'])
  return (
    <motion.span className="inline-block" style={{ color }}>
      {children}
    </motion.span>
  )
}

function ScrollTintText({ text, className }) {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'start 0.4'],
  })

  if (shouldReduceMotion) {
    return (
      <p ref={containerRef} className={`relative ${className}`}>
        {text}
      </p>
    )
  }

  const words = text.split(' ')
  const spread = 0.6

  return (
    <p ref={containerRef} className={`relative ${className}`}>
      {words.map((word, i) => {
        const start = (i / words.length) * (1 - spread)
        const end = start + spread
        return (
          <Fragment key={i}>
            <ScrollTintWord progress={scrollYProgress} range={[start, end]}>
              {word}
            </ScrollTintWord>
            {' '}
          </Fragment>
        )
      })}
    </p>
  )
}

function Eyebrow({ label, dotClassName = 'bg-[#F89434]', textClassName = 'text-white/40', className = '' }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className={`flex items-center gap-2 ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
      <span className={`text-xs uppercase tracking-[0.14em] ${textClassName}`}>{label}</span>
    </motion.div>
  )
}

function NavBar() {
  const handleScrollTo = useScrollLink()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2.5 sm:px-8 sm:py-3">
        <a href="#top" onClick={handleScrollTo('top')} aria-label="Hurdl home">
          <img src="/hurdl_logo.png" alt="Hurdl" className="h-12 w-auto sm:h-16" />
        </a>
        <a
          href="#schedule-demo"
          onClick={handleScrollTo('schedule-demo')}
          className="group inline-flex items-center gap-2 rounded-full bg-white py-2 pl-4 pr-1.5 text-sm font-semibold text-[#0a0a0a] transition-transform active:scale-[0.97]"
        >
          Schedule a Call
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            <ArrowUpRight size={13} weight="bold" />
          </span>
        </a>
      </div>
    </header>
  )
}

// Full-screen splash that hides the already-mounted page behind two solid
// circles — grey, then light grey — each growing from the center to fully
// cover the viewport, staggered and layered on top of one another. The third
// "circle" isn't a color at all: it's the already-mounted Hero itself,
// revealed through a growing circular mask (same center-out growth
// language as the two solid circles, just cutting a hole instead of
// painting a fill) — so there's no separate fade-in step once it finishes;
// by the time the hole covers the viewport, you're just looking at the page.
const HOLD_DURATION = 2
const GROW_STAGGER = 0.2
const GROW_DURATION = .4
const GROW_CIRCLES = ['#3a3a3a', '#6b6b6b'] // grey, light grey
const RINGS_FADE_DURATION = 0.3
// Same delay slot the removed third circle used to start in (HOLD_DURATION +
// GROW_CIRCLES.length * GROW_STAGGER when it was index 2 of 3).
const REVEAL_DELAY = HOLD_DURATION + GROW_CIRCLES.length * GROW_STAGGER

// Three hairline ring outlines behind the wordmark during the hold. These are
// transparent-fill, near-invisible borders sized bigger than the grow
// circles could be at rest, so they're never hidden behind them.
// Diameters measured directly off a full-resolution reference frame: ring
// radii sit at ~14.6%/23.4%/32.1% of the viewport's larger dimension
// (evenly spaced ~8.8% apart), i.e. roughly double what a first guess looked
// like at a glance — doubled here to vmax diameters.
const BREATH_RINGS = [38, 61, 83] // vmax diameters at rest

function SiteIntro({ onFinish }) {
  const shouldReduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(true)
  const radius = useMotionValue(0)
  const maskImage = useMotionTemplate`radial-gradient(circle at 50% 50%, transparent ${radius}vmax, black ${radius}vmax)`

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisible(false)
      onFinish?.()
      return
    }

    const controls = animate(radius, 150, {
      delay: REVEAL_DELAY,
      duration: GROW_DURATION,
      ease: 'easeOut',
      onComplete: () => {
        setVisible(false)
        onFinish?.()
      },
    })

    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReduceMotion])

  if (!visible) return null

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#161616]"
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      <div className="relative flex items-center justify-center">
        {GROW_CIRCLES.map((color, i) => (
          <motion.span
            key={color}
            className="absolute h-[300vmax] w-[300vmax] rounded-full"
            style={{ backgroundColor: color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: GROW_DURATION,
              delay: HOLD_DURATION + i * GROW_STAGGER,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: RINGS_FADE_DURATION, delay: HOLD_DURATION - RINGS_FADE_DURATION, ease: EASE_OUT }}
        >
          {BREATH_RINGS.map((diameter, i) => (
            <motion.span
              key={diameter}
              className="absolute rounded-full border border-white"
              style={{ width: `${diameter}vmax`, height: `${diameter}vmax` }}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: [0, 0.55, 0.38, 0.55], scale: [0.82, 1, 0.96, 1] }}
              transition={{
                duration: 2,
                times: [0, 0.25, 0.6, 1],
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
        <motion.span
          initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, 0], filter: ['blur(3px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'] }}
          transition={{ duration: HOLD_DURATION, times: [0, 0.15, 0.55, 1], ease: EASE_OUT }}
          className="relative text-lg font-bold tracking-[0.3em] text-white sm:text-xl"
        >
          HURDL
        </motion.span>
      </div>
    </motion.div>
  )
}

// Warm concentric-ring sunburst, layered from plain CSS gradients (radial
// glow + repeating rings + turbulence-noise grain + edge vignette). Rings are
// perfectly circular, so unlike the old raymarched shader this needs no
// per-frame render loop — it's a static paint, cheaper and trivially
// reduced-motion-safe. Only the glow's brightness breathes, and only barely.
function SunburstBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="sunburst-glow absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 32%, #FFD9A8 0%, #FFA850 26%, #E07A1E 48%, #7A3A0A 74%, #161616 96%)',
        }}
      />
      <div
        className="absolute -inset-[15%]"
        style={{
          background:
            'repeating-radial-gradient(circle at 50% 38%, transparent 0px, transparent 68px, rgba(255,255,255,0.07) 70px, rgba(255,255,255,0.07) 72px, transparent 74px)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 75% at 50% 32%, transparent 45%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  )
}

function EmailCaptureForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const honeypotRef = useRef(null)

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setStatus('submitting')
      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encodeFormData({
            'form-name': 'schedule-demo',
            email,
            'bot-field': honeypotRef.current?.value ?? '',
          }),
        })
        if (!response.ok) throw new Error('Submission failed')
        setStatus('success')
        setEmail('')
      } catch {
        setStatus('error')
      }
    },
    [email]
  )

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.p
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="rounded-full bg-white py-4 text-center text-sm font-semibold text-[#0a0a0a]"
          >
            Thanks! We&apos;ll be in touch shortly.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            name="schedule-demo"
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 rounded-[1.75rem] bg-white p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] sm:flex-row sm:items-center sm:rounded-full"
          >
            <input type="hidden" name="form-name" value="schedule-demo" />
            <p className="hidden">
              <label>
                Don&apos;t fill this out: <input ref={honeypotRef} name="bot-field" tabIndex={-1} autoComplete="off" />
              </label>
            </p>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your work email"
              className="w-full min-w-0 flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-[#0a0a0a] outline-none placeholder:text-black/40 sm:py-0 sm:text-base"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full shrink-0 whitespace-nowrap rounded-full bg-[#0a0a0a] px-6 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {status === 'submitting' ? 'Sending…' : 'Schedule a Call'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {status === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="mt-2 text-center text-sm text-red-400"
          >
            Something went wrong. Please try again.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Hero({ introDone }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#161616] px-6 pt-24 text-center sm:px-8">
      <SunburstBackground />
      <h1 className="relative mt-6 text-[clamp(2.5rem,7.5vw,6rem)] font-black leading-[0.98] tracking-[-0.035em]">
        <RevealWords text={'We are your\nsoftware partner'} trigger="mount" play={introDone} baseDelay={0} duration={0.6} stagger={0.035} />
      </h1>

      <motion.p
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={!introDone ? undefined : shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.35 }}
        className="relative mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg"
      >
        Hurdl is your fractional CTO. We implement AI, build custom software, and make the
        technical calls, so nothing stalls.
      </motion.p>

      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={!introDone ? undefined : shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.5 }}
        className="relative mt-10 w-full max-w-md"
      >
        <EmailCaptureForm />
      </motion.div>
    </section>
  )
}

function About() {
  const values = [
    {
      title: 'Embedded, not outsourced',
      description: 'We work inside your business like part of the team, not a vendor at arm’s length.',
    },
    {
      title: 'Built to ship',
      description: 'Every engagement ends with something running in production, not a slide deck.',
    },
    {
      title: 'AI-first thinking',
      description: 'We look for where automation and AI can multiply your output, not just tick a box.',
    },
  ]
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="about" className="relative mx-auto max-w-4xl scroll-mt-24 px-6 py-28 sm:px-8 md:py-36">
      <Eyebrow label="Introduction" />

      <h2 className="mt-4 text-[clamp(1.85rem,3.6vw,2.75rem)] font-black leading-[1.08] tracking-[-0.02em]">
        <RevealWords text={'You don\'t need a full engineering team.\nYou need the right technical partner.'} />
      </h2>

      <ScrollTintText
        text="Most businesses hit a wall where the next step needs real technical judgment: evaluating AI, architecting a new system, shipping custom software. But hiring a full-time CTO or engineering team isn't the right move yet. Hurdl steps in as that partner, embedded enough to make real decisions and senior enough to be trusted with them."
        className="mt-6 max-w-2xl text-[15px] leading-7 text-white/90 sm:text-base"
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {values.map((value, i) => (
          <motion.div
            key={value.title}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.08 }}
            className="border-l-2 border-white/[0.12] pl-5"
          >
            <h3 className="text-base font-bold tracking-tight">{value.title}</h3>
            <p className="mt-1.5 text-[15px] leading-6 text-white/55">{value.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function AccordionRow({ index, title, description, isOpen, onToggle }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.06 }}
      className="border-b-2 transition-colors duration-300 ease-out"
      style={{ borderColor: isOpen ? ORANGE : 'rgba(255,255,255,0.1)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 py-6 text-left transition-[padding-left] duration-300 ease-out hover:pl-2"
      >
        <span className="flex items-baseline gap-5">
          <span className="text-sm font-semibold" style={{ color: ORANGE }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-lg font-bold tracking-tight sm:text-xl">{title}</span>
        </span>
        <CaretRightIcon
          size={18}
          weight="bold"
          className={`shrink-0 text-white/40 transition-transform duration-300 ease-out ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={shouldReduceMotion ? false : { height: 0 }}
            animate={{ height: 'auto' }}
            exit={shouldReduceMotion ? {} : { height: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: shouldReduceMotion ? 0 : 0.08 }}
              className="max-w-lg pb-7 text-[15px] leading-6 text-white/55 sm:pl-11"
            >
              {description}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Accordion({ items }) {
  const [openSet, setOpenSet] = useState(() => new Set())

  const toggle = (i) => {
    setOpenSet((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="border-t border-white/10">
      {items.map((item, i) => (
        <AccordionRow
          key={item.title}
          index={i}
          title={item.title}
          description={item.description}
          isOpen={openSet.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  )
}

function Services() {
  return (
    <section id="what-we-do" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 sm:px-8 md:py-36">
      <div className="grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <div>
          <Eyebrow label="Services" />
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.05] tracking-[-0.02em]">
            <RevealWords text={'How we close the gap.'} />
          </h2>
        </div>

        <Accordion items={SERVICES} />
      </div>
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
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <div
        className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border transition-[background-color,border-color,box-shadow] duration-300 ease-out sm:h-10 sm:w-10"
        style={{
          borderColor: isLit ? '#ffffff' : 'rgba(255,255,255,0.25)',
          backgroundColor: isLit ? '#ffffff' : 'rgba(0,0,0,0.2)',
          color: isLit ? ORANGE : 'rgba(255,255,255,0.5)',
          boxShadow: isLit ? '0 0 0 6px rgba(255,255,255,0.15), 0 0 24px 4px rgba(255,255,255,0.25)' : 'none',
        }}
      >
        <Icon size={18} weight="light" />
      </div>

      <div
        className="rounded-[1.75rem] p-1.5 transition-colors duration-300 ease-out"
        style={{
          background: isLit ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          boxShadow: `inset 0 0 0 1px ${isLit ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`,
        }}
      >
        <div className="rounded-[1.4rem] bg-[#141210] p-6 sm:p-8">
          <span className="text-xs font-semibold tracking-[0.2em] text-white/40">{step.number}</span>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">{step.title}</h3>
          <p className="mt-2 max-w-md text-[15px] leading-6 text-white/70">{step.description}</p>
        </div>
      </div>
    </motion.li>
  )
}

function HowWeWork() {
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
    <section id="how-we-work" ref={sectionRef} className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-32 sm:px-8 md:py-40">
      <p
        aria-hidden="true"
        className="pointer-events-none select-none text-center text-[11vw] font-black leading-[0.75] tracking-tight text-white/[0.04] sm:text-[6vw]"
      >
        One call starts it.
      </p>

      <div
        className="relative -mt-[7vw] overflow-hidden rounded-[2.5rem] p-8 sm:-mt-[3.5vw] sm:p-14 md:p-20"
        style={{
          background: `radial-gradient(120% 100% at 12% 0%, ${ORANGE} 0%, #7a3f0a 45%, #14100c 85%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 0.5px, transparent 0.5px)',
            backgroundSize: '3px 3px',
          }}
        />

        <div className="relative">
          <Eyebrow label="Process" dotClassName="bg-white" textClassName="text-white/70" />

          <h2 className="mt-4 max-w-xl text-[clamp(1.85rem,3.6vw,2.75rem)] font-black leading-[1.08] tracking-[-0.02em]">
            <RevealWords text={'One call starts it.\nHurdl carries it through.'} />
          </h2>

          <div className="relative mt-14 sm:mt-20">
            <div className="absolute bottom-2 left-4 top-2 w-px bg-white/15 sm:left-5" />
            <motion.div
              className="absolute bottom-2 left-4 top-2 w-px origin-top bg-white sm:left-5"
              style={{ scaleY: lineProgress }}
            />
            <ol className="space-y-16 sm:space-y-20">
              {STEPS.map((step, i) => (
                <StepCard key={step.number} step={step} isLit={i < litCount} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function DemoSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="schedule-demo" className="relative mx-auto max-w-4xl scroll-mt-24 px-6 py-28 sm:px-8 md:py-36">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="mx-auto max-w-xl rounded-[2rem] border border-white/[0.08] bg-white/[0.03] px-6 py-12 text-center sm:px-12"
      >
        <Eyebrow label="Get in touch" className="justify-center" />
        <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)] font-black tracking-[-0.02em]">Schedule a Call</h2>
        <p className="mx-auto mt-3 max-w-sm text-white/55">Tell us about the problem you&apos;re facing. We&apos;ll show you how Hurdl can help.</p>

        <div className="mx-auto mt-10 max-w-md">
          <EmailCaptureForm />
        </div>

        <p className="mt-4 text-xs text-white/35">No spam. We&apos;ll reach out to schedule a quick call.</p>
      </motion.div>
    </section>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()
  const shouldReduceMotion = useReducedMotion()
  const fadeUp = (delay) => ({
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-10% 0px' },
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  })

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.08] bg-[#1c1c1c]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-sm text-white/55 sm:grid-cols-4 sm:px-8">
        <motion.div {...fadeUp(0)} className="col-span-2 sm:col-span-1">
          <img src="/hurdl_logo.png" alt="Hurdl" className="h-14 w-auto" />
          <p className="mt-3 leading-6">Technical expertise, on demand.</p>
        </motion.div>
        <motion.div {...fadeUp(0.1)}>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-white/35">Information</p>
          <a href="/privacy" className="block transition-colors hover:text-white">
            Privacy Policy
          </a>
          <a href="/terms" className="mt-2 block transition-colors hover:text-white">
            Terms &amp; Conditions
          </a>
        </motion.div>
        <motion.div {...fadeUp(0.2)} className="sm:text-right">
          <p>&copy; {currentYear} Hurdl</p>
        </motion.div>
      </div>
    </footer>
  )
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false)

  return (
    <ReactLenis root options={{ autoRaf: true }}>
      <main
        id="top"
        className="bg-[#161616] text-white antialiased"
        style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        <SiteIntro onFinish={() => setIntroDone(true)} />
        <NavBar />
        <Hero introDone={introDone} />
        <About />
        <Services />
        <HowWeWork />
        <DemoSection />
        <Footer />
      </main>
    </ReactLenis>
  )
}
