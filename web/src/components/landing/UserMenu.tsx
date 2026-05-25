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
          className="relative flex items-center gap-2.5 rounded-2xl px-2 py-1.5 h-auto border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 focus-visible:ring-[#8B5CF6]/40"
        >
          <UserAvatar name={user.name} image={user.image} />
          <span className="hidden sm:block text-sm font-medium text-[#F4F0FF]/90 max-w-[120px] truncate">
            {user.name ?? 'Usuário'}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-56 rounded-2xl border-white/10 bg-[#1A1625]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] p-1.5"
      >
        {/* User info label */}
        <DropdownMenuLabel className="px-3 py-2.5 rounded-xl">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-[#F4F0FF] truncate">
              {user.name ?? 'Usuário'}
            </p>
            {user.email && <p className="text-xs text-[#F4F0FF]/40 truncate">{user.email}</p>}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/[0.06] mx-2" />

        {/* Menu items */}
        <DropdownMenuItem
          asChild
          className="rounded-xl px-3 py-2.5 cursor-pointer text-[#F4F0FF]/70 hover:text-[#F4F0FF] focus:text-[#F4F0FF] focus:bg-white/[0.06] transition-colors duration-200"
        >
          <Link href="/home">
            <LayoutDashboard className="mr-2.5 h-4 w-4 text-[#8B5CF6]/60" />
            Plataforma
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="rounded-xl px-3 py-2.5 cursor-pointer text-[#F4F0FF]/70 hover:text-[#F4F0FF] focus:text-[#F4F0FF] focus:bg-white/[0.06] transition-colors duration-200"
        >
          <Link href="/home">
            <Settings className="mr-2.5 h-4 w-4 text-[#8B5CF6]/60" />
            Configurações
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="rounded-xl px-3 py-2.5 cursor-pointer text-[#F4F0FF]/70 hover:text-[#F4F0FF] focus:text-[#F4F0FF] focus:bg-white/[0.06] transition-colors duration-200"
        >
          <Link href="/home">
            <User className="mr-2.5 h-4 w-4 text-[#8B5CF6]/60" />
            Perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06] mx-2" />

        {/* Sign out */}
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
