import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  image?: string | null
  className?: string
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  return (
    <Avatar
      className={cn(
        'h-8 w-8 border border-white/10 shadow-[0_0_8px_rgba(139,92,246,0.15)] transition-all duration-300 hover:shadow-[0_0_16px_rgba(139,92,246,0.3)] hover:border-[#8B5CF6]/30',
        className
      )}
    >
      {image && <AvatarImage src={image} alt={name ?? 'User avatar'} />}
      <AvatarFallback className="bg-[#8B5CF6]/15 text-[#8B5CF6] text-xs font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
