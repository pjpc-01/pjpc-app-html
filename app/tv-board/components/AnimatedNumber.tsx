"use client"

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
}

export default function AnimatedNumber({ value, className = '', duration = 0.8 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) => Math.round(current))

  useEffect(() => {
    spring.set(value)
    setDisplayValue(value)
  }, [value, spring])

  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.2, 1],
        textShadow: [
          '0 0 0px currentColor',
          '0 0 20px currentColor',
          '0 0 0px currentColor'
        ]
      }}
      transition={{
        duration: duration,
        ease: "easeOut"
      }}
    >
      {display}
    </motion.div>
  )
}
