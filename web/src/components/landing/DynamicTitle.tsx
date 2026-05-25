'use client'

import React from 'react'
import { motion, LayoutGroup } from 'motion/react'
import RotatingText from './RotatingText'

export default function DynamicTitle() {
  return (
    <LayoutGroup>
      <motion.h1
        layout
        className="z-10 flex flex-col items-center justify-center px-4 text-center font-serif text-4xl leading-snug tracking-tight text-[#F4F0FF] sm:text-5xl md:text-6xl lg:text-7xl"
      >
        <motion.span layout>Inteligência Brapi PRO</motion.span>
        <motion.span layout className="mt-2 flex flex-wrap items-center justify-center sm:mt-4">
          <motion.span layout className="mr-2 sm:mr-4">
            para explicar
          </motion.span>
          <RotatingText
            texts={['fundamentos', 'OHLCV', 'FIIs', 'macro']}
            mainClassName="text-[#8B5CF6] drop-shadow-[0_0_15px_rgba(139,92,246,0.6)] font-medium"
            staggerFrom={'first'}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-120%' }}
            staggerDuration={0.03}
            splitLevelClassName="overflow-hidden"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            rotationInterval={3000}
            animatePresenceMode="wait"
          />
        </motion.span>
      </motion.h1>
    </LayoutGroup>
  )
}
