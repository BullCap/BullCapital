# Bull — Arquitetura-alvo (pós-pivô de gestão de carteira)

> ⚠️ **ARQUIVADO em 2026-06-09 — substituído por [../migracao-arquitetura.md](../migracao-arquitetura.md).**
> A direção de gestão de carteira (brigada de 5 agentes · Guardião · import de Excel) **não é mais o
> produto**. O produto retornou a **inteligência de mercado** (Assets · contexto · narrativa de IA) com
> separação limpa de deployables. Mantido apenas como histórico. Não usar como referência de build.

> **Status**: proposta / target-state. **Não** é o que existe hoje (hoje é um monolito monorepo de
> munição-de-narrativa). Este documento é o destino a construir, com o corte de MVP travado em §11.
> **Pivô em 2026-06-03**: após validação de mercado, o produto migra de "munição de research/narrativa
> para CFP/influencer" para **decision-support de advisor-augmentation para firma de wealth/corretora
> (tipo XP)**. Comp honesto: **Bridgewise** da B3 (métricas determinísticas + narração por LLM).
> **Não** é recomendador autônomo; **não** é sistema de execução.

**Princípio central:** *números são determinísticos e verificáveis; a linguagem é gerada; a fronteira
entre os dois é enforçada em código, fail-closed.*

---

## 0. Premissas (corrija quando divergir)

Explícitas de propósito — neste domínio, premissa não-dita é defeito latente.

- **A1.** Um consultor registrado na CVM é o **originador** de toda recomendação. O sistema re-expressa,
  documenta e operacionaliza decisões que um humano registrado toma/aprova. O sistema **nunca origina
  recomendação personalizada**.
- **A2.** Carteiras vêm do banco/firma (prontas) e são importadas. Formato de import no MVP = **Excel simples**.
- **A3.** O dado importado carrega PII (CPF, tamanho de posição, patrimônio) → **LGPD-material desde o dia 1**.
- **A4.** É decision *support*: nenhum dinheiro transita pelo sistema. Meta de disponibilidade é
  "degradar para velho-mas-rotulado", não cinco-noves. É corretamente um sistema **AP** (disponibilidade +
  tolerância a partição; sacrifica consistência forte, nunca silenciosamente).
- **A5.** Valor primário = **alavancagem do consultor** (clientes geridos por consultor), entregue
  principalmente pelo **caminho batch** (operações sobre o book inteiro), com um caminho interativo
  responsivo-mas-não-baixa-latência.
- **A6.** Dado de mercado vem **só de fontes contratadas/licenciadas**. Brapi PRO primária.
  **yfinance excluído** — scraper não-licenciado, indefensável em diligência. O eixo de failover é
  **staleness do último snapshot bom**, não uma fonte de menor confiança.

---

## 1. Desenho-mestre (camadas lógicas)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  CLIENTE — Next.js (Vercel) · app web do consultor                             │
│  Dois modos:                                                                   │
│    • Interativo: uma carteira por vez (ver, perguntar, rascunhar) — segundos OK│
│    • Batch: jobs sobre o book inteiro (relatórios, reavaliação, lista atenção) │
└───────────────────────────────────┬────────────────────────────────────────────┘
                                     │ HTTPS · sessão autenticada (§8)
                                     ▼
╔════════════════════════════════════════════════════════════════════════════════╗
║  CAMADA 1 — SERVING (FastAPI, stateless)                                         ║
║   • pedido de DADO       ─► lê resultado estruturado do store (rápido, sem LLM)  ║
║   • pedido de NARRATIVA  ─► enfileira job (interativo|batch) → Camada 2          ║
║   • upload de IMPORT     ─► entrega ao Import Pipeline (§6), devolve job id      ║
║   • Toda resposta carrega um PROVENANCE ENVELOPE (snapshot_id, fonte, ts,        ║
║     flag de staleness, tenant). Fail-closed: sem envelope → sem resposta.        ║
║   ┌────────────────────────────────────────────────────────────────────────┐   ║
║   │ REDIS — rate-limit · circuit-breaker de custo por-tenant · ponteiro do  │   ║
║   │         "último snapshot bom" · cache quente · chaves de idempotência   │   ║
║   └────────────────────────────────────────────────────────────────────────┘   ║
╚════════════════════════════════════════════╤═════════════════════════════════════╝
                                              ▼
