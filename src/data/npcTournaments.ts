export type NpcTournamentId = 'paulista' | 'copa-do-brasil' | 'brasileiro' | 'libertadores' | 'mundial'

export const paulistaTeams = [
  'Corinthians',
  'Palmeiras',
  'Santos',
  'São Paulo',
  'Fluminense',
  'Atlético Mineiro',
] as const

export const copaDoBrasilTeams = [
  'Bahia',
  'Goiás',
  'Fluminense',
  'Botafogo',
  'Atlético Mineiro',
  'Athletico Paranaense',
  'Santos',
  'Vasco da Gama',
  'Palmeiras',
  'Corinthians',
  'São Paulo',
  'Grêmio',
  'Internacional',
  'Flamengo',
] as const

export const brasileiroTeams = [
  'Flamengo',
  'Internacional',
  'Grêmio',
  'São Paulo',
  'Corinthians',
  'Palmeiras',
  'Vasco da Gama',
  'Santos',
  'Athletico Paranaense',
  'Atlético Mineiro',
  'Botafogo',
  'Fluminense',
  'Goiás',
  'Bahia',
] as const

export const libertadoresFixedTeams = [
  'Boca Juniors',
  'Peñarol',
  'River Plate',
] as const

export const mundialTeams = ['Real Madrid', 'Bayern de Munique'] as const

export const allNpcTeamNames = [
  ...new Set([...paulistaTeams, ...copaDoBrasilTeams, ...brasileiroTeams]),
]

export interface NpcTournamentDefinition {
  id: NpcTournamentId
  name: string
  teamCount: number | null
  format: string
  rules: string[]
}

export const npcTournaments: NpcTournamentDefinition[] = [
  {
    id: 'paulista',
    name: 'Paulista',
    teamCount: 8,
    format: '8 times',
    rules: ['8 times participantes.'],
  },
  {
    id: 'copa-do-brasil',
    name: 'Copa do Brasil',
    teamCount: 16,
    format: '16 times',
    rules: ['16 times brasileiros.', 'Não entram os 3 times brasileiros com maior poder total.'],
  },
  {
    id: 'brasileiro',
    name: 'Brasileiro',
    teamCount: 16,
    format: '16 times',
    rules: ['16 times brasileiros com os maiores poderes totais.'],
  },
  {
    id: 'libertadores',
    name: 'Libertadores',
    teamCount: 8,
    format: '8 vagas',
    rules: [
      'Campeão da Copa do Brasil.',
      '4 melhores times do Brasileiro.',
      'Se o campeão da Copa do Brasil estiver entre os 4 melhores do Brasileiro, entra o 5º colocado.',
      'Times argentinos.',
    ],
  },
  {
    id: 'mundial',
    name: 'Mundial',
    teamCount: 1,
    format: '1 time',
    rules: ['Escolha 1 time entre Real Madrid e Bayern de Munique.'],
  },
]
