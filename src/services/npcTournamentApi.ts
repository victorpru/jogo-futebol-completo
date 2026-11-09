import type { SupabaseClient } from '@supabase/supabase-js'
import type { NpcTournamentId } from '../data/npcTournaments'

export interface SavedBracketTeam {
  name: string
  color: string | null
  isUser?: boolean
}

export interface NpcTournamentSnapshot {
  teams: Partial<Record<NpcTournamentId, SavedBracketTeam[]>>
  winners: Partial<Record<NpcTournamentId, Record<string, string>>>
  libertadoresTeams: string[]
  mundialOpponent: string | null
}

const emptySnapshot: NpcTournamentSnapshot = {
  teams: {},
  winners: {},
  libertadoresTeams: [],
  mundialOpponent: null,
}

export async function fetchNpcTournamentState(supabase: SupabaseClient): Promise<NpcTournamentSnapshot | null> {
  const { data, error } = await supabase
    .from('npc_tournament_global_state')
    .select('state')
    .eq('id', 'global')
    .maybeSingle()
  if (error) throw error
  if (!data?.state || typeof data.state !== 'object') return null
  const state = data.state as Partial<NpcTournamentSnapshot>
  return {
    teams: state.teams ?? emptySnapshot.teams,
    winners: state.winners ?? emptySnapshot.winners,
    libertadoresTeams: Array.isArray(state.libertadoresTeams) ? state.libertadoresTeams : emptySnapshot.libertadoresTeams,
    mundialOpponent: typeof state.mundialOpponent === 'string' ? state.mundialOpponent : null,
  }
}

export async function saveNpcTournamentState(supabase: SupabaseClient, state: NpcTournamentSnapshot) {
  const { error } = await supabase.from('npc_tournament_global_state').upsert({
    id: 'global',
    state,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