╔════════════════════════════════════════════════════════════════════════════════╗
║  CAMADA 2 — BRIGADA DE AGENTES (fila durável + workers de LLM)                    ║
║  Abstração de job: idempotente, provenance + custo (USD) por job                 ║
║                    ┌──────────────────────────────────┐                          ║
║       job ───────► │  ORQUESTRADOR (Maître)           │  ativação seletiva       ║
║                    │  monta GROUNDING CONTEXT só de    │  (chama só os agentes    ║
║                    │  outputs determinísticos + RAG    │   necessários por job)   ║
║                    └──────────────────┬───────────────┘                          ║
║       ┌────────────┬───────────┬──────┴──────┬─────────────┐                     ║
║       ▼            ▼           ▼             ▼             ▼                       ║
║  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌──────────────────┐        ║
║  │1 MACRO  │ │2 FUNDA-  │ │3 NOTÍCIAS│ │4 COMPARA-│  │ 5 GUARDIÃO        │        ║
║  │ Selic,  │ │ MENTAL   │ │ "porquê  │ │ DOR      │  │ (§5)              │        ║
║  │ câmbio, │ │ P/L,ROE, │ │ do dia"  │ │ 2–4      │  │ GATE DETERMINÍS-  │        ║
║  │ índices │ │ valuation│ │ via RSS  │ │ ativos   │  │ TICO + checagem   │        ║
║  │         │ │          │ │ (§5 inj.)│ │          │  │ de atribuição     │        ║
║  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  └────────┬─────────┘        ║
║       └───────────┴──────┬─────┴───────────┘                  │                  ║
║                          ▼  rascunho de narrativa             │ valida           ║
║                   ┌──────────────┐ ◀──────────────────────────┘ TODO output      ║
║                   │ narrativa +  │   • figuras ⊆ resultado determinístico?        ║
║                   │ provenance   │   • formato-de-recomendação? → atribuída?      ║
║                   └──────┬───────┘   • grounded no contexto fornecido?            ║
║                          │            FAIL-CLOSED: gate falha → não serve         ║
║                          ▼                                                        ║
║                   volta ao Serving → cliente                                      ║
║   INVARIANTE: agentes só emitem figuras presentes no resultado determinístico.   ║
╚════════════════════════════════════════════════════════════════════════════════╝
╔════════════════════════════════════════════════════════════════════════════════╗
║  CAMADA 3 — COMPUTE CORE DETERMINÍSTICO  (lib pura, sem LLM, sem I/O de rede)     ║
║   Entradas: carteira validada + snapshot de mercado fixado → Saídas: figuras      ║
║   v0: alocação · exposição classe/setor · drift vs alvo · concentração            ║
║   v1+: Markowitz · CAPM · VaR · Black-Litterman                                   ║
║   100% testável em unidade, reproduzível, auditável. ISTO é "determinístico".     ║
║   NB: reproduzível ≠ não-controverso — VaR/BL carregam escolhas de metodologia.   ║
╚════════════════════════════════════════════════════════════════════════════════╝
╔════════════════════════════════════════════════════════════════════════════════╗
║  CAMADA 4 — PLANO DE DADOS                                                        ║
║  ┌────────────────┐                ┌─────────────────────┐                       ║
║  │ IMPORT PIPELINE│  upload Excel  │ INGESTÃO DE MERCADO  │ processo separado     ║
║  │ (§6)           │                │ Brapi PRO (licenciada)│ auto-reiniciável     ║
║  │ valida→        │                │ BCB · RSS            │ circuit-breaker       ║
║  │ reconcilia→    │                │ escreve SNAPSHOTS    │ cadência 2min/12h     ║
║  │ quarentena     │                │ ATÔMICOS (§7)        │                      ║
║  └───────┬────────┘                └──────────┬──────────┘                       ║
║          ▼ só validado                        ▼ flip de snapshot (1 txn)           ║
║  ┌────────────────────────────────────────────────────────────┐                 ║
║  │ POSTGRES PRIMARY                                             │                 ║
║  │  • carteiras (PII: criptografadas at-rest, escopo de tenant) │                 ║
║  │  • snapshots de mercado (imutáveis, snapshot_id monotônico)  │                 ║
║  │  • auth · pgvector (RAG, namespaced por-tenant — §5/§8)      │                 ║
║  └─────────────────────────┬────────────────────────────────────┘                ║
║                            ▼ replicação assíncrona                                ║
║  ┌────────────────────────────────────────────────────────────┐                 ║
║  │ READ REPLICA  ◀── serving + brigada leem aqui                │                 ║
║  │  Seguro sob lag: réplica está em N ou N−1, nunca misturado    │                 ║
║  └────────────────────────────────────────────────────────────┘                 ║
╚════════════════════════════════════════════════════════════════════════════════╝
╔════════════════════════════════════════════════════════════════════════════════╗
║  CAMADA 5 — LEDGER DE AUDITORIA E COMPLIANCE (append-only)                        ║
║   Por job/output: quem·quando·custo(USD)·tokens·snapshot_id·compute_version·      ║
║   veredito-do-guardião·staleness·fontes-RAG· O QUE O APROVADOR VIU ·identidade do ║
║   aprovador. É a base de evidência CVM/LGPD. Append-only, tamper-evident.         ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

