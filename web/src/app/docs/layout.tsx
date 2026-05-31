import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      // Dark-only design system ("The Financial Reading Room") — o toggle de
      // tema e removido para nao conflitar com o `.dark` forcado no root layout.
      themeSwitch={{ enabled: false }}
      githubUrl="https://github.com/bullcapital"
      // Navegacao horizontal no topo (mold Horus): leva as landings de cada sistema.
      links={[
        { type: 'main', text: 'Produto', url: '/docs/produto' },
        { type: 'main', text: 'Arquitetura', url: '/docs/arquitetura' },
        { type: 'main', text: 'Frontend', url: '/docs/frontend' },
        { type: 'main', text: 'Backend', url: '/docs/backend' },
        { type: 'main', text: 'Design System', url: '/docs/design-system' },
        { type: 'main', text: 'Guias', url: '/docs/guias/setup' },
      ]}
      sidebar={{
        collapsible: true,
        // Card-banner no topo da sidebar, ao estilo "RUNTIME DOCS" do Horus.
        banner: (
          <Link
            href="/docs"
            className="bull-panel-quiet group flex flex-col gap-3 rounded-xl! p-4 no-underline"
          >
            <span className="bull-eyebrow">Docs Bull</span>
            <span className="flex items-center gap-2.5 text-sm font-semibold text-(--starlight)">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amethyst/30 bg-amethyst/10 text-amethyst-light transition-transform group-hover:scale-105">
                <BookOpen className="h-4 w-4" />
              </span>
              Documentação
            </span>
          </Link>
        ),
      }}
      nav={{
        url: '/docs',
        title: (
          <span className="flex items-center gap-2 text-lg font-bold text-(--starlight)">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-amethyst/30 bg-amethyst/15 text-[11px] font-bold text-amethyst-light">
              BC
            </span>
            <span>
              BullCapital <span className="text-amethyst-light">Docs</span>
            </span>
          </span>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
