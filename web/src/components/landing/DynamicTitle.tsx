'use client'

import React from 'react'
import { motion, LayoutGroup } from 'motion/react'
import RotatingText from './RotatingText'

export default function DynamicTitle() {
  return (
    <LayoutGroup>
      <motion.h1
        layout
        className="z-10 flex flex-col font-serif text-5xl font-medium leading-[1.03] tracking-tight text-starlight sm:text-6xl md:text-7xl xl:text-[5.75rem]"
      >
        <motion.span layout>A sala de leitura</motion.span>
        <motion.span layout className="mt-2 flex flex-wrap items-center sm:mt-3">
          <motion.span layout className="mr-3 text-starlight/62">
            para
          </motion.span>
          <RotatingText
            texts={['briefings', 'terminais', 'teses', 'copilotos']}
            mainClassName="text-starlight font-medium"
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
        <motion.span layout className="mt-2 text-starlight/62">
          de mercado.
        </motion.span>
      </motion.h1>
    </LayoutGroup>
  )
}
