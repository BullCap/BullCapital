// Metric Stories Registry for BullCapital
// Rich educational narratives, historical chart data, and compressed daily quotes

export interface MetricChartPoint {
  date: string
  value: number
}

export interface MetricQuoteRow {
  date: string
  open: string
  close: string
  change: string
  changeType: 'up' | 'down' | 'flat'
  min: string
  max: string
  volume: string
}

export interface MetricStory {
  id: string
  title: string
  category: string
  description: string
  whatItIs: string
  howItWorks: string
  pocketImpact: string
  chartData: MetricChartPoint[]
  recentQuotes: MetricQuoteRow[]
  yAxisDomain: [number, number] | ['auto', 'auto']
}

export const METRIC_STORIES: Record<string, MetricStory> = {
  selic: {
    id: 'selic',
    title: 'Taxa SELIC',
    category: 'Macroeconomia',
    description: 'A taxa básica de juros da economia brasileira, definida pelo COPOM (Banco Central).',
    whatItIs: 'A taxa SELIC (Sistema Especial de Liquidação e de Custódia) é o principal instrumento de política monetária do Banco Central para controlar a inflação. Ela influencia todas as outras taxas de juros do país, como empréstimos, financiamentos e rendimentos de investimentos.',
    howItWorks: 'O Comitê de Política Monetária (COPOM) se reúne a cada 45 dias para definir a taxa SELIC Meta. Quando a inflação está alta, o COPOM tende a subir a SELIC para encarecer o crédito, desacelerar o consumo e conter a alta de preços. Quando a inflação está controlada e há necessidade de estimular o PIB, a SELIC é reduzida.',
    pocketImpact: '• **Renda Fixa**: Com a SELIC elevada, investimentos pós-fixados (CDBs, Tesouro SELIC, LCI/LCA) passam a oferecer remuneração maior.\n• **Renda Variável**: Juros altos encarecem as dívidas das empresas e aumentam o custo de capital, o que costuma deprimir o preço das ações.\n• **Financiamentos**: Com a SELIC em queda, financiar imóveis ou veículos fica substancialmente mais barato.',
    yAxisDomain: [2, 14],
    chartData: [
      { date: '2020', value: 2.0 },
      { date: '2021', value: 9.25 },
      { date: '2022', value: 13.75 },
      { date: '2023', value: 11.75 },
      { date: '2024', value: 11.25 },
      { date: '2025', value: 12.25 },
      { date: '2026', value: 10.50 }
    ],
    recentQuotes: [
      { date: '22/05/2026', open: '10,50%', close: '10,50%', change: '0,00%', changeType: 'flat', min: '10,50%', max: '10,50%', volume: '-' },
      { date: '21/05/2026', open: '10,50%', close: '10,50%', change: '0,00%', changeType: 'flat', min: '10,50%', max: '10,50%', volume: '-' },
      { date: '20/05/2026', open: '10,50%', close: '10,50%', change: '0,00%', changeType: 'flat', min: '10,50%', max: '10,50%', volume: '-' },
      { date: '19/05/2026', open: '10,50%', close: '10,50%', change: '0,00%', changeType: 'flat', min: '10,50%', max: '10,50%', volume: '-' },
      { date: '18/05/2026', open: '10,50%', close: '10,50%', change: '0,00%', changeType: 'flat', min: '10,50%', max: '10,50%', volume: '-' },
      { date: '13/05/2026', open: '10,75%', close: '10,50%', change: '-0,25%', changeType: 'down', min: '10,50%', max: '10,75%', volume: 'Decisão COPOM' },
      { date: '12/05/2026', open: '10,75%', close: '10,75%', change: '0,00%', changeType: 'flat', min: '10,75%', max: '10,75%', volume: '-' }
    ]
  },
  ipca: {
    id: 'ipca',
    title: 'IPCA (Inflação)',
    category: 'Macroeconomia',
    description: 'O Índice de Preços ao Consumidor Amplo, termômetro oficial da inflação no Brasil.',
    whatItIs: 'Calculado mensalmente pelo IBGE, o IPCA mede a variação de preços de um conjunto de bens e serviços consumidos pelas famílias brasileiras com rendimentos de 1 a 40 salários mínimos. Ele indica o custo de vida e a flutuação do poder de compra.',
    howItWorks: 'O IBGE coleta milhares de preços diariamente em lojas, prestadores de serviços, domicílios e concessionárias. Setores como alimentação, transporte, habitação e saúde têm pesos diferentes no índice. A variação mensal acumulada aponta a taxa anualizada de inflação do país.',
    pocketImpact: '• **Poder de Compra**: Inflação alta significa que seu Real compra menos produtos, exigindo mais renda para manter o padrão.\n• **Títulos IPCA+**: Investir em Tesouro IPCA+ garante que seu capital renderá acima da inflação, preservando seu poder de compra no longo prazo.\n• **Ativos Reais**: Imóveis e commodities costumam se reajustar com a inflação, atuando como protetores de capital.',
    yAxisDomain: [3, 11],
    chartData: [
      { date: '2020', value: 4.52 },
      { date: '2021', value: 10.06 },
      { date: '2022', value: 5.79 },
      { date: '2023', value: 4.62 },
      { date: '2024', value: 3.93 },
      { date: '2025', value: 4.42 },
      { date: '2026', value: 4.10 }
    ],
    recentQuotes: [
      { date: '05/2026', open: '4,15%', close: '4,10%', change: '-0,05%', changeType: 'down', min: '4,05%', max: '4,20%', volume: 'Consumidor' },
      { date: '04/2026', open: '3,93%', close: '4,15%', change: '+0,22%', changeType: 'up', min: '3,90%', max: '4,25%', volume: 'Habitação/Saúde' },
      { date: '03/2026', open: '3,80%', close: '3,93%', change: '+0,13%', changeType: 'up', min: '3,75%', max: '4,00%', volume: 'Alimentação' },
      { date: '02/2026', open: '4,42%', close: '3,80%', change: '-0,62%', changeType: 'down', min: '3,70%', max: '4,45%', volume: 'Combustíveis' },
      { date: '01/2026', open: '4,50%', close: '4,42%', change: '-0,08%', changeType: 'down', min: '4,35%', max: '4,50%', volume: 'Sazonal' }
    ]
  },
  ibovespa: {
    id: 'ibovespa',
    title: 'Ibovespa',
    category: 'Índice de Mercado',
    description: 'O principal índice da Bolsa de Valores brasileira (B3), medindo o desempenho médio das maiores empresas.',
    whatItIs: 'O IBOV é uma carteira teórica de ações que reúne as empresas mais negociadas e com maior valor de mercado na Bolsa brasileira. Ele funciona como o principal termômetro do humor de mercado em relação ao Brasil.',
    howItWorks: 'As ações possuem pesos proporcionais à sua liquidez e tamanho de mercado na Bolsa. Setores como Commodities (Vale, Petrobras) e Financeiro (Itaú, Bradesco) representam uma parcela significativa do índice, fazendo com que oscilações nesses setores guiem o rumo geral do IBOV.',
    pocketImpact: '• **Renda Variável**: É o maior benchmark para fundos de ações e carteiras brasileiras.\n• **Sentimento de Mercado**: Altas consistentes atraem fluxo estrangeiro, fortalecendo a economia e ajudando a valorizar o Real.\n• **Exposição via ETF**: ETFs como o BOVA11 replicam a cesta do índice em uma única posição.',
    yAxisDomain: [90000, 140000],
    chartData: [
      { date: '2020', value: 119000 },
      { date: '2021', value: 104800 },
      { date: '2022', value: 110000 },
      { date: '2023', value: 134000 },
      { date: '2024', value: 128000 },
      { date: '2025', value: 132000 },
      { date: '2026', value: 125000 }
    ],
    // Matching exactly the provided user screenshot for Ibovespa history!
    recentQuotes: [
      { date: '22/05/2026', open: '177.649', close: '176.210', change: '-0,81%', changeType: 'down', min: '174.893', max: '177.649', volume: '-' },
      { date: '21/05/2026', open: '177.352', close: '177.650', change: '0,17%', changeType: 'up', min: '175.805', max: '178.547', volume: '875,00' },
      { date: '20/05/2026', open: '174.279', close: '177.356', change: '1,77%', changeType: 'up', min: '174.279', max: '178.199', volume: '870,00' },
      { date: '19/05/2026', open: '176.973', close: '174.279', change: '-1,52%', changeType: 'down', min: '173.544', max: '176.973', volume: '873,00' },
      { date: '18/05/2026', open: '177.281', close: '176.976', change: '-0,17%', changeType: 'down', min: '175.811', max: '177.330', volume: '875,00' },
      { date: '15/05/2026', open: '178.341', close: '177.284', change: '0,10%', changeType: 'up', min: '175.417', max: '178.341', volume: '872,00' },
      { date: '13/05/2026', open: '180.342', close: '177.098', change: '-1,80%', changeType: 'down', min: '176.787', max: '180.513', volume: '875,00' },
      { date: '12/05/2026', open: '181.897', close: '180.342', change: '-0,86%', changeType: 'down', min: '179.939', max: '181.897', volume: '877,00' }
    ]
  },
  dolar: {
    id: 'dolar',
    title: 'Dólar Comercial',
    category: 'Moeda e Câmbio',
    description: 'A cotação da moeda americana frente ao Real brasileiro.',
    whatItIs: 'O câmbio USD/BRL indica quantos Reais são necessários para comprar um Dólar. Ele flutua livremente no Brasil de acordo com a oferta e demanda da moeda no mercado internacional e fluxo local.',
    howItWorks: 'Fatores macroeconômicos como a taxa de juros americana (FED) e a brasileira (SELIC), a balança comercial (exportações menos importações), e a estabilidade fiscal do Brasil ditam o rumo do Dólar. Se há risco político ou fiscal, o capital foge e o Dólar sobe.',
    pocketImpact: '• **Exportações**: Gigantes como Vale, Suzano e Petrobras lucram mais quando o dólar sobe, pois vendem em dólar e têm custos em reais.\n• **Inflação Local**: Preço dos combustíveis, trigo (pãozinho) e eletrônicos sobem quando a moeda americana sobe.\n• **Proteção Global**: Ter ativos dolarizados protege o patrimônio contra desvalorizações severas da moeda local.',
    yAxisDomain: [4.5, 6.0],
    chartData: [
      { date: '2020', value: 5.19 },
      { date: '2021', value: 5.58 },
      { date: '2022', value: 5.28 },
      { date: '2023', value: 4.85 },
      { date: '2024', value: 5.15 },
      { date: '2025', value: 5.45 },
      { date: '2026', value: 5.20 }
    ],
    recentQuotes: [
      { date: '22/05/2026', open: 'R$ 5,22', close: 'R$ 5,20', change: '-0,38%', changeType: 'down', min: 'R$ 5,18', max: 'R$ 5,23', volume: '3.42B' },
      { date: '21/05/2026', open: 'R$ 5,19', close: 'R$ 5,22', change: '+0,58%', changeType: 'up', min: 'R$ 5,19', max: 'R$ 5,24', volume: '4.10B' },
      { date: '20/05/2026', open: 'R$ 5,24', close: 'R$ 5,19', change: '-0,95%', changeType: 'down', min: 'R$ 5,17', max: 'R$ 5,25', volume: '3.90B' },
      { date: '19/05/2026', open: 'R$ 5,20', close: 'R$ 5,24', change: '+0,77%', changeType: 'up', min: 'R$ 5,19', max: 'R$ 5,26', volume: '3.80B' },
      { date: '18/05/2026', open: 'R$ 5,21', close: 'R$ 5,20', change: '-0,19%', changeType: 'down', min: 'R$ 5,19', max: 'R$ 5,22', volume: '2.95B' }
    ]
  },
  cdi: {
    id: 'cdi',
    title: 'Taxa CDI',
    category: 'Renda Fixa',
    description: 'O principal benchmark para os rendimentos de Renda Fixa no Brasil.',
    whatItIs: 'O CDI (Certificado de Depósito Interbancário) é a taxa de juros praticada nos empréstimos de curtíssimo prazo que as instituições financeiras fazem entre si. Ela acompanha muito de perto a SELIC, oscilando cerca de 0,10% abaixo dela.',
    howItWorks: 'Bancos emprestam dinheiro entre si diariamente para fechar o caixa no positivo, conforme regras do Banco Central. A média dessas taxas diárias gera a Taxa CDI diária e acumulada, que serve de indexador de rendimento financeiro.',
    pocketImpact: '• **Reserva de Emergência**: A grande maioria dos fundos DI e contas remuneradas paga uma porcentagem do CDI (ex: 100% do CDI).\n• **Custo de Oportunidade**: Com o CDI elevado, a exigência de retorno em ações cresce substancialmente.\n• **Benchmark**: Seus ativos de renda fixa pós-fixada sempre devem mirar bater a evolução do CDI.',
    yAxisDomain: [2, 14],
    chartData: [
      { date: '2020', value: 1.90 },
      { date: '2021', value: 9.15 },
      { date: '2022', value: 13.65 },
      { date: '2023', value: 11.65 },
      { date: '2024', value: 11.15 },
      { date: '2025', value: 12.15 },
      { date: '2026', value: 10.40 }
    ],
    recentQuotes: [
      { date: '22/05/2026', open: '10,40%', close: '10,40%', change: '0,00%', changeType: 'flat', min: '10,40%', max: '10,40%', volume: '-' },
      { date: '21/05/2026', open: '10,40%', close: '10,40%', change: '0,00%', changeType: 'flat', min: '10,40%', max: '10,40%', volume: '-' },
      { date: '20/05/2026', open: '10,40%', close: '10,40%', change: '0,00%', changeType: 'flat', min: '10,40%', max: '10,40%', volume: '-' },
      { date: '19/05/2026', open: '10,40%', close: '10,40%', change: '0,00%', changeType: 'flat', min: '10,40%', max: '10,40%', volume: '-' },
      { date: '18/05/2026', open: '10,40%', close: '10,40%', change: '0,00%', changeType: 'flat', min: '10,40%', max: '10,40%', volume: '-' }
    ]
  },
  pl: {
    id: 'pl',
    title: 'Preço sobre Lucro (P/L)',
    category: 'Valuation de Ativos',
    description: 'Múltiplo de preço que indica quantos anos de lucro seriam necessários para reaver o capital investido.',
    whatItIs: 'O P/L divide a cotação atual de uma ação pelo Lucro por Ação (LPA) acumulado nos últimos 12 meses. É uma métrica tradicional para comparar preço e lucro entre empresas ou períodos.',
    howItWorks: 'Se uma empresa tem P/L de 10, teoricamente levaria 10 anos para recuperar o valor de compra da ação por meio do lucro gerado, assumindo que ele permaneça constante e seja todo distribuído.',
    pocketImpact: '• **P/L Baixo**: Pode indicar desconto relativo ou expectativa de queda nos lucros futuros.\n• **P/L Alto**: Pode refletir expectativa de crescimento maior dos lucros.\n• **Setoriais**: Múltiplos de P/L devem ser comparados com concorrentes diretos ou com a média histórica do próprio ativo.',
    yAxisDomain: ['auto', 'auto'],
    chartData: [
      { date: '2021', value: 14.5 },
      { date: '2022', value: 8.2 },
      { date: '2023', value: 9.8 },
      { date: '2024', value: 11.4 },
      { date: '2025', value: 12.1 },
      { date: '2026', value: 10.6 }
    ],
    recentQuotes: [
      { date: '22/05/2026', open: '10,7x', close: '10,6x', change: '-0,93%', changeType: 'down', min: '10,4x', max: '10,8x', volume: '-' },
      { date: '21/05/2026', open: '10,6x', close: '10,7x', change: '+0,94%', changeType: 'up', min: '10,5x', max: '10,8x', volume: '-' },
      { date: '20/05/2026', open: '10,4x', close: '10,6x', change: '+1,92%', changeType: 'up', min: '10,3x', max: '10,7x', volume: '-' },
      { date: '19/05/2026', open: '10,8x', close: '10,4x', change: '-3,70%', changeType: 'down', min: '10,2x', max: '10,9x', volume: '-' }
    ]
  },
  dy: {
    id: 'dy',
    title: 'Dividend Yield (DY)',
    category: 'Valuation & Renda',
    description: 'Métrica que mede a rentabilidade por proventos (dividendos e JCP) em relação ao preço da ação.',
    whatItIs: 'O Dividend Yield calcula a porcentagem de proventos pagos por uma companhia no último ano dividida pelo valor atual da ação. É o pilar da estratégia de geração de renda passiva na Bolsa.',
    howItWorks: 'Empresas robustas de setores estáveis (como elétricas ou saneamento) distribuem fatias maiores de seus lucros por não precisarem reter muito caixa para expandir. Um Dividend Yield sustentável alto é sinal de estabilidade econômica.',
    pocketImpact: '• **Renda Recorrente**: Proporciona dinheiro direto na conta sem necessidade de vender as ações.\n• **Valuation**: Empresas baratas tendem a mostrar um DY maior se mantiverem os proventos, agindo como um "piso" de proteção de preço.\n• **Juros Compostos**: O reinvestimento desses proventos acelera imensamente o crescimento da carteira no longo prazo.',
    yAxisDomain: ['auto', 'auto'],
    chartData: [
      { date: '2021', value: 4.8 },
      { date: '2022', value: 7.2 },
      { date: '2023', value: 6.5 },
      { date: '2024', value: 5.9 },
      { date: '2025', value: 6.8 },
      { date: '2026', value: 7.4 }
    ],
    recentQuotes: [
      { date: '22/05/2026', open: '7,35%', close: '7,40%', change: '+0,68%', changeType: 'up', min: '7,30%', max: '7,45%', volume: '-' },
      { date: '21/05/2026', open: '7,42%', close: '7,35%', change: '-0,94%', changeType: 'down', min: '7,35%', max: '7,48%', volume: '-' },
      { date: '20/05/2026', open: '7,55%', close: '7,42%', change: '-1,72%', changeType: 'down', min: '7,40%', max: '7,58%', volume: '-' },
      { date: '19/05/2026', open: '7,20%', close: '7,55%', change: '+4,86%', changeType: 'up', min: '7,15%', max: '7,60%', volume: '-' }
    ]
  },
  pvp: {
    id: 'pvp',
    title: 'Preço sobre Valor Patrimonial (P/VP)',
    category: 'Valuation de Ativos',
    description: 'Multiplo que compara a cotação com o valor contábil dos bens da empresa.',
    whatItIs: 'O P/VP divide a cotação pelo Valor Patrimonial por Ação (VPA), mostrando se o mercado está precificando a empresa acima ou abaixo do seu patrimônio contábil.',
    howItWorks: 'Se o P/VP for menor que 1,0, significa que a empresa vale na Bolsa menos do que a soma de todos os seus ativos físicos descontados os passivos. É uma métrica muito utilizada para avaliar Fundos Imobiliários (FIIs).',
    pocketImpact: '• **FIIs**: FIIs com P/VP menor que 1,0 indicam imóveis negociados com desconto no mercado secundário.\n• **Barganhas**: Em ações, P/VP baixo pode indicar ótimas empresas sob estresse pontual ou companhias com sérias crises de rentabilidade (baixo ROE).',
    yAxisDomain: ['auto', 'auto'],
    chartData: [
      { date: '2021', value: 1.8 },
      { date: '2022', value: 1.1 },
      { date: '2023', value: 1.3 },
      { date: '2024', value: 1.4 },
      { date: '2025', value: 1.5 },
      { date: '2026', value: 1.2 }
    ],
    recentQuotes: [
      { date: '22/05/2026', open: '1,22', close: '1,20', change: '-1,64%', changeType: 'down', min: '1,18', max: '1,23', volume: '-' },
      { date: '21/05/2026', open: '1,20', close: '1,22', change: '+1,67%', changeType: 'up', min: '1,19', max: '1,24', volume: '-' },
      { date: '20/05/2026', open: '1,18', close: '1,20', change: '+1,69%', changeType: 'up', min: '1,17', max: '1,21', volume: '-' }
    ]
  },
  roe: {
    id: 'roe',
    title: 'Retorno sobre Patrimônio (ROE)',
    category: 'Eficiência Operacional',
    description: 'Capacidade de gerar lucro a partir dos recursos investidos pelos acionistas.',
    whatItIs: 'O ROE (Return on Equity) calcula o Lucro Líquido anualizado dividido pelo Patrimônio Líquido. É a métrica final da eficiência de gestão de capital da empresa.',
    howItWorks: 'Empresas com ROE alto (acima de 15% ou 20%) demonstram vantagens competitivas claras, como marcas fortes ou escala de produção, permitindo que cresçam rentavelmente sem depender excessivamente de novos aportes ou dívidas cara.',
    pocketImpact: '• **Qualidade**: Um ROE forte e duradouro aponta empresas "vencedoras", excelentes opções para buy & hold de longo prazo.\n• **Combinação**: Quando cruzado com P/VP, um ROE alto justifica múltiplos de avaliação contábil mais elevados na Bolsa.',
    yAxisDomain: ['auto', 'auto'],
    chartData: [
      { date: '2021', value: 14.8 },
      { date: '2022', value: 16.2 },
      { date: '2023', value: 18.5 },
      { date: '2024', value: 19.1 },
      { date: '2025', value: 17.6 },
      { date: '2026', value: 20.2 }
    ],
    recentQuotes: [
      { date: '22/05/2026', open: '20,0%', close: '20,2%', change: '+1,00%', changeType: 'up', min: '19,8%', max: '20,3%', volume: '-' },
      { date: '21/05/2026', open: '20,3%', close: '20,0%', change: '-1,48%', changeType: 'down', min: '19,9%', max: '20,5%', volume: '-' },
      { date: '20/05/2026', open: '19,8%', close: '20,3%', change: '+2,53%', changeType: 'up', min: '19,7%', max: '20,4%', volume: '-' }
    ]
  }
}

// Substring/regex matching to find the appropriate story for any metric label
export function getMetricStory(label: string): MetricStory | null {
  const norm = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  if (norm.includes('selic')) return METRIC_STORIES.selic
  if (norm.includes('ipca') || norm.includes('inflacao')) return METRIC_STORIES.ipca
  if (norm.includes('ibov') || norm.includes('bovespa')) return METRIC_STORIES.ibovespa
  if (norm.includes('dolar') || norm.includes('cambio') || norm.includes('usd')) return METRIC_STORIES.dolar
  if (norm.includes('cdi')) return METRIC_STORIES.cdi
  if (
    norm.includes('p/l') ||
    norm.includes('preco/lucro') ||
    norm.includes('preço/lucro') ||
    norm.includes('preco sobre lucro') ||
    norm.includes('preço sobre lucro')
  ) return METRIC_STORIES.pl
  if (norm.includes('dividend yield') || norm.includes('yield') || norm.includes('dy') || norm.includes('dividendo')) return METRIC_STORIES.dy
  if (norm.includes('p/vp') || norm.includes('valor patrimonial')) return METRIC_STORIES.pvp
  if (norm.includes('roe') || norm.includes('retorno sobre patrimonio')) return METRIC_STORIES.roe

  return null
}
