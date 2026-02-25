import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import WavingHandParticles from './WavingHandParticles'

const BLOB_COUNT = 14
const PALETTE = buildPalette()
const RENDER_SCALE = 0.25
const HOW_IT_WORKS_ITEMS = [
  {
    label: '01',
    title: 'Smart Matching',
    description:
      'Automatically filter caregivers based on client-specific restrictions (allergies, environment, or physical requirements).',
  },
  {
    label: '02',
    title: 'Instant Notifications',
    description:
      'Reach your team where they are via SMS with integrated opt-in and consent management.',
  },
  {
    label: '03',
    title: 'Real-Time Coverage',
    description:
      'Track shift offers from "dropped" to "assigned" with a clear audit trail for agency directors.',
  },
]

function createBlobs(w, h) {
  return Array.from({ length: BLOB_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: (w + h) / 8 + Math.random() * 50, 
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    freqX: 0.002 + Math.random() * 0.003,
    freqY: 0.002 + Math.random() * 0.003,
  }));
}

function buildPalette() {
  const p = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    const hue = (10 + 20 * t) / 360
    const light = Math.min(8 + t * 52, 60) / 100
    const [r, g, b] = hslToRgb(hue, 1, light)
    p[i * 3] = r
    p[i * 3 + 1] = g
    p[i * 3 + 2] = b
  }
  return p
}

