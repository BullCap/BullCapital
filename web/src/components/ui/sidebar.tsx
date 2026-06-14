'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

type SidebarState = 'expanded' | 'collapsed'

interface SidebarProps extends React.ComponentProps<'aside'> {
  state?: SidebarState
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, state = 'expanded', ...props }, ref) => (
    <aside
      ref={ref}
      data-state={state}
      className={cn(
        'relative hidden h-screen shrink-0 flex-col overflow-visible border-r border-white/[0.055] bg-[var(--surface)] text-[#F4F0FF] lg:sticky lg:top-0 lg:z-40 lg:flex',
        'data-[state=collapsed]:w-14 data-[state=expanded]:w-64',
        className
      )}
      {...props}
    />
  )
)
Sidebar.displayName = 'Sidebar'

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<'header'>>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn('flex h-14 shrink-0 items-center gap-2.5 px-3', className)}
      {...props}
    />
  )
)
SidebarHeader.displayName = 'SidebarHeader'

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-h-0 flex-1 flex-col', className)} {...props} />
  )
)
SidebarContent.displayName = 'SidebarContent'

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<'footer'>>(
  ({ className, ...props }, ref) => (
    <footer ref={ref} className={cn('shrink-0 p-2.5', className)} {...props} />
  )
)
SidebarFooter.displayName = 'SidebarFooter'

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 px-2.5 py-3', className)} {...props} />
  )
)
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F4F0FF]/42',
        className
      )}
      {...props}
    />
  )
)
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  )
)
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('group/sidebar-item relative', className)} {...props} />
  )
)
SidebarMenuItem.displayName = 'SidebarMenuItem'

const sidebarMenuButtonVariants = cva(
  'relative flex items-center overflow-hidden rounded-lg border border-transparent text-[13px] font-medium text-[#F4F0FF]/54 outline-none transition-colors duration-200 hover:bg-white/[0.045] hover:text-[#F4F0FF]/82 focus-visible:ring-2 focus-visible:ring-amethyst/25 data-[active=true]:bg-white/[0.08] data-[active=true]:text-[#F4F0FF] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      size: {
        default: 'h-8 w-full gap-2.5 px-2.5 [&_svg]:size-4',
        sm: 'min-h-8 w-full gap-2 px-2.5 py-1.5 text-xs [&_svg]:size-3.5',
        icon: 'size-8 justify-center p-0 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

interface SidebarMenuButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
  isActive?: boolean
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ asChild = false, className, isActive, size, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ size, className }))}
        {...props}
      />
    )
  }
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

const SidebarTooltip = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none absolute left-10 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/[0.08] bg-[var(--surface)] px-2 py-1.5 text-xs text-[#F4F0FF] opacity-0 shadow-xl transition-opacity duration-200 group-hover/sidebar-item:opacity-100',
        className
      )}
      {...props}
    />
  )
)
SidebarTooltip.displayName = 'SidebarTooltip'

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTooltip,
}
