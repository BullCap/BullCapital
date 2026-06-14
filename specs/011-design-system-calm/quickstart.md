# Quickstart — Construindo uma página no Design System Calm

Receita para qualquer página autenticada nova (ou migração de existente).

## 1. Shell e largura

```tsx
// app/exemplo/page.tsx
<AppShell active="clients" width="wide">   {/* 'focus' para formulários/fluxos */}
  ...
</AppShell>
```

Nunca passe largura custom. Se nenhum preset serve, a discussão é no design system, não na página.

## 2. Cabeçalho

```tsx
<PageHeader
  title={client.name}
  eyebrow="Ficha consolidada"            // o ÚNICO eyebrow da página
  meta={<StalenessChip ageDays={6} stale={false} />}
  actions={<Button>Reimportar carteira</Button>}
/>
```

## 3. Blocos no grid

```tsx
<PanelGrid>
  <Panel className="md:col-span-8" title="Como a carteira está distribuída"
         hint="Percentuais sobre o valor bruto do snapshot mais recente."
         actions={<Tabs ... />}>
    <BarList data={composition} valueFormatter={brl} />
  </Panel>
  <Panel className="md:col-span-4" title="Exposição por instituição"
         hint="Limite FGC de R$ 250.000 por CPF e instituição.">
    {institutions.map(i => <Tracker key={i.id} {...i} />)}
  </Panel>
</PanelGrid>
```

Regras que a API já força, mas vale internalizar:
- **2 níveis de texto por painel**: `title` + conteúdo. Metodologia → `hint`. Sem subtítulos.
- **Espaçamento**: não defina gaps de bloco; `PanelGrid`/`AppShell` já dão `gap-6`.
- **Tipografia**: só passos da escala (`text-2xs`…`text-display`). `text-[Npx]` é proibido.
- **Cor**: só tokens (`text-ink-muted`, `border-hairline`, `text-positive`...). Hex é proibido.
- **Raio**: `rounded-control` | `rounded-panel` | `rounded-full`. Nada arbitrário.

## 4. Estados

```tsx
<Panel title="..." empty={{ label: 'Nenhuma posição importada.', action: <Button .../> }}>
{loading ? <Skeleton className="h-40" /> : <BarList ... />}
```

## 5. Checklist de DoD da página (constitution + spec)

- [ ] 390px: 1 coluna, dock visível, alvos ≥ 44px
- [ ] Estados loading/empty/error presentes
- [ ] pt-BR em toda copy; zero texto metodológico fixo (tudo em `hint`)
- [ ] Zero classes `bull-*`, zero `text-[Npx]`, zero hex, zero `rounded-[*]`
- [ ] `pnpm type-check && pnpm lint && pnpm test` verdes
