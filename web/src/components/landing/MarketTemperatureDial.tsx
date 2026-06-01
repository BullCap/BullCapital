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
          <linearGradient id="temperatureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7FB59A" />
            <stop offset="100%" stopColor="#C98C9A" />
          </linearGradient>
        </defs>

        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(226,222,240,0.08)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="url(#temperatureGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />

        <g
          style={{
            transform: `rotate(${180 * (value / 100)}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <polygon
            points={`${cx},${cy - 4} ${cx},${cy + 4} ${cx - radius + 8},${cy}`}
            fill="#e2def0"
          />
          <circle cx={cx} cy={cy} r="5" fill="#0C0F15" stroke="#e2def0" strokeWidth="2" />
        </g>
      </svg>

      <div className="mt-3 flex flex-col items-center text-center">
        <span className="font-sans text-3xl font-medium leading-none tracking-tight text-starlight">
          {value}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-starlight/52">
          {stateName}
        </span>
      </div>
    </div>
  )
}
export default MarketTemperatureDial
