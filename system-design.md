# System Design: Bullcapital (AI Agent Directives)

## 1. Filosofia de Design: "The Financial Reading Room"

Diferente das plataformas de trading tradicionais que buscam agitação e urgência, o **Bullcapital** é desenhado para ser um ambiente de contemplação e clareza.

- **O Princípio da Calma:** O design deve reduzir a carga cognitiva. Menos números, mais contexto.
- **Qualitativo sobre Quantitativo:** A história (IA) sempre precede o dado bruto.
- **A Fusão Tátil-Translúcida (Core Directive):** Elementos nunca são "planos" (flat design é estritamente proibido). O design exige **Materialidade Digital**. A solidez mecânica e o volume do Esqueomorfismo Moderno devem coexistir com a refração e a leveza do Glassmorphism. Pense em interfaces construídas com placas de acrílico espesso, mostradores físicos e luzes difusas.

---

## 2. Paleta de Cores e Atmosfera (Luz e Sombra)

A paleta é profunda e luxuosa, inspirada em hardware de áudio high-end e observatórios espaciais. Para agentes: a cor nunca é apenas um preenchimento; ela interage com a luz (glow) e o ambiente (blur).

| Elemento      | Hex / RGBA              | Aplicação e Comportamento Físico                                                                              | Sensação                           |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Void**      | `#0D0B14`               | Fundo principal (Background base). Deve parecer um espaço infinito.                                           | Infinito, foco, profundidade.      |
| **Surface**   | `#1A1625`               | Base sólida de módulos físicos e botões não-translúcidos.                                                     | Solidez, materialidade densa.      |
| **Starlight** | `#F4F0FF`               | Textos principais e títulos.                                                                                  | Clareza, legibilidade editorial.   |
| **Amethyst**  | `#8B5CF6`               | Acentos, estados ativos. **Crucial:** Usar como _Glow_ (Drop shadow difuso) para simular luz LED sob o vidro. | Inteligência, sofisticação.        |
| **Glass Rim** | `white/10` a `white/20` | Bordas (`border`) de elementos de vidro para simular refração de luz e espessura do material (Bevel).         | Refração, polimento, volume tátil. |
| **Shadow**    | `black/40` a `black/60` | Sombras projetadas espessas para separar as camadas de vidro do fundo (Void).                                 | Distância, flutuação.              |

---

## 3. Tipografia Editorial

A tipografia é o que separa o "software" da "revista de luxo".

- **Headings (Títulos):** `Playfair Display` ou `Instrument Serif`.
- _Uso:_ Nomes de ativos, manchetes de notícias e títulos de seções.
- _Estilo:_ Serifado, elegante, espaçamento entre letras (letter-spacing) levemente reduzido para impacto.

- **Data & Body (Dados e Texto):** `Inter` ou `Geist`.
- _Uso:_ Narrativas da IA, valores numéricos e labels.
- _Estilo:_ Sans-serif geométrico, ultra-limpo. Os números nunca devem ser "bold" agressivo, mas sim médios e elegantes.

---

## 4. Linguagem Visual: Skeuomorphism 2.0 + Glassmorphism

**Atenção Agentes:** Os elementos devem parecer objetos físicos luxuosos que o usuário deseja tocar. O vidro não é apenas transparente; ele tem _espessura_.

### A. O Container "Thick Glass" (O Padrão Base)

- **Bordas (Border-Radius):** Arredondamento orgânico extremo (`1.5rem` a `3rem` / ex: `rounded-[2rem]`).
- **Corpo Translúcido (Glassmorphism):** Fundo semi-transparente (ex: `bg-[#1A1625]/40` ou `bg-white/5`) combinado com desfoque pesado (`backdrop-blur-2xl`).
- **Espessura e Iluminação (Skeuomorphism):** Uso OBRIGATÓRIO de bordas finas translúcidas (`border border-white/10`) em conjunto com o componente átomo `<GlassHighlight />` posicionado no topo (`absolute top-0`) para simular o reflexo principal e mais agressivo da luz na aresta do vidro.
- **Dinâmica Tátil e Sombreamento (Box-Shadow Workflow):** A materialidade é construída através de um empilhamento hiper-específico de sombras internas (inset) e externas, reagindo fisicamente ao `:hover`.
  - **Estado de Repouso:** Elevado com iluminação difusa no topo e peso na base.
    `shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)]`
  - **Estado Interativo (Hover):** O objeto "flutua" mais próximo ao usuário (`-translate-y-1.5`). A lente de refração interna refrata mais luz (inset branco 0.2) e a sombra projetada externa se expande e suaviza, provando a distância do material para o background.
    `hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.5)]`
  - **Transição Emocional:** Sempre acompanhado por tempos longos de transição para garantir calma e fluidez: `transition-all duration-700`.

