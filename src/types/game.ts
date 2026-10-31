export type PlayerPosition = 'GOL' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'ATA'

export interface FootballPlayer {
  id: string
  name: string
  age: number
  nationality: string
  positions: PlayerPosition[]
  skill: number
  value: number
}

export interface DeckCard {
  playerId: string
  assignedPosition: PlayerPosition
}

export interface TeamPlayer {
  id: string
  skill: number
  value: number
  assignedPosition: PlayerPosition
}

export interface GameParticipant {
  id: string
  name: string
  teamName: string
  money: number
  deck: DeckCard[]
}
