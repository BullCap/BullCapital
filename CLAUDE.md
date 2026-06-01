# CLAUDE.md — Operação do Claude Code na Bull

> **Fonte primária de contexto**: [AGENTS.md](AGENTS.md). Este arquivo complementa o AGENTS.md com **operação específica do Claude Code** (slash commands, modo de comunicação, uso de ferramentas, memória). Leia AGENTS.md primeiro; depois leia este arquivo.

---

## 1. Como começar uma sessão neste repo

Quando uma sessão de Claude Code começa, faça (em ordem):

1. Verifique [AGENTS.md](AGENTS.md) §1 e §13 — TL;DR + sprint ativo do MVP.
2. Cheque `git status` e `git log -5` para entender o estado.
3. Leia a `spec.md` da feature da branch atual se houver (`specs/<id>-<nome>/spec.md`).
4. Só então proponha mudanças.

Se a tarefa do usuário não cabe em nenhum sprint ativo do roadmap ([AGENTS.md §13](AGENTS.md)), **pare e confirme** o escopo antes de codar.

---

## 2. Idioma da comunicação

- **Com o usuário (chat)**: português brasileiro, sempre. O dono do repo é brasileiro e escreve em pt-BR.
- **Em código (variáveis, funções, comentários internos)**: inglês.
- **Em UI voltada ao usuário final**: pt-BR exclusivo, sem exceções.
- **Em commit messages, PR titles, spec.md**: pt-BR ou inglês consistente dentro do PR (preferência: pt-BR).
- **Em logs, erros técnicos, nomes de arquivos**: inglês.

---

## 3. Tom e formato de resposta

- **Conciso por padrão.** O usuário lê o diff; não recite o que mudou.
- **Sem narrativa de pensamento.** Não escreva "Vou agora ler o arquivo X para entender Y" — apenas leia.
- **Atualizações curtas durante trabalho longo** (1 linha): quando descobrir algo relevante, quando mudar direção, quando travar.
- **Resumo final**: 1-2 sentenças. O que mudou + o que falta.
- **Sem emojis**, exceto se o usuário pedir.
- **Sem títulos genéricos** ("Resumo", "Conclusão") em respostas curtas.
- **Refs clicáveis**: use `[arquivo.tsx:42](web/src/.../arquivo.tsx#L42)` para o VSCode abrir o trecho.

---

## 4. Ferramentas — quando usar cada uma

| Situação | Ferramenta |
|---|---|
| Achar arquivo por nome/padrão | `Bash` com `find` ou `Glob` |
| Buscar string/símbolo no código | `Bash` com `grep -r` ou `Grep` |
| Exploração ampla (>3 buscas, vários ângulos) | `Agent` com `subagent_type=Explore` |
| Ler arquivo conhecido | `Read` (não `cat`) |
| Editar arquivo | `Edit` (preserve indentação) |
| Criar arquivo novo | `Write` (raro — prefira editar) |
| Múltiplas tarefas (>3 passos) | `TodoWrite` para rastrear |
| Planejar mudança grande | Plan mode (`ExitPlanMode` ao confirmar) |

**Paralelize tool calls** sempre que não houver dependência. Múltiplas leituras de arquivos diferentes = um único turno com várias `Read` simultâneas.

---

## 5. Slash commands ativos neste repo

O repo usa **Spec Kit**. Os comandos abaixo aparecem no Claude Code:

| Comando | Quando usar |
|---|---|
| `/speckit-specify` | Criar/atualizar `spec.md` de uma feature nova |
| `/speckit-clarify` | Perguntar ao usuário até 5 dúvidas para fechar lacunas do spec |
| `/speckit-plan` | Gerar `plan.md` com decisões técnicas |
| `/speckit-tasks` | Gerar `tasks.md` dependency-ordered |
| `/speckit-analyze` | Auditar consistência spec/plan/tasks |
| `/speckit-implement` | Executar as tasks da feature |
| `/speckit-checklist` | Checklist customizado para a feature |
| `/speckit-git-feature` | Criar branch numerada `008-...` |
| `/speckit-git-commit` | Auto-commit após comando spec terminar |

**Fluxo padrão para feature nova do roadmap** ([AGENTS.md §13](AGENTS.md)):

```
/speckit-git-feature 008-comparador
/speckit-specify "comparador top-level de 2-4 ativos com narrativa IA pt-BR"
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-analyze
/speckit-implement
```

---

## 6. Plan mode

Use plan mode para mudanças que afetam >3 arquivos ou introduzem decisão arquitetural. Saia com `ExitPlanMode` apenas depois do usuário confirmar o plano. Não use plan mode para edição trivial.

---

## 7. TodoWrite

Use `TodoWrite` quando a tarefa tem ≥3 passos não-triviais. Mantenha **um único item `in_progress`** por vez. Marque `completed` imediatamente ao terminar (não em batch).

**Não use** para tarefas de 1-2 passos triviais — vira ruído.

---

## 8. Commits e PRs

Conforme [AGENTS.md §9.4 e §9.5](AGENTS.md):

