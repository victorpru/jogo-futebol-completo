import type { WinnerRecord } from '../components/WinnersPage'

const API_URL = '/api/winners'
let winnersRequest: Promise<WinnerRecord[]> | null = null

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) throw new Error('Não foi possível atualizar o histórico de vencedores.')
  return response.json() as Promise<T>
}

export async function fetchWinners(): Promise<WinnerRecord[]> {
  if (!winnersRequest) {
    winnersRequest = request<{ data: WinnerRecord[] }>(API_URL).then((payload) => payload.data).catch((error) => {
      winnersRequest = null
      throw error
    })
  }
  return winnersRequest
}

export async function saveWinner(name: string): Promise<WinnerRecord[]> {
  winnersRequest = null
  const payload = await request<{ data: WinnerRecord[] }>(API_URL, { method: 'POST', body: JSON.stringify({ name }) })
  return payload.data
}

export async function addWinnerWin(id: string): Promise<WinnerRecord[]> {
  winnersRequest = null
  const payload = await request<{ data: WinnerRecord[] }>(`${API_URL}/${id}`, { method: 'PATCH' })
  return payload.data
}

export async function deleteWinner(id: string): Promise<WinnerRecord[]> {
  winnersRequest = null
  const payload = await request<{ data: WinnerRecord[] }>(`${API_URL}/${id}`, { method: 'DELETE' })
  return payload.data
}
