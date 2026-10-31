import type { FootballPlayer, PlayerPosition } from '../types/game'

interface PlayersResponse {
  data: FootballPlayer[]
  total: number
  filters: Record<string, string>
}

const API_URL = '/api/players'

export async function fetchPlayers(filters: { position?: PlayerPosition; minSkill?: number; maxValue?: number; search?: string } = {}): Promise<FootballPlayer[]> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  const response = await fetch(`${API_URL}?${params}`)
  if (!response.ok) throw new Error(`Falha ao consultar cartas: ${response.status}`)
  const payload = await response.json() as PlayersResponse
  return payload.data
}

export async function fetchPlayer(id: string): Promise<FootballPlayer> {
  const response = await fetch(`${API_URL}/${id}`)
  if (!response.ok) throw new Error(`Carta não encontrada: ${id}`)
  const payload = await response.json() as { data: FootballPlayer }
  return payload.data
}
