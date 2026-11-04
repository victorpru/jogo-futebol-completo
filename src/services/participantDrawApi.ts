import type { SupabaseClient } from '@supabase/supabase-js'

export interface DrawParticipant {
  id: string
  name: string
}

export async function fetchDrawParticipants(supabase: SupabaseClient): Promise<DrawParticipant[]> {
  const { data, error } = await supabase
    .from('npc_draw_participants')
    .select('id, name')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addDrawParticipant(supabase: SupabaseClient, name: string): Promise<DrawParticipant> {
  const { data, error } = await supabase
    .from('npc_draw_participants')
    .insert({ name })
    .select('id, name')
    .single()
  if (error) throw error
  return data
}

export async function removeDrawParticipant(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('npc_draw_participants')
    .delete()
    .eq('id', id)
  if (error) throw error
}
