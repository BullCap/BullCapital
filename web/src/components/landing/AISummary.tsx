'use client'

import React from 'react'
import { motion } from 'motion/react'

interface AISummaryProps {
  text?: string
  label?: string
}

export default function AISummary({
  text = 'Dados de mercado indisponíveis no momento.',
  label = 'Leitura do mercado',
}: AISummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20%' }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="bull-frame flex w-full flex-col gap-4 p-6 md:p-7"
    >
      <p className="bull-eyebrow">{label}</p>
      <p className="max-w-4xl font-serif text-xl font-medium leading-relaxed text-starlight/82 md:text-2xl">
        {text}
      </p>
      <p className="text-xs leading-5 text-starlight/38">
        Análise contextual e educacional. Não constitui recomendação de investimento.
      </p>
    </motion.div>
  )
}
export { AISummary }