**Analogia de leitura rápida** (a brigada de cozinha): garçons = Serving · maître = orquestrador ·
chefs = 5 especialistas · inspetor que prova todo prato = Guardião · estoque/repositor = ingestão ·
geladeira + geladeira-espelho = primary + read replica · câmeras/caderno = ledger.

---

## 2. As cinco camadas, em uma frase

| Camada | Papel | Componente |
|---|---|---|
| 1 — Serving | recebe pedido, enfileira ou lê cache | FastAPI stateless + Redis |
| 2 — Brigada de IA | orquestra agentes e gera narrativa gated | orquestrador + 5 agentes + fila/workers |
| 3 — Compute core | calcula as figuras (sem LLM) | lib pura, reproduzível |
| 4 — Plano de dados | importa carteira, ingere mercado, persiste | import pipeline + ingestão + primary/replica |
| 5 — Ledger | prova quem-viu-o-quê para CVM/LGPD | tabela append-only |

---

## 3. Os 5 especialistas

| # | Agente | Especialidade | Fonte do "ingrediente" |
|---|---|---|---|
| 1 | 📊 Macro | SELIC, IPCA, câmbio, IBOV, VIX | `bcb_sgs.py` + índices |
| 2 | 🔬 Fundamentalista | P/L, P/VP, ROE, DY, EV/EBITDA, valuation | quotes (`market_ingest.py`) |
| 3 | 📰 Notícias | o "porquê" do movimento do dia | `news_ingest.py` (RSS = superfície de injeção, §5) |
| 4 | ⚖️ Comparador | 2–4 ativos lado a lado | rota `comparator.py` |
| 5 | 🛡️ Guardião | enforça a fronteira de compliance (§5) | **código determinístico**, não LLM |

**Ativação variada:** o maître acorda só quem o job pede. "Quanto tá PETR4?" → ninguém (lê cache).
"Por que caiu?" → Notícias + Macro. "Compara X e Y" → Fundamentalista + Comparador. "Devo comprar?" →
Guardião intercepta na entrada. Isso é o controle de custo de IA do produto.

---

## 4. Compute core determinístico (Camada 3)

Lib pura, sem LLM e sem I/O de rede. Recebe **carteira validada + snapshot fixado**, devolve **figuras**.
É o lado "determinístico" da tese — 100% testável, reproduzível, auditável.

