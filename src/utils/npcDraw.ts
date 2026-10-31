import type { NpcDrawnPlayer, NpcTeam } from '../types/npcTeam'

export function drawNpcPlayers(team: NpcTeam, upgrades: number[] = [], random: () => number = Math.random): NpcDrawnPlayer[] {
  const shuffled = team.playerPowers.map((power, index) => ({ power, sourceIndex: index }))
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled.map((player, index) => ({ id: `${team.id}-player-${index + 1}`, number: index + 1, power: player.power + (upgrades[player.sourceIndex] ?? 0) }))
}

export function getDrawnPower(players: NpcDrawnPlayer[]): number {
  return players.reduce((total, player) => total + player.power, 0)
}
