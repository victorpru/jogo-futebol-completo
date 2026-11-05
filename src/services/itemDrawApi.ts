import type { SupabaseClient } from '@supabase/supabase-js'
import type { DrawType, ItemDrawState } from '../components/ItemsPage'

export interface SponsorDraw {
  sponsorType: 'blue' | 'yellow'
  sponsorIndex: number
  value: number
  userId: string
}

export async function fetchSponsorDraws(supabase: SupabaseClient): Promise<SponsorDraw[]> {
  const { data, error } = await supabase
    .from('item_sponsor_draw')
    .select('sponsor_type, sponsor_index, value, user_id')
  if (error) throw error
  return (data ?? []).map((item) => ({
    sponsorType: item.sponsor_type,
    sponsorIndex: item.sponsor_index,
    value: item.value,
    userId: item.user_id,
  }))
}

export async function saveSponsorDraw(supabase: SupabaseClient, draw: SponsorDraw) {
  const { error } = await supabase.from('item_sponsor_draw').insert({
    sponsor_type: draw.sponsorType,
    sponsor_index: draw.sponsorIndex,
    value: draw.value,
    user_id: draw.userId,
  })
  if (error) throw error
}

export async function deleteSponsorDraw(supabase: SupabaseClient, draw: SponsorDraw) {
  const { error } = await supabase
    .from('item_sponsor_draw')
    .delete()
    .eq('sponsor_type', draw.sponsorType)
    .eq('sponsor_index', draw.sponsorIndex)
    .eq('user_id', draw.userId)
  if (error) throw error
}

export async function fetchItemDrawState(supabase: SupabaseClient, userId: string): Promise<ItemDrawState | null> {
  const { data, error } = await supabase
    .from('item_draw_state')
    .select('level_up_total, level_up_remaining, blue_remaining, yellow_remaining, sponsorship_money_claimed')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    levelUpTotal: data.level_up_total,
    levelUpRemaining: Array.isArray(data.level_up_remaining) ? data.level_up_remaining : [],
    blueRemaining: Array.isArray(data.blue_remaining) ? data.blue_remaining : [],
    yellowRemaining: Array.isArray(data.yellow_remaining) ? data.yellow_remaining : [],
    sponsorshipMoneyClaimed: Number.isFinite(Number(data.sponsorship_money_claimed)) ? Number(data.sponsorship_money_claimed) : 0,
  }
}

export async function saveItemDrawState(supabase: SupabaseClient, userId: string, state: ItemDrawState) {
  const { error } = await supabase.from('item_draw_state').upsert({
    user_id: userId,
    level_up_total: state.levelUpTotal,
    level_up_remaining: state.levelUpRemaining,
    blue_remaining: state.blueRemaining,
    yellow_remaining: state.yellowRemaining,
    sponsorship_money_claimed: state.sponsorshipMoneyClaimed,
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