- **v0 (MVP):** alocação atual, exposição por classe/setor, drift vs alvo, concentração.
- **v1+:** Markowitz, CAPM, VaR, Black-Litterman.
- **Ressalva honesta:** reproduzível **≠** não-controverso. VaR (histórico/paramétrico/MC?), janela de
  covariância, construção do prior de BL são escolhas de metodologia que o time de risco da firma vai
  questionar. A versão do cálculo (`compute_version`) entra no ledger (§5) para reconstrução futura.

---

## 5. O Guardião — gate determinístico, não um segundo LLM

É **enforcement no caminho de serving**, não telemetria pós-fato. É **código determinístico** porque uma
garantia de compliance mostrada à CVM não pode repousar sobre um LLM se comportar probabilisticamente.

Roda em **todo** output antes de sair da Camada 2. Assere:

- **Containment de figuras:** todo número na narrativa ∈ resultado do compute core. Número que só existe
  no contexto RAG mas não no resultado → bloqueado (risco de fabricação).
- **Atribuição (CVM):** output em formato de recomendação deve ser atribuído a (a) consultor registrado
  que aprovou e (b) carteira de fonte. Recomendação não-atribuída → bloqueada. *(Postura A1:
  advisor-augmentation; o sistema nunca origina recomendação.)*
- **Grounding:** afirmações da narrativa rastreiam ao contexto fornecido (resultado + RAG do tenant).
- **Containment de prompt-injection (Agente 3 / notícias/RSS):** texto externo não-confiável é isolado do
  contexto da carteira; notícia recuperada não pode alterar figuras nem injetar instruções. O gate
  re-checa containment de figuras justamente porque o caminho de notícias é a superfície de injeção.

**Dois portões, não um:** *draft-gate* (containment + grounding, **antes** do humano) e *release-gate*
(aprovação registrada no ledger, **antes** do cliente final). O Guardião não pode validar uma aprovação
que ainda não aconteceu — são eventos sequenciais distintos.

Fail-closed: gate falha → output não é servido, evento logado na Camada 5.

---

## 6. Import Pipeline — o componente de maior severidade

Tudo a jusante é função da correção do import. Um misparse silencioso é a pior falha do sistema:
invisível, autoritativo, assinado por um consultor.

**Contrato (fail-closed):**

1. **Parse como string primeiro.** Nunca confie na inferência de tipo do Excel (ticker `1011`→int, CPF
   perde zero à esquerda, data→serial float).
2. **Números locale-safe.** Excel brasileiro: `1.234,56`. Parsing explícito de locale — se indeterminável,
   **rejeita**, nunca adivinha. (Este bug sozinho avalia uma carteira em 100× ou 1/100×, silenciosamente.)
3. **Validação estrita de schema.** Rejeita-não-coage na ambiguidade.
4. **Reconciliação.** Σ(quantidade × preço) deve bater com o total declarado dentro de tolerância → senão
   **quarentena**.
5. **Neutralização de injeção.** Células iniciando com `= + - @` neutralizadas em qualquer campo exibido
   ou re-exportado (CSV/formula injection).
6. **Estado de quarentena.** Nada não-validado é alimentado a um agente. Sem narração sobre dado
   não-validado, ponto.
7. **PII no ingest.** Criptografia at-rest, controle de acesso field-level, namespacing de tenant, política
   de retenção — enforçados aqui, não retrofitados.

**Open item (bloqueador):** schema real das colunas + se existe um total de carteira para reconciliar.
Necessário antes de construir — precisa de 1 Excel representativo (pode ser anonimizado) da firma-piloto.

---

## 7. Consistência de snapshot (invariante do plano de dados)

Métricas multi-ativo (VaR, Markowitz) leem muitos ativos juntos. Frescor por-linha **não** basta — uma
mistura de snapshot T e T−1 produz um número de risco silenciosamente errado e internamente inconsistente.

**Invariante:** todo dataset coerente de mercado recebe um `snapshot_id` monotônico. As escritas de
ingestão são **atômicas por snapshot** (escreve em staging, flipa ponteiro em uma transação). Toda
computação fixa exatamente um `snapshot_id`. O "último snapshot bom" no Redis é a fonte única de qual é o
corrente. O lag de réplica vira seguro: em N ou N−1, nunca misturado.

