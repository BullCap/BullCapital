'use client'

import { Settings, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu da conta"
          className="rounded-full border border-white/10 bg-white/[0.05] p-1.5 text-[#F4F0FF]/70 transition hover:bg-white/[0.09] hover:text-[#F4F0FF]"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-[#8B5CF6]/20 text-[#F4F0FF]">
              <User size={16} />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings />
          <span>Configurações da conta</span>
          <span className="ml-auto text-[10px] uppercase text-[#F4F0FF]/40">Em breve</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