- Conventional commits (`feat:`, `fix:`, `style:`, `perf:`, `refactor:`, `docs:`, `chore:`)
- Não pular hooks (`--no-verify` proibido)
- Não usar `git add -A` em massa — adicione arquivos específicos
- Não amendar commits pushed
- Não commitar `.env*`
- **Nunca commitar `OpenFinancePortfolio.tsx`** — está no `.gitignore` propositalmente, mantido só localmente (ver [AGENTS.md §13.2](AGENTS.md))

Para commits, **só commite quando o usuário pedir**. Não seja proativo. Se em dúvida, pergunte.

---

## 9. Memória persistente

A memória do Claude Code está em `/home/joaoh/.claude/projects/-home-joaoh-Documents-Projetos-BullCapital/memory/`.

Salve memória sobre:
- Preferências do usuário (estilo de trabalho, decisões recorrentes)
- Feedback explícito ("não faça X", "sempre faça Y")
- Contexto de iniciativas que não está no código (datas, stakeholders, motivos de pivô)

**NÃO salve** em memória o que já está documentado:
- Estado do código ou rotas → AGENTS.md §6
- Roadmap → AGENTS.md §13
- Design system → system-design.md
- Convenções → AGENTS.md §9

---

## 10. Cuidado com ações destrutivas

**Sempre confirme antes de**:
- `git reset --hard`, `git push --force`, `git checkout -- .`
- Apagar arquivos não-versionados (especialmente `OpenFinancePortfolio.tsx`)
- Rodar migration que dropa coluna/tabela
- Mexer em settings do Vercel/Railway
- Postar em PR/issue do GitHub

**Pode fazer sem perguntar**:
- Edit em arquivos locais
- Rodar testes, lint, type-check
- `git status`, `git diff`, `git log`, `git stash`
- `pnpm dev`, `pnpm test`

---

## 11. UI e screenshots

Quando o usuário pedir para verificar uma mudança de UI:

1. Rode `pnpm dev` em background.
2. Use o skill `verify` ou `run` se disponível para abrir browser.
3. **Não afirme que funcionou sem testar** — se não puder testar (sem browser disponível), diga explicitamente "não verifiquei visualmente".
4. Teste **golden path + edge cases** + mobile (PWA é Android-first).

---

## 12. Quando o usuário escreve em pt-BR ambíguo

Faça **uma pergunta clarificadora** se a tarefa for grande (>4 arquivos) ou se houver pivô de produto. Use `AskUserQuestion` quando há 2-4 opções discretas.

Não pergunte por trivialidades. "Onde colocar este componente?" se a resposta está em AGENTS.md §6 — apenas siga.

---

## 13. Verificação cruzada de claims

Antes de afirmar que uma feature/função/flag **existe**:
- Se for um path: `Read` ou `ls`.
- Se for um símbolo: `grep` ou `Glob`.

Memória pode estar defasada. Código atual sempre vence.

---

## 14. Convenções específicas da Bull para Claude

Estas são preferências expressas que vão além do AGENTS.md:

- **Quando criar componente novo**: copie a anatomia de um componente similar existente (§6 do AGENTS.md). Não invente nova estrutura.
- **Quando renomear**: prefira deixar consistente com o resto do código mesmo que o nome novo seja "melhor".
- **Quando achar código duplicado**: aponte mas não refatore sem pedir.
- **Quando achar bug fora do escopo da tarefa**: aponte em uma linha. Não conserte sem perguntar.
- **Quando o design do system-design.md parecer pesado para a feature**: ainda assim siga. A consistência visual é parte do produto.

---

## 15. Pós-pivô (24-mai-2026): o que mudou para o Claude

O produto pivotou para B2B (CFP + influencer financeiro) em 24/mai/2026 ([AGENTS.md §2](AGENTS.md)). Isso significa:

- **Persona muda copy.** Se você ver texto antigo falando com "investidor", "seu dinheiro", "rumo aos objetivos" — é candidato a reescrita.
- **Algumas telas serão arquivadas** (DividendCalculator, SavingsSimulator). Não as estenda; não as use de exemplo.
- **OpenFinancePortfolio.tsx está no `.gitignore`** (mantido só localmente) — não é bug, é decisão. Não comite.
- **3 features novas no MVP** (comparador, briefing email, exportação PDF) — sprint atual em [AGENTS.md §13](AGENTS.md).

Se o usuário pedir feature que **claramente é para a persona antiga** (ex: "calculadora de aposentadoria"), **pergunte se ainda faz sentido pós-pivô** antes de codar.

---

## Referência rápida

| Quero... | Vá para |
|---|---|
| Entender o produto | [AGENTS.md §1-3](AGENTS.md) |
| Entender a stack | [AGENTS.md §4-5](AGENTS.md) |
| Achar um componente existente | [AGENTS.md §6](AGENTS.md) |
| Detalhes de design | [system-design.md](system-design.md) |
| Saber o que codar agora | [AGENTS.md §13](AGENTS.md) |
| Saber o que NÃO codar | [AGENTS.md §14](AGENTS.md) |
| Operação do Claude Code | este arquivo |