**Degradação — diferenciada por tipo de saída:**
- **Narrativa:** circuit-breaker aberto / fonte velha → serve last-good **com timestamp + flag de
  staleness no envelope**, e a narrativa é contratualmente obrigada a divulgar. Degrada visível, nunca
  silencioso.
- **Figura de risco que embasa recomendação:** se o snapshot exceder o limite de idade, **recusa-se a
  computar** em vez de computar-e-rotular. VaR sobre snapshot velho durante spike de volatilidade está
  mais errado exatamente quando é mais consequente.

---

## 8. Isolamento de tenant & LGPD (segunda maior severidade)

Books de clientes reais + múltiplos consultores = um vazamento cross-tenant é incidente LGPD reportável e
mata a confiança.

- **Namespacing por-tenant no pgvector.** Escopo de tenant enforçado numa camada que o código do agente
  não bypassa — **não** só filtragem por metadata em query-time (bug de filtro = vazamento silencioso).
  **Mecanismo a decidir explicitamente:** RLS do Postgres com role de sessão **vs** separação física
  (schema/tabela por tenant). Tem implicação de custo e de migração — não deixar como hand-wave.
- **Autorização row-level** nas carteiras; consultor vê só o próprio book.
- **PII criptografada at-rest**, controle de acesso field-level, política de retenção explícita.
- **Higiene de contexto de prompt:** orquestrador monta grounding context só do dado escopado do tenant
  requisitante; nenhum chunk cross-tenant entra num prompt.

---

## 9. Modelo de throughput (o valor real do produto)

Alavancagem do consultor = clientes-por-consultor, entregue tirando trabalho do caminho crítico dele.
Dois caminhos, SLAs diferentes:

- **Interativo:** uma carteira; narração em segundos serve. *Não super-otimizar para baixa latência.*
- **Batch:** jobs sobre o book inteiro (lista de atenção, relatórios em massa, reavaliar book vs nova
  Selic). **É onde o throughput mora** — jobs/hora sobre muitas carteiras; otimizar custo-por-job e tempo
  de conclusão. Justifica a fila durável + pool de workers idempotente.

**Anti-pattern a combater — o rubber-stamp.** Se a aprovação é um clique sobre prosa pronta, "humano
puxa o gatilho" é ficção e a defesa CVM colapsa. A UX de aprovação tem que tornar a revisão *significativa*
o caminho fácil: mostrar deltas/inputs/o-que-mudou-e-por-quê, e **logar o que o aprovador viu** (Camada 5),
não só o clique.

---

## 10. Controles de custo e falha

- **Circuit-breaker de custo por-tenant** (Redis): worker em crash-loop + retry = gasto ilimitado. Logar
  uma conta disparada ≠ preveni-la. Quebre o circuito.
- **Chaves de idempotência** em todo job: retries não podem duplicar chamadas de LLM nem duplicar
  artefatos.
- **Ingestão auto-reiniciável** com circuit-breaker na Brapi; falha → velho-mas-rotulado, nunca fabricado.

---

## 11. MVP v0 — recorte travado (2026-06-03)

Decisões travadas para o primeiro corte:

| Decisão | Escolha | Consequência |
|---|---|---|
| Tenancy | **Single-tenant (piloto 1 firma)** | criptografia at-rest + acesso restrito resolve o LGPD do piloto; RLS/pgvector namespacing → v1 |
| 1º marco | **Qualidade: 1 carteira ponta-a-ponta** | batch de book (throughput) vira v1 reusando o mesmo caminho |
| Compute core | **Mínimo defensável** | alocação · exposição · drift · concentração; Markowitz/VaR/BL → v1 |

**Slice vertical do v0:**

```
Excel (1 firma) → valida/reconcilia/quarentena → pin de snapshot
   → compute mínimo [alocação · exposição classe/setor · drift vs alvo · concentração]
   → orquestrador acorda só os agentes necessários → narrativa grounded
   → Guardião (containment determinístico) → consultor revê deltas → aprovação logada
```

