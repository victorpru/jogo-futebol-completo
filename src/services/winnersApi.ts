import type { SupabaseClient } from '@supabase/supabase-js'
import type { WinnerRecord } from '../components/WinnersPage'

export async function fetchWinners(supabase: SupabaseClient): Promise<WinnerRecord[]> {
  const { data, error } = await supabase.from('winners').select('id, name, wins').order('wins', { ascending: false }).order('name')
  if (error) throw error
  return data ?? []
}

export async function saveWinner(supabase: SupabaseClient, name: string): Promise<WinnerRecord[]> {
  const { data: existing, error: existingError } = await supabase.from('winners').select('id, wins').eq('name', name).maybeSingle()
  if (existingError) throw existingError
  const request = existing
    ? supabase.from('winners').update({ wins: existing.wins + 1 }).eq('id', existing.id)
    : supabase.from('winners').insert({ name, wins: 1 })
  const { error } = await request
  if (error) throw error
  return fetchWinners(supabase)
}

export async function addWinnerWin(supabase: SupabaseClient, id: string): Promise<WinnerRecord[]> {
  const { data: winner, error: readError } = await supabase.from('winners').select('wins').eq('id', id).single()
  if (readError) throw readError
  const { error } = await supabase.from('winners').update({ wins: winner.wins + 1 }).eq('id', id)
  if (error) throw error
  return fetchWinners(supabase)
}

export async function deleteWinner(supabase: SupabaseClient, id: string): Promise<WinnerRecord[]> {
  const { error } = await supabase.from('winners').delete().eq('id', id)
  if (error) throw error
  return fetchWinners(supabase)
}