### B. Elementos Táteis (Botões, Knobs e Inputs)

- **Estado de Repouso:** Botões parecem teclas de resina fosca ou acrílico saltado. Possuem volume superior (highlight) e sombra inferior projetada no vidro.
- **Estado Ativo (Pressed):** O elemento deve "afundar" fisicamente. A sombra externa desaparece e a sombra interna (`inset shadow`) aumenta drasticamente, escurecendo levemente o fundo, como um botão mecânico afundando na superfície.

### C. Visualização de Dados (The Bubbles & Dials)

- **Forma:** Esferas tridimensionais, mostradores redondos (dials) ou cúpulas de vidro (domos).
- **Comportamento LUMINOSO:** Ativos em alta não mudam apenas de cor; eles "ligam" uma luz interna. Emitem um brilho (glow) _Amethyst_ sob a camada de vidro.
- **Movimento:** Devem flutuar levemente em seus eixos Y (animação suave), como se estivessem suspensos em um fluido magnético.

---

## 5. Anatomia dos Componentes

### Hero Section

- **Busca:** Não é um campo de texto plano, é um "Portal". Uma pílula de acrílico espesso que, ao ser focada por interação, afunda no eixo Z e expande suavemente um brilho lateral roxo (Amethyst LED).
- **Narrativa:** O título centralizado usa a Serif para criar autoridade, com a última palavra pulsando em um gradiente Amethyst sob uma máscara de texto.

### Indicadores de Mercado (The Heartbeat)

- **Sparklines:** Gráficos de linha finos (1px a 1.5px), sem eixos X/Y visíveis. A linha não é um traço de tinta, é um tubo de neon (uso de `drop-shadow` com a cor da linha para simular emissão de luz).
- **Contexto IA:** Todo indicador deve ser acompanhado de uma frase curta e humana, encapsulada em um card de vidro ultrafino (ex: _"O Ibovespa respira após a decisão dos juros"_).

### News Cards

- Layout de "Grid Quebrado" (estilo Pinterest ou editorial de moda).
- Imagens possuem um leve filtro de desaturação e opacidade para se misturarem ao `Void`, ganhando cor total apenas no _hover_.
- Sem botões "Leia Mais". O card inteiro é uma placa de vidro interativa que reage fisicamente (tilt/afunda) à interação.

---

## 6. Regras de Ouro para Agentes (Strict Directives)

1. **PROIBIDO Flat Design:** Se um card, botão ou input tiver apenas `background-color` e `border-radius` sem nenhuma iluminação (shadows/highlights) ou refração (blur), reescreva o código.
2. **PROIBIDO Semáforo Agressivo:** Nunca usar vermelho puro (`#FF0000`) ou verde puro (`#00FF00`). Use tons pastéis suaves sob o vidro ou apenas a direção da seta. A calma do design não pode ser quebrada.
3. **PROIBIDO Bordas Retas:** Zero cantos de 90 graus. A natureza orgânica exige arredondamentos consistentes em todos os nós.
4. **OBRIGATÓRIO Dualidade Tátil-Vítrea:** Todo card principal DEVE ter `backdrop-filter: blur()` (o vidro) combinado com `box-shadow` e `inset shadow` (o esqueleto físico/esqueomórfico).
5. **OBRIGATÓRIO Respiro Editorial:** Manter pelo menos `40px` (ou `2.5rem`) de padding ao redor de qualquer texto explicativo da IA. O espaço vazio é um luxo.
6. **OBRIGATÓRIO Fuga de Planilhas:** Se a estrutura gerada parecer remotamente com uma tabela de Excel ou grid denso de dados, o design falhou estruturalmente. Refatore isolando dados em cúpulas, pílulas e cards de vidro individuais com hierarquia visual clara.
