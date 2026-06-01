'use client'

import Link from 'next/link'
import { LogOut, User, Settings, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from './UserAvatar'
import { signOut } from 'next-auth/react'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative flex h-auto items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 transition-colors duration-300 hover:bg-white/[0.045] focus-visible:ring-amethyst/35"
        >
          <UserAvatar name={user.name} image={user.image} />
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-starlight/90 sm:block">
            {user.name ?? 'Usuário'}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-56 rounded-2xl border-white/[0.07] bg-[#0C0F15]/95 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.055),0_14px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-3 py-2.5 rounded-xl">
          <div className="flex flex-col gap-0.5">
            <p className="truncate text-sm font-medium text-starlight">
              {user.name ?? 'Usuário'}
            </p>
            {user.email && <p className="truncate text-xs text-starlight/40">{user.email}</p>}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/[0.06] mx-2" />

        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-xl px-3 py-2.5 text-starlight/70 transition-colors duration-200 hover:text-starlight focus:bg-white/[0.06] focus:text-starlight"
        >
          <Link href="/home">
            <LayoutDashboard className="mr-2.5 h-4 w-4 text-starlight/45" />
            Plataforma
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-xl px-3 py-2.5 text-starlight/70 transition-colors duration-200 hover:text-starlight focus:bg-white/[0.06] focus:text-starlight"
        >
          <Link href="/home">
            <Settings className="mr-2.5 h-4 w-4 text-starlight/45" />
            Configurações
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-xl px-3 py-2.5 text-starlight/70 transition-colors duration-200 hover:text-starlight focus:bg-white/[0.06] focus:text-starlight"
        >
          <Link href="/home">
            <User className="mr-2.5 h-4 w-4 text-starlight/45" />
            Perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06] mx-2" />

        <DropdownMenuItem
          className="rounded-xl px-3 py-2.5 cursor-pointer text-red-400/80 hover:text-red-400 focus:text-red-400 focus:bg-red-500/[0.06] transition-colors duration-200"
          onSelect={async () => {
            await signOut({ callbackUrl: '/' })
          }}
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
