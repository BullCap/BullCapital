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
        'h-8 w-8 border border-white/[0.08] transition-colors duration-300 hover:border-white/[0.14]',
        className
      )}
    >
      {image && <AvatarImage src={image} alt={name ?? 'User avatar'} />}
      <AvatarFallback className="bg-white/[0.055] text-xs font-medium text-starlight">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