function hslToRgb(h, s, l) {
  if (s === 0) return [Math.round(l * 255), Math.round(l * 255), Math.round(l * 255)]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const ch = (t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [Math.round(ch(h + 1 / 3) * 255), Math.round(ch(h) * 255), Math.round(ch(h - 1 / 3) * 255)]
}

function LinkArrow({ className = '' }) {
  return (
    <svg viewBox="0 0 85.01 85.01" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.62,0c-1.48,0-2.68,1.19-2.69,2.67l-.08,8.93c0,1.5,1.2,2.71,2.69,2.71h47.52c2.4,0,3.6,2.9,1.9,4.59L74.87,0H6.62Z"
      />
      <path
        fill="currentColor"
        d="M85,2.69c0-1.49-1.2-2.69-2.69-2.69h-7.44l-18.9,18.9-4.1,4.1L.79,74.08c-1.05,1.05-1.05,2.75,0,3.81l6.33,6.33c1.05,1.05,2.75,1.05,3.81,0l55.18-55.18,18.9-18.9V2.69h-.01Z"
      />
      <path
        fill="currentColor"
        d="M66.1,29.04c1.7-1.7,4.59-.49,4.59,1.9v47.52c0,1.5,1.22,2.7,2.71,2.69l8.93-.08c1.48-.01,2.67-1.21,2.67-2.69V10.13l-18.9,18.9h0Z"
      />
    </svg>
  )
}

export default function LavaHero() {
  const canvasRef = useRef(null)
  const sectionThreeRef = useRef(null)
  const blobsRef = useRef([])
  const lavaRafRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0 })
  const currentYear = new Date().getFullYear()

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = Math.floor(window.innerWidth * RENDER_SCALE)
    const h = Math.floor(window.innerHeight * RENDER_SCALE)
    canvas.width = w
    canvas.height = h
    sizeRef.current = { w, h }
    if (blobsRef.current.length === 0) {
      blobsRef.current = createBlobs(w, h)
    }
  }, [])

  // Lava canvas loop
  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let time = 0

    function tick() {
      const { w, h } = sizeRef.current
      if (w === 0 || h === 0) { lavaRafRef.current = requestAnimationFrame(tick); return }

      const blobs = blobsRef.current
      time++

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i]
        b.x += b.vx + Math.sin(time * b.freqX + b.phaseX) * 0.5
        b.y += b.vy + Math.cos(time * b.freqY + b.phaseY) * 0.5
        if (b.x < -b.r) b.x = w + b.r
        if (b.x > w + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = h + b.r
        if (b.y > h + b.r) b.y = -b.r
      }

      const imageData = ctx.createImageData(w, h)
      const data = imageData.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0
          for (let i = 0; i < blobs.length; i++) {
            const b = blobs[i]
            const dx = x - b.x
            const dy = y - b.y
            sum += (b.r * b.r) / (dx * dx + dy * dy + 1)
          }
          const idx = Math.min((sum * 20) | 0, 255)
          const pi = idx * 3
          const off = (y * w + x) * 4
          data[off] = PALETTE[pi]
          data[off + 1] = PALETTE[pi + 1]
          data[off + 2] = PALETTE[pi + 2]
          data[off + 3] = 255
        }
      }
      ctx.putImageData(imageData, 0, 0)
      lavaRafRef.current = requestAnimationFrame(tick)
    }

    lavaRafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(lavaRafRef.current)
    }
  }, [handleResize])

  return (
    <main
      className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="fixed top-0 right-0 z-30 p-4 sm:p-6">
        <a
          href="#schedule-demo"
          onClick={(event) => {
            event.preventDefault()
            sectionThreeRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="group relative flex flex-col gap-[3px] text-[10px] font-medium uppercase leading-none text-white sm:text-[11px]"
        >
          <div className="relative flex items-center gap-[10px]">
            <span className="pointer-events-none invisible absolute left-0 opacity-0 transition-all duration-500 ease-out group-hover:visible group-hover:opacity-100">
              <LinkArrow className="h-[10px] w-[7px] rotate-45" />
            </span>
            <span className="transition-transform duration-500 ease-out group-hover:translate-x-[14px]">Book a demo</span>
            <span className="transition-opacity duration-500 ease-out group-hover:opacity-0">
              <LinkArrow className="h-[10px] w-[7px]" />
            </span>
          </div>
          <span className="h-px w-full origin-right scale-x-100 bg-current transition-transform duration-500 ease-out group-hover:scale-x-0" />
          <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 ease-out group-hover:scale-x-100" />
        </a>
      </div>

      <section className="relative h-screen snap-start overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: 'auto' }}
        />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center select-none">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-[4rem] leading-none font-black tracking-tight sm:text-[6rem] md:text-[8rem]"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              color: 'rgb(255, 245, 170)',
              textShadow: '0 0 30px rgba(255,200,60,0.6), 0 0 60px rgba(255,69,0,0.25)',
            }}
          >
            Hurdl
          </motion.h1>
        </div>

        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-6 text-sm">
          <a href="/privacy" className="text-white/40 transition-colors hover:text-white/80">Privacy Policy</a>
          <a href="/terms" className="text-white/40 transition-colors hover:text-white/80">Terms &amp; Conditions</a>
        </div>
      </section>

      <section className="relative h-screen snap-start overflow-hidden bg-[#111] px-6 py-14 text-white sm:px-10 md:px-16">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="flex min-h-0 flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff9a74]">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#ffd38f] sm:text-4xl md:text-5xl">
              Focus on care, not coordination.
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/82 sm:text-base">
              When a caregiver can’t make it, the clock starts ticking. Hurdl takes the pressure off your office staff
              by instantly identifying and notifying the right replacements. We handle the logistics of consent,
              notifications, and matching so your clients never miss an hour of the care they depend on.
            </p>

            <div className="mt-8 space-y-6">
              {HOW_IT_WORKS_ITEMS.map((item) => (
                <article key={item.title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#ff6a33]/50 text-xs font-semibold text-[#ff9a74]">
                    {item.label}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#ff8a5a] sm:text-lg">{item.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/78">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="relative hidden min-h-[440px] overflow-hidden lg:block">
            <WavingHandParticles />
          </div>
        </div>
      </section>

      <section id="schedule-demo" ref={sectionThreeRef} className="relative h-screen snap-start overflow-hidden bg-white px-6 py-16 sm:px-10">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-center pb-24">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Schedule a Demo</h2>
            <form className="mt-8 space-y-5">
              <div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-[#ff6a33] focus:ring-2 focus:ring-[#ff6a33]/20"
                  placeholder="First name"
                />
              </div>

              <div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-[#ff6a33] focus:ring-2 focus:ring-[#ff6a33]/20"
                  placeholder="Last name"
                />
              </div>

              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-[#ff6a33] focus:ring-2 focus:ring-[#ff6a33]/20"
                  placeholder="you@agency.com"
                />
              </div>

              <button
                type="button"
                className="mt-2 w-full rounded-lg bg-[#ff6a33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e55a28]"
              >
                Request Demo
              </button>
            </form>
          </div>
        </div>

        <footer className="absolute inset-x-0 bottom-0 border-t border-gray-200/80 bg-white/90 backdrop-blur-[1px]">
          <div className="mx-auto flex max-w-6xl pb-[10vw] items-center justify-between px-6 py-4 text-xs text-gray-500 sm:px-10">
            <p>Autonomy, Designed for Everyday Care.</p>
            <p>&copy; {currentYear} Hurdl</p>
          </div>
          <p className="pointer-events-none relative -mt-[12vw] translate-y-[-8vw] -bottom-[12vw] left-0 right-0 select-none text-center text-[32vw] font-black leading-[0.7] tracking-tighter text-[#ff6a33]/12 sm:text-[24vw]">
            Hurdl
          </p>
        </footer>
      </section>
    </main>
  )
}
