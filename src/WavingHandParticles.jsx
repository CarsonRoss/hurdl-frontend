import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 220
const INTERACTION_RADIUS = 100
const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS
const SPRING = 0.055
const DAMPING = 0.86
function createSphereParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const y = 1 - (i / (PARTICLE_COUNT - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = Math.PI * (3 - Math.sqrt(5)) * i
    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    return {
      baseX: x,
      baseY: y,
      baseZ: z,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      depth: 0,
    }
  })
}

export default function WavingHandParticles({ className = '' }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const metricsRef = useRef({ width: 0, height: 0, centerX: 0, centerY: 0, shapeRadius: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapRef.current
    if (!canvas || !wrapper) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const setup = () => {
      const rect = wrapper.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width))
      const height = Math.max(1, Math.floor(rect.height))
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      metricsRef.current = {
        width,
        height,
        centerX: width * 0.5,
        centerY: height * 0.52,
        shapeRadius: Math.min(width, height) * 0.43,
      }
      particlesRef.current = createSphereParticles()
    }

    const handlePointerMove = (event) => {
      const rect = wrapper.getBoundingClientRect()
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      }
    }

    const handlePointerLeave = () => {
      mouseRef.current.active = false
    }

    const render = (time) => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const particles = particlesRef.current
      const mouse = mouseRef.current
      const { centerX, centerY, shapeRadius } = metricsRef.current

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]

        const rotY = time * 0.00055
        const rotX = Math.sin(time * 0.00035) * 0.25

        const cosY = Math.cos(rotY)
        const sinY = Math.sin(rotY)
        const cosX = Math.cos(rotX)
        const sinX = Math.sin(rotX)

        const x1 = p.baseX * cosY - p.baseZ * sinY
        const z1 = p.baseX * sinY + p.baseZ * cosY
        const y1 = p.baseY * cosX - z1 * sinX
        const z2 = p.baseY * sinX + z1 * cosX

        const perspective = 2.3
        const depthFactor = perspective / (perspective + z2)
        const targetX = centerX + x1 * shapeRadius * depthFactor
        const targetY = centerY + y1 * shapeRadius * depthFactor
        p.depth = (z2 + 1) * 0.5

        if (p.x === 0 && p.y === 0) {
          p.x = targetX
          p.y = targetY
        }

        p.vx += (targetX - p.x) * SPRING
        p.vy += (targetY - p.y) * SPRING
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const distSq = dx * dx + dy * dy

          if (distSq > 0.001 && distSq < INTERACTION_RADIUS_SQ) {
            const dist = Math.sqrt(distSq)
            const strength = ((INTERACTION_RADIUS - dist) / INTERACTION_RADIUS) * 1.2
            p.vx += (dx / dist) * strength
            p.vy += (dy / dist) * strength
          }
        }

        p.vx *= DAMPING
        p.vy *= DAMPING

        p.x += p.vx
        p.y += p.vy

        const size = 0.8 + p.depth * 1.4
        const alpha = 0.2 + p.depth * 0.65
        ctx.fillStyle = `rgba(255, 106, 51, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(render)
    }

    setup()
    animRef.current = requestAnimationFrame(render)

    const resizeObserver = new ResizeObserver(setup)
    resizeObserver.observe(wrapper)
    wrapper.addEventListener('pointermove', handlePointerMove, { passive: true })
    wrapper.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('blur', handlePointerLeave)

    return () => {
      resizeObserver.disconnect()
      wrapper.removeEventListener('pointermove', handlePointerMove)
      wrapper.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('blur', handlePointerLeave)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <div ref={wrapRef} className={`absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  )
}
