'use client'

import { NavLink } from './NavLink'

const navItems = [
  { href: '#', label: 'Início' },
  { href: '#visao-geral', label: 'Mercado' },
  { href: '#destaques', label: 'Destaques' },
]

export function HeaderNav() {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {navItems.map((item) => (
        <NavLink key={item.label} href={item.href}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
