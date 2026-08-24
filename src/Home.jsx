import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion'
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  ChatCircleText,
  CheckCircle,
  MagnifyingGlass,
  Code,
  Handshake,
  Compass,
} from '@phosphor-icons/react'

const ORANGE = '#F89434'
const NAV_OFFSET = 96
const EASE_OUT = [0.16, 1, 0.3, 1]

const SERVICES = [
  {
    title: 'Fractional CTO',
    description:
      "Architecture decisions, vendor evaluation, technical hiring, or roadmap planning. Hurdl makes the judgment calls without the full-time hire.",
    visual: RadarPulse,
  },
  {
    title: 'AI Implementation',
    description: 'We integrate AI into your existing workflows so it actually moves the needle, not just a chatbot bolted on.',
    visual: ConsoleFeed,
  },
  {
    title: 'Custom Software',
    description: 'When off-the-shelf software doesn’t cut it, we design and build the product that gets you the outcome.',
    visual: CodeTyping,
  },
  {
    title: 'Architecture & Systems Design',
    description: 'A technical foundation that scales with the business instead of fighting it.',
    visual: StackLayers,
  },
  {
    title: 'Technical Due Diligence',
    description: 'A second, senior opinion before you buy software, hire a vendor, or sign the contract.',
    visual: ChecklistChips,
  },
  {
    title: 'Ongoing Partnership',
    description: 'We stay embedded as your technical advisor, so the next hard decision doesn’t stall the business.',
    visual: HandshakeShake,
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
    ease: EASE_OUT,
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

function RevealWords({ text, trigger = 'view', baseDelay = 0, viewportMargin = '-15% 0px', className }) {
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
      ? { animate: { opacity: 1, y: 0, filter: 'blur(0px)' } }
      : { whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: viewportMargin } }

  return (
    <span className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((word) => {
            const i = wordIndex++
            return (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20, filter: 'blur(2px)' }}
                {...revealProps}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: baseDelay + i * 0.05 }}
              >
                {word}
                {' '}
              </motion.span>
            )
          })}
        </span>
      ))}
    </span>
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
          className="group inline-flex items-center gap-2 rounded-full bg-[#F89434] py-2 pl-4 pr-1.5 text-sm font-semibold text-[#0a0a0a] transition-transform active:scale-[0.97]"
        >
          Schedule a Call
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[8%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-[110px]"
        style={{ background: `radial-gradient(circle, ${ORANGE}, transparent 70%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,black,transparent)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <h1 className="relative mt-6 text-[clamp(2.5rem,7.5vw,6rem)] font-black leading-[0.98] tracking-[-0.035em] text-[#0a0a0a]">
        <RevealWords text={'Leap over your\ntechnical Hurdl'} trigger="mount" baseDelay={0.15} />
      </h1>

      <motion.p
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay: .3 }}
        className="relative mt-6 max-w-xl text-base leading-7 text-black/55 sm:text-lg"
      >
        Hurdl is your fractional CTO. We implement AI, build custom software, and make the
        technical calls, so nothing stalls.
      </motion.p>

      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay: .4 }}
        className="relative mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <a
          href="#schedule-demo"
          onClick={handleScrollTo('schedule-demo')}
          className="group inline-flex items-center gap-2 rounded-full bg-[#F89434] py-3 pl-6 pr-2.5 text-sm font-semibold text-[#0a0a0a] transition-transform active:scale-[0.98]"
        >
          Schedule a Call
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            <ArrowUpRight size={16} weight="bold" />
          </span>
        </a>
        <a
          href="#what-we-do"
          onClick={handleScrollTo('what-we-do')}
          className="text-sm font-medium text-black/60 transition-colors hover:text-black"
        >
          See what we do
        </a>
      </motion.div>
    </section>
  )
}

function About() {
  const shouldReduceMotion = useReducedMotion()

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

  return (
    <section id="about" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 sm:px-8 md:py-36">
      <div className="grid gap-14 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <h2 className="mt-4 text-[clamp(1.85rem,3.6vw,2.75rem)] font-black leading-[1.08] tracking-[-0.02em]">
            <RevealWords text={'You don\'t need a full engineering team.\nYou need the right technical partner.'} />
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-black/55">
            Most businesses hit a wall where the next step needs real technical judgment:
            evaluating AI, architecting a new system, shipping custom software. But hiring a
            full-time CTO or engineering team isn&apos;t the right move yet. Hurdl steps in as
            that partner, embedded enough to make real decisions and senior enough to be trusted
            with them.
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.08 }}
              className="border-l-2 border-black/[0.08] pl-5"
            >
              <h3 className="text-base font-bold tracking-tight">{value.title}</h3>
              <p className="mt-1.5 text-[15px] leading-6 text-black/55">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RadarPulse() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
      {!skip &&
        [0, 0.7, 1.4].map((delay, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: 'rgba(248,148,52,0.4)' }}
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 3.6, opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay }}
          />
        ))}
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(248,148,52,0.12)', color: ORANGE }}
      >
        <Compass size={22} weight="bold" />
      </div>
    </div>
  )
}

const AI_LINES = ['Analyzing workflow…', 'Mapping automation points…', 'Deploying AI agent…', 'Workflow automated ✓']

function ConsoleFeed() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const [i, setI] = useState(0)

  useEffect(() => {
    if (shouldReduceMotion || !isInView) return
    const id = setInterval(() => setI((v) => (v + 1) % AI_LINES.length), 1900)
    return () => clearInterval(id)
  }, [shouldReduceMotion, isInView])

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col justify-center gap-2 px-6">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-black/15" />
        <span className="h-2 w-2 rounded-full bg-black/15" />
        <span className="h-2 w-2 rounded-full bg-black/15" />
      </div>
      <div
        className="rounded-lg bg-white px-3 py-2.5 font-mono text-[12.5px] text-black/70"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 8px 20px -14px rgba(0,0,0,0.3)' }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={shouldReduceMotion ? 'static' : i}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="inline-flex items-center gap-1"
          >
            {AI_LINES[i]}
            <span className="inline-block h-3.5 w-[2px] animate-pulse" style={{ background: ORANGE }} />
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

const CODE_LINES = [
  { text: 'function shipFast() {', className: 'text-black/70' },
  { text: '  return outcome;', className: 'text-[#F89434]' },
  { text: '}', className: 'text-black/70' },
]

function CodeTyping() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col justify-center gap-1.5 px-6 font-mono text-[12.5px]">
      {CODE_LINES.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            className={`whitespace-nowrap ${line.className}`}
            style={{ width: `${line.text.length}ch` }}
            initial={shouldReduceMotion ? false : { clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{
              duration: 0.7,
              delay: 0.3 + i * 0.5,
              repeat: shouldReduceMotion || !isInView ? 0 : Infinity,
              repeatDelay: 2.6,
              ease: EASE_OUT,
            }}
          >
            {line.text}
          </motion.div>
        </div>
      ))}
    </div>
  )
}

function StackLayers() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView
  const layers = [0, 1, 2]

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
      {layers.map((i) => (
        <motion.div
          key={i}
          className="absolute h-20 w-32 rounded-xl border border-black/[0.06] bg-white"
          style={{ zIndex: layers.length - i, boxShadow: '0 14px 30px -18px rgba(0,0,0,0.3)' }}
          initial={{ y: i * 11, opacity: 1 - i * 0.15 }}
          animate={skip ? {} : { y: [i * 11, i * 11 - 7, i * 11] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
    </div>
  )
}

const DILIGENCE_ITEMS = [
  { label: 'Vendor reviewed', className: 'left-[8%] top-[16%]' },
  { label: 'Risk: Low', className: 'right-[10%] top-[42%]' },
  { label: 'Contract flagged', className: 'left-[14%] bottom-[18%]' },
  { label: 'Security checked', className: 'right-[6%] bottom-[38%]' },
]

function ChecklistChips() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {DILIGENCE_ITEMS.map((item, i) => (
        <motion.div
          key={item.label}
          className={`absolute flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-black/70 ${item.className}`}
          style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 10px 25px -14px rgba(0,0,0,0.3)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={skip ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{
            duration: 3.6,
            repeat: skip ? 0 : Infinity,
            times: [0, 0.18, 0.8, 1],
            delay: i * 0.85,
            ease: 'easeInOut',
          }}
        >
          <CheckCircle size={12} weight="fill" style={{ color: ORANGE }} />
          {item.label}
        </motion.div>
      ))}
    </div>
  )
}

function HandshakeShake() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { margin: '100px' })
  const skip = shouldReduceMotion || !isInView

  return (
    <div ref={containerRef} className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      {!skip &&
        [0, 1].map((delay, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-[42%] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: 'rgba(248,148,52,0.4)' }}
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay }}
          />
        ))}
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(248,148,52,0.12)', color: ORANGE }}
        animate={skip ? {} : { y: [0, -5, 0, -5, 0], rotate: [0, -6, 4, -6, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      >
        <Handshake size={22} weight="bold" />
      </motion.div>
      <motion.div
        className="h-1.5 w-8 rounded-full bg-black/10"
        animate={skip ? {} : { scaleX: [1, 0.7, 1, 0.7, 1], opacity: [0.45, 0.25, 0.45, 0.25, 0.45] }}
        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      />
    </div>
  )
}

function ServiceCard({ service, index }) {
  const shouldReduceMotion = useReducedMotion()
  const Visual = service.visual

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: (index % 3) * 0.08 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-black/[0.07] bg-white shadow-[0_20px_45px_-30px_rgba(0,0,0,0.15)] transition-[box-shadow,border-color] duration-300 hover:border-[#F89434]/30 hover:shadow-[0_25px_60px_-25px_rgba(248,148,52,0.35)]"
    >
      <div className="relative h-36 shrink-0 overflow-hidden border-b border-black/[0.06] bg-[#fbfbfa] sm:h-40">
        {Visual ? <Visual /> : null}
      </div>
      <div className="relative flex-1 p-7 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-6 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25"
          style={{ background: ORANGE }}
        />
        <h3 className="relative text-lg font-bold tracking-tight">{service.title}</h3>
        <p className="relative mt-2 max-w-sm text-[15px] leading-6 text-black/55">{service.description}</p>
      </div>
    </motion.div>
  )
}

function Services() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="what-we-do" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 sm:px-8 md:py-36">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="mb-14 max-w-xl"
      >
        <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.05] tracking-[-0.02em]">
          <RevealWords text={'How we plug the technical gap.'} />
        </h2>
      </motion.div>

      <ServiceCarousel />
    </section>
  )
}

function ServiceCarousel() {
  const scrollerRef = useRef(null)
  const isScrollingRef = useRef(false)
  const shouldReduceMotion = useReducedMotion()
  const [progress, setProgress] = useState(0)

  const updateProgress = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const raf = requestAnimationFrame(updateProgress)
    el.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [updateProgress])

  const scrollByCard = (dir) => {
    const el = scrollerRef.current
    if (!el || isScrollingRef.current) return
    const card = el.querySelector('[data-carousel-card]')
    const amount = card ? card.getBoundingClientRect().width + 20 : 320

    isScrollingRef.current = true
    const clearFlag = () => {
      isScrollingRef.current = false
    }
    el.addEventListener('scrollend', clearFlag, { once: true })
    window.setTimeout(clearFlag, 700) // fallback for browsers without `scrollend`

    el.scrollBy({ left: dir * amount, behavior: shouldReduceMotion ? 'instant' : 'smooth' })
  }

  const canScrollPrev = progress > 0.02
  const canScrollNext = progress < 0.98

  return (
    <div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SERVICES.map((service, i) => (
          <div key={service.title} data-carousel-card className="w-[78vw] shrink-0 snap-start sm:w-[340px]">
            <ServiceCard service={service} index={i} />
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-center gap-4">
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.08]">
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#F89434]"
            animate={{ scaleX: Math.max(progress, 0.08) }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollPrev}
            aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-[color,border-color,opacity] duration-200 hover:border-[#F89434]/40 hover:text-[#F89434] disabled:pointer-events-none disabled:opacity-30"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canScrollNext}
            aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-[color,border-color,opacity] duration-200 hover:border-[#F89434]/40 hover:text-[#F89434] disabled:pointer-events-none disabled:opacity-30"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
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
          borderColor: isLit ? ORANGE : 'rgba(0,0,0,0.1)',
          backgroundColor: isLit ? ORANGE : '#ffffff',
          color: isLit ? '#ffffff' : 'rgba(0,0,0,0.35)',
          boxShadow: isLit ? `0 0 0 6px rgba(248,148,52,0.12), 0 0 24px 4px rgba(248,148,52,0.35)` : 'none',
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
    <section id="how-we-work" ref={sectionRef} className="relative mx-auto max-w-3xl scroll-mt-24 px-6 py-32 sm:px-8 md:py-40">
      <div className="mb-20 max-w-xl">
        <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.05] tracking-[-0.02em]">
          <RevealWords text={'One call starts it.\nHurdl carries it through.'} />
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
          <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-black tracking-[-0.02em]">Schedule a Call</h2>
          <p className="mt-3 text-black/55">Tell us about the problem you&apos;re facing. We&apos;ll show you how Hurdl can help.</p>
        </div>

        <div className="mt-10 rounded-[2rem] bg-black/[0.02] p-2" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
          <div className="rounded-[1.6rem] bg-white p-8 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.15)] sm:p-10">
            <AnimatePresence mode="wait">
              {demoStatus === 'success' ? (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: successEnterY }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="py-6 text-center text-black/70"
                >
                  Thanks! We got your request and will reach out shortly.
                </motion.p>
              ) : (
                <motion.form
                  key="form"
                  exit={{ opacity: 0, y: formExitY }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
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

                  <AnimatePresence>
                    {demoStatus === 'error' && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="text-sm text-red-500"
                      >
                        Something went wrong. Please try again.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={demoStatus === 'submitting'}
                    className="mt-2 w-full rounded-full bg-[#F89434] py-3.5 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#E0841E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {demoStatus === 'submitting' ? 'Sending…' : 'Schedule Call'}
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
  const shouldReduceMotion = useReducedMotion()

  return (
    <footer className="relative overflow-hidden border-t border-black/[0.06] bg-white">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-sm text-black/55 sm:grid-cols-4 sm:px-8"
      >
        <div className="col-span-2 sm:col-span-1">
          <img src="/hurdl_logo.png" alt="Hurdl" className="h-7 w-auto" />
          <p className="mt-3 leading-6">Technical expertise, on demand.</p>
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
      </motion.div>
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
      <About />
      <Services />
      <HowWeWork />
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
