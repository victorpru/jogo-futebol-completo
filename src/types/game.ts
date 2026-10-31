export type PlayerPosition = 'GOL' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'ATA'

export interface TeamPlayer {
  id: string
  skill: number
  value: number
  assignedPosition: PlayerPosition
}
