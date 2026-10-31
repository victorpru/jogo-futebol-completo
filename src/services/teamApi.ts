import type { SupabaseClient } from '@supabase/supabase-js'
import type { TeamPlayer } from '../types/game'

interface TeamRow {
  money: number
  players: TeamPlayer[]
  levelUpCount: number
}

function isTeamPlayer(value: unknown): value is TeamPlayer {
  if (typeof value !== 'object' || value === null) return false
  const player = value as Partial<TeamPlayer>
  return typeof player.id === 'string'
    && Number.isInteger(player.skill)
    && Number.isFinite(player.value)
    && ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'].includes(player.assignedPosition ?? '')
}

export async function fetchTeam(supabase: SupabaseClient, userId: string): Promise<TeamRow> {
  const { data, error } = await supabase
    .from('team_state')
    .select('money, players, level_up_count')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  const players = Array.isArray(data?.players) ? data.players.filter(isTeamPlayer) : []
  const money = Number(data?.money ?? 0)
  const levelUpCount = Number(data?.level_up_count ?? 0)
  return {
    money: Number.isFinite(money) && money >= 0 ? money : 0,
    players,
    levelUpCount: Number.isInteger(levelUpCount) && levelUpCount >= 0 && levelUpCount <= 25 ? levelUpCount : 0,
  }
}

export async function saveTeam(supabase: SupabaseClient, userId: string, money: number, players: TeamPlayer[], levelUpCount: number) {
  const { error } = await supabase.from('team_state').upsert({
    user_id: userId,
    money,
    players,
    level_up_count: levelUpCount,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
