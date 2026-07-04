import { useEffect, useRef } from 'react'

const random = (min: number, max: number) => Math.random() * (max - min) + min

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  alpha: number
  rotation: number
  rotationSpeed: number
}

const COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#FFD700']

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Spawn particles
    particlesRef.current = Array.from({ length: 150 }, () => ({
      x: random(0, canvas.width),
      y: random(-100, 0),
      vx: random(-3, 3),
      vy: random(3, 8),
      color: COLORS[Math.floor(random(0, COLORS.length))],
      size: random(6, 12),
      alpha: 1,
      rotation: random(0, Math.PI * 2),
      rotationSpeed: random(-0.1, 0.1),
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15 // gravity
        p.vx *= 0.99
        p.rotation += p.rotationSpeed
        if (p.y > canvas.height * 0.7) p.alpha -= 0.02

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[95]"
    />
  )
}
