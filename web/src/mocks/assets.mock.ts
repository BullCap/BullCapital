export interface AssetData {
  id: string
  name: string
  value: string
  variation: number
  history: { value: number }[]
}

export const mockData: AssetData[] = [
  {
    id: 'ibov',
    name: 'Ibovespa',
    value: '131.004',
    variation: -0.8,
    history: [
      { value: 132000 },
      { value: 133500 },
      { value: 132800 },
      { value: 131900 },
      { value: 132100 },
      { value: 131500 },
      { value: 131004 },
    ],
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    value: '5.123',
    variation: 1.2,
    history: [
      { value: 4900 },
      { value: 4950 },
      { value: 5010 },
      { value: 4990 },
      { value: 5050 },
      { value: 5090 },
      { value: 5123 },
    ],
  },
  {
    id: 'usd',
    name: 'Dólar',
    value: 'R$ 4,95',
    variation: -0.2,
    history: [
      { value: 4.9 },
      { value: 4.98 },
      { value: 5.01 },
      { value: 4.97 },
      { value: 4.94 },
      { value: 4.96 },
      { value: 4.95 },
    ],
  },
  {
    id: 'ifix',
    name: 'IFIX',
    value: '3.382',
    variation: 0.1,
    history: [
      { value: 3350 },
      { value: 3340 },
      { value: 3360 },
      { value: 3365 },
      { value: 3370 },
      { value: 3375 },
      { value: 3382 },
    ],
  },
]

export const AI_ANALYSIS =
  'Um mercado dividido: Enquanto o setor de commodities segura o Ibovespa, empresas de tecnologia sofrem lá fora, mantendo o investidor cauteloso em ativos de risco.'
