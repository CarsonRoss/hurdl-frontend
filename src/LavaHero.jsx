import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

const BLOB_COUNT = 14
const PALETTE = buildPalette()
const FLASHLIGHT_RADIUS = 400
const RENDER_SCALE = 0.25

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

export default function LavaHero() {
  const canvasRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const blobsRef = useRef([])
  const lavaRafRef = useRef(0)
  const textRafRef = useRef(0)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const sizeRef = useRef({ w: 0, h: 0 })

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
          const idx = Math.min((sum * 40) | 0, 255)
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

  // // Text flashlight loop — DOM-only, no React re-renders
  // useEffect(() => {
  //   function updateText() {
  //     const cx = window.innerWidth / 2
  //     const cy = window.innerHeight / 2
  //     const { x, y } = mouseRef.current
  //     const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
  //     const p = Math.max(0, 1 - dist / FLASHLIGHT_RADIUS)

  //     if (titleRef.current) {
  //       const r = Math.round(30 + 225 * p)
  //       const g = Math.round(30 + 215 * p)
  //       const b = Math.round(30 + 140 * p)
  //       titleRef.current.style.color = `rgb(${r},${g},${b})`
  //       const ga = p * 0.6
  //       titleRef.current.style.textShadow = ga > 0.05
  //         ? `0 0 ${30 * p}px rgba(255,200,60,${ga}), 0 0 ${60 * p}px rgba(255,69,0,${ga * 0.5})`
  //         : 'none'
  //     }
  //     if (subtitleRef.current) {
  //       subtitleRef.current.style.color = `rgba(${180 + 75 * p},${160 + 75 * p},${140 + 75 * p},0.8)`
  //     }
  //     textRafRef.current = requestAnimationFrame(updateText)
  //   }
  //   textRafRef.current = requestAnimationFrame(updateText)
  //   return () => cancelAnimationFrame(textRafRef.current)
  // }, [])

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black" onMouseMove={handleMouseMove}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'auto' }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
      <motion.h1
        ref={titleRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-[4rem] sm:text-[6rem] md:text-[8rem] leading-none font-black tracking-tight"
        style={{ 
          fontFamily: "'Montserrat', sans-serif", 
          color: 'rgb(255, 245, 170)', // Constant soft yellow
          textShadow: '0 0 30px rgba(255,200,60,0.6), 0 0 60px rgba(255,69,0,0.25)' // Static glow
        }}
      >
        Hurdl
      </motion.h1>
        <motion.p
          ref={subtitleRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-2 text-lg sm:text-xl tracking-wide"
          style={{ color: 'rgba(255, 235, 215, 0.8)' }}
        >
          Coming soon.
        </motion.p>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-10 text-sm">
        <a href="/privacy" className="text-white/40 hover:text-white/80 transition-colors">Privacy Policy</a>
        <a href="/terms" className="text-white/40 hover:text-white/80 transition-colors">Terms &amp; Conditions</a>
      </div>
    </div>
  )
}
