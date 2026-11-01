import type { SupabaseClient } from '@supabase/supabase-js'
import type { DrawType, ItemDrawState } from '../components/ItemsPage'

export async function fetchItemDrawState(supabase: SupabaseClient, userId: string): Promise<ItemDrawState | null> {
  const { data, error } = await supabase
    .from('item_draw_state')
    .select('level_up_total, level_up_remaining, blue_remaining, yellow_remaining')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    levelUpTotal: data.level_up_total,
    levelUpRemaining: Array.isArray(data.level_up_remaining) ? data.level_up_remaining : [],
    blueRemaining: Array.isArray(data.blue_remaining) ? data.blue_remaining : [],
    yellowRemaining: Array.isArray(data.yellow_remaining) ? data.yellow_remaining : [],
  }
}

export async function saveItemDrawState(supabase: SupabaseClient, userId: string, state: ItemDrawState) {
  const { error } = await supabase.from('item_draw_state').upsert({
    user_id: userId,
    level_up_total: state.levelUpTotal,
    level_up_remaining: state.levelUpRemaining,
    blue_remaining: state.blueRemaining,
    yellow_remaining: state.yellowRemaining,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export function getRemainingForType(state: ItemDrawState, type: DrawType): number[] | null {
  if (type === 'level-up') return state.levelUpRemaining
  if (type === 'blue') return state.blueRemaining
  if (type === 'yellow') return state.yellowRemaining
  return null
}