**Inegociável no v0 (é a tese):** import correto (§6) · fronteira determinístico/gerado + Guardião gate
(§5) · provenance envelope + ledger mínimo (§5).

**Adiável (não prova a tese agora):** suite Markowitz/VaR/BL · multi-tenant/RLS · read replica · fila
durável · Redis (rate-limit/idempotência podem ir numa tabela Postgres até a carga doer).

**Ordem de build (severidade):**

| # | Item | Estado |
|---|---|---|
| 1 | Contrato do resultado estruturado (JSON das figuras + provenance envelope) | começa primeiro — seam que sustenta a tese e o que o Guardião confere |
| 2 | Import pipeline (§6, um schema só) | **bloqueado** no Excel real da firma |
| 3 | Snapshot pinning (snapshot_id + flip atômico) na ingestão atual | em paralelo |
| 4 | Compute core (lib pura, 4 métricas) | depende de 2 + 3 |
| 5 | Orquestrador + agentes grounded só no resultado estruturado | refatora o agente atual |
| 6 | Guardião gate determinístico (containment) | depende de 1 |
| 7 | UI de revisão + ledger de aprovação (append-only, mostra deltas) | fecha o caminho |

---

## 12. Realidade de deploy vs target (não super-construir)

O diagrama é o target **lógico**. No MVP, colapse sobre o mínimo de peças que a carga justifica:

| Componente | Deploy no MVP | Extrair para processo próprio quando… |
|---|---|---|
| Serving (C1) | no monolito | carga sustentada de request fome os workers |
| Brigada (C2) | **pool de workers no mesmo codebase**, processo separado | separar cedo — LLM não pode bloquear threads de request |
| Compute core (C3) | **lib pura in-process** | nunca; é uma biblioteca |
| Import pipeline (C4) | no monolito, job async | volume de import ou necessidade de isolamento cresce |
| Ingestão de mercado (C4) | **processo separado desde o dia 1** | já separado — Brapi lenta não pode bloquear serving |
| Postgres + réplica | Postgres gerenciado + 1 réplica | carga de leitura cresce |
| Redis | Redis gerenciado | — |
| Ledger (C5) | tabela append-only no Postgres | volume/compliance exige store dedicado |

**O trabalho agora são seams internos limpos**, não microsserviços. Um módulo com interface limpa é um
dia para extrair depois; um emaranhado é um trimestre.

---

## 13. Framing honesto para diligência

- ✅ Afirmar: *"Toda figura é computada deterministicamente e verificável; o LLM renderiza prosa ao redor
  de figuras que não pode alterar nem inventar; enforçamos essa fronteira em código."*
- ❌ **Não** afirmar "o sistema é puramente determinístico" — os agentes não são, e o overclaim colapsa
  sob uma pergunta levando sua credibilidade junto.
- Comparar honestamente: **Bridgewise** (métricas determinísticas + narração) é o análogo certo de MVP.
  **Aladdin** é um system-of-record de risco com décadas; invocá-lo infla o que seu compute core faz.
  Seu moat é o workflow de alavancagem do consultor, não o motor de risco.

---

## 14. Open items (decidir antes de construir)

1. **Schema real do Excel** (§6) — bloqueia o import. Precisa de 1 arquivo representativo.
2. **Segunda fonte de mercado licenciada** — excluir yfinance deixa staleness como único eixo de failover;
   fonte única também é pergunta de diligência para SLA de wealth. Nomear a alternativa contratada.
3. **Mecanismo de isolamento de tenant** (§8) — RLS vs separação física. Adiado para v1 (single-tenant),
   mas decidir antes da 2ª firma.
4. **Existência de "carteira-alvo"** para o drift (§4 v0) — o cálculo de drift pressupõe um alvo; confirmar
   se a firma fornece ou se é derivado.
5. **Destino das superfícies atuais** (home, asset, news, terminal) — viram research ao redor da carteira
   ou são arquivadas. Ver reconciliação no [AGENTS.md](../AGENTS.md).
