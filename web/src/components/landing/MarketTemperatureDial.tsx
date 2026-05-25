'use client'

import React from 'react'

interface MarketTemperatureDialProps {
  value: number
  stateName: string
}

export function MarketTemperatureDial({ value, stateName }: MarketTemperatureDialProps) {
  const radius = 65
  const cx = 80
  const cy = 75
  const circumference = Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="160" height="85" viewBox="0 0 160 85" className="overflow-visible">
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track Background */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Value Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="url(#neonGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
        />

        {/* Needle / Indicator */}
        <g
          style={{
            transform: `rotate(${180 * (value / 100)}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <polygon
            points={`${cx},${cy - 4} ${cx},${cy + 4} ${cx - radius + 8},${cy}`}
            fill="#F4F0FF"
            className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
          />
          <circle cx={cx} cy={cy} r="5" fill="#1A1625" stroke="#F4F0FF" strokeWidth="2" />
        </g>
      </svg>

      <div className="mt-3 flex flex-col items-center text-center">
        <span className="font-sans text-3xl font-medium leading-none tracking-tight text-[#F4F0FF]">
          {value}
        </span>
        <span className="mt-1 font-serif text-[11px] uppercase tracking-widest text-[#F4F0FF]/60">
          {stateName}
        </span>
      </div>
    </div>
  )
}
export default MarketTemperatureDial
