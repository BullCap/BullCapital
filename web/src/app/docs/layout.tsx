import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      // Dark-only design system ("The Financial Reading Room") — o toggle de
      // tema é removido para nao conflitar com o `.dark` forcado no root layout.
      themeSwitch={{ enabled: false }}
      sidebar={{ collapsible: true }}
      nav={{
        url: '/docs',
        title: (
          <span className="flex items-center gap-2 text-lg font-bold text-(--starlight)">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-amethyst/30 bg-amethyst/15 text-[11px] font-bold text-amethyst-light">
              BC
            </span>
            <span>BullCapital Docs</span>
          </span>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
