'use client'

import React from 'react'
import { motion } from 'motion/react'

interface AISummaryProps {
  text?: string
}

export default function AISummary({
  text = 'Ibovespa demonstra resiliência em meio à volatilidade global, sustentado por papéis de commodities, enquanto o mercado aguarda ansiosamente pelas próximas decisões do FED.',
}: AISummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20%' }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="flex w-full flex-col items-center gap-4 text-center"
    >
      <div className="flex items-center gap-2 opacity-50">
        <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#8B5CF6]" />
        <span className="font-sans text-[10px] font-medium uppercase tracking-[0.3em] text-[#8B5CF6]">
          IA Insight
        </span>
        <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#8B5CF6]" />
      </div>
      <p className="max-w-2xl font-serif text-lg italic leading-relaxed text-[#F4F0FF]/90 transition-colors duration-700 hover:text-[#F4F0FF] md:text-xl">
        &quot;{text}&quot;
      </p>
    </motion.div>
  )
}
export { AISummary }
