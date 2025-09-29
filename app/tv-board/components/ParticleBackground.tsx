"use client"

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  speed: number
  direction: number
}

export default function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#0080ff', '#8000ff']
    const newParticles: Particle[] = []
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 0.5 + 0.1,
        direction: Math.random() * Math.PI * 2
      })
    }
    
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
          }}
          animate={{
            x: [0, Math.cos(particle.direction) * 100],
            y: [0, Math.sin(particle.direction) * 100],
            opacity: [0.6, 0.2, 0.6]
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
      
      {/* 霓虹线条 */}
      <motion.div
        className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
        animate={{
          x: ['-100%', '100%'],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-60"
        animate={{
          x: ['100%', '-100%'],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </div>
  )
}
