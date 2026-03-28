"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Sparkles, Star } from "lucide-react"

const particles = [
  { x: -96, y: -72, rotate: -18, delay: 0 },
  { x: -42, y: -102, rotate: 12, delay: 0.04 },
  { x: 18, y: -112, rotate: -10, delay: 0.08 },
  { x: 84, y: -78, rotate: 16, delay: 0.12 },
  { x: 106, y: -18, rotate: -8, delay: 0.16 },
  { x: 82, y: 42, rotate: 18, delay: 0.2 },
  { x: 22, y: 86, rotate: -12, delay: 0.24 },
  { x: -52, y: 78, rotate: 10, delay: 0.28 },
  { x: -102, y: 28, rotate: -14, delay: 0.32 },
]

export function SuccessBurst({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="success-burst"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {particles.map((particle, index) => {
            const Icon = index % 2 === 0 ? Star : Sparkles

            return (
              <motion.div
                key={`${particle.x}-${particle.y}`}
                initial={{ opacity: 0, scale: 0.3, x: 0, y: 0, rotate: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1, 0.95, 0.7], x: particle.x, y: particle.y, rotate: particle.rotate }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.95, delay: particle.delay, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -ml-3 -mt-3 text-[#ffb347]"
              >
                <Icon className="h-6 w-6 drop-shadow-[0_6px_14px_rgba(255,179,71,0.35)]" />
              </motion.div>
            )
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
