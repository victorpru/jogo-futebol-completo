import type { NpcTeam } from '../types/npcTeam'

const powers = (...groups: Array<[number, number]>): number[] =>
  groups.flatMap(([quantity, power]) => Array.from({ length: quantity }, () => power))

export const npcTeams: NpcTeam[] = [
  { id: 'npc-cruzeiro', name: 'Cruzeiro', playerPowers: powers([2, 19], [1, 18], [1, 17], [2, 16], [5, 15]), power: 180 },
  { id: 'npc-athletico-pr', name: 'Athletico-PR', playerPowers: powers([2, 19], [3, 18], [3, 17], [2, 16], [1, 15]), power: 190 },
  { id: 'npc-atletico-mg', name: 'Atlético-MG', playerPowers: powers([3, 19], [1, 18], [2, 17], [3, 16], [2, 15]), power: 189 },
  { id: 'npc-leicester', name: 'Leicester', playerPowers: powers([3, 19], [4, 15], [3, 14], [1, 13]), power: 172 },
  { id: 'npc-bahia', name: 'Bahia', playerPowers: powers([2, 19], [5, 15], [3, 14], [1, 13]), power: 168 },
  { id: 'npc-boca-juniors', name: 'Boca Juniors', playerPowers: powers([1, 21], [3, 20], [4, 19], [3, 18]), power: 211 },
  { id: 'npc-penarol', name: 'Peñarol', playerPowers: powers([2, 20], [4, 19], [4, 18], [1, 17]), power: 205 },
  { id: 'npc-river-plate', name: 'River Plate', playerPowers: powers([3, 20], [4, 19], [3, 18], [1, 17]), power: 207 },
  { id: 'npc-bayern-munich', name: 'Bayern de Munique', playerPowers: powers([3, 21], [4, 20], [3, 19], [1, 18]), power: 218 },
  { id: 'npc-real-madrid', name: 'Real Madrid', playerPowers: powers([3, 21], [3, 20], [3, 19], [2, 18]), power: 216 },
  { id: 'npc-corinthians', name: 'Corinthians', playerPowers: powers([2, 20], [3, 19], [2, 18], [2, 17], [2, 15]), power: 197 },
  { id: 'npc-palmeiras', name: 'Palmeiras', playerPowers: powers([1, 21], [2, 20], [3, 18], [3, 17], [2, 15]), power: 196 },
  { id: 'npc-santos', name: 'Santos', playerPowers: powers([1, 21], [1, 20], [3, 18], [4, 17], [2, 15]), power: 193 },
  { id: 'npc-sao-paulo', name: 'São Paulo', playerPowers: powers([7, 19], [3, 17], [1, 15]), power: 199 },
  { id: 'npc-gremio', name: 'Grêmio', playerPowers: powers([1, 20], [4, 19], [3, 18], [2, 17], [1, 15]), power: 199 },
  { id: 'npc-internacional', name: 'Internacional', playerPowers: powers([1, 20], [5, 19], [3, 18], [1, 17], [1, 15]), power: 201 },
  { id: 'npc-flamengo', name: 'Flamengo', playerPowers: powers([1, 21], [2, 20], [3, 19], [2, 18], [3, 17]), power: 205 },
  { id: 'npc-botafogo', name: 'Botafogo', playerPowers: powers([4, 19], [1, 18], [1, 17], [2, 16], [3, 15]), power: 188 },
  { id: 'npc-vasco', name: 'Vasco', playerPowers: powers([2, 19], [2, 18], [1, 17], [4, 16], [2, 15]), power: 185 },
  { id: 'npc-america-mg', name: 'América-MG', playerPowers: powers([1, 20], [2, 19], [3, 17], [3, 16], [2, 15]), power: 187 },
]
