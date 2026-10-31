import type { DeckCard, FootballPlayer, PlayerPosition } from '../types/game'

const officialPrices: Record<number, [number, number, number]> = {
  11: [2, 5, 8], 12: [4, 7, 10], 13: [6, 9, 12], 14: [9, 12, 15],
  15: [12, 16, 20], 16: [16, 21, 26], 17: [21, 27, 33], 18: [27, 34, 41],
  19: [34, 42, 50], 20: [42, 51, 60], 21: [50, 60, 70],
}

export const composition = { GOL: 1, ZAG: 2, LAT: 2, VOL: 1, MEI: 2, ATA: 3 } as const

export function getOfficialPrice(skill: number, positionCount: number): number {
  if (!Number.isInteger(skill) || skill < 11 || skill > 21 || !Number.isInteger(positionCount) || positionCount < 1 || positionCount > 3) {
    throw new Error('Habilidade ou quantidade de posições inválida.')
  }
  return officialPrices[skill][positionCount - 1]
}

export function validateDeckCard(card: DeckCard, player: FootballPlayer): string | null {
  return player.positions.includes(card.assignedPosition) ? null : 'A posição escolhida não pertence às posições desta carta.'
}

export function validateDeck(deck: DeckCard[], players: FootballPlayer[]): string | null {
  if (deck.length > 11) return 'Um deck não pode exceder 11 cartas.'
  if (new Set(deck.map((card) => card.playerId)).size !== deck.length) return 'Uma carta não pode aparecer duas vezes no deck.'
  const positionCount = Object.fromEntries(Object.keys(composition).map((position) => [position, 0])) as Record<PlayerPosition, number>
  for (const card of deck) {
    const player = players.find((item) => item.id === card.playerId)
    if (!player) return `Carta não encontrada: ${card.playerId}.`
    const cardError = validateDeckCard(card, player)
    if (cardError) return cardError
    positionCount[card.assignedPosition] += 1
    if (positionCount[card.assignedPosition] > composition[card.assignedPosition]) return `A posição ${card.assignedPosition} excedeu as vagas disponíveis.`
  }
  return null
}

export function getDeckPower(deck: DeckCard[], players: FootballPlayer[]): number {
  return deck.reduce((total, card) => total + (players.find((player) => player.id === card.playerId)?.skill ?? 0), 0)
}

export function getDeckValue(deck: DeckCard[], players: FootballPlayer[]): number {
  return deck.reduce((total, card) => total + (players.find((player) => player.id === card.playerId)?.value ?? 0), 0)
}

export function getSkillLabel(skill: number): string {
  if (skill <= 12) return 'Consistente'
  if (skill <= 15) return 'Bom'
  if (skill <= 19) return 'Elite'
  if (skill === 20) return 'Craque'
  return 'Lendário'
}

export function getPositionLabel(position: PlayerPosition): string {
  return { GOL: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral', VOL: 'Volante', MEI: 'Meia', ATA: 'Atacante' }[position]
}
