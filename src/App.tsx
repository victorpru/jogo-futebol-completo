import { useEffect, useState } from 'react'
import type { PlayerPosition, TeamPlayer } from './types/game'
import { NpcDrawPage } from './components/NpcDrawPage'
import { HomePage } from './components/HomePage'
import { ItemsPage } from './components/ItemsPage'
import { WinnersPage } from './components/WinnersPage'
import { RulesPage } from './components/RulesPage'
import type { WinnerRecord } from './components/WinnersPage'
import { addWinnerWin, deleteWinner, fetchWinners, saveWinner } from './services/winnersApi'
import { supabase } from './lib/supabase'
import { fetchTeam, saveTeam } from './services/teamApi'
import './App.css'

export default function App() {
  const [page, setPage] = useState<'home' | 'npc' | 'items' | 'winners' | 'rules'>(() => {
    if (window.location.hash === '#sorteio-npc') return 'npc'
    if (window.location.hash === '#itens') return 'items'
    if (window.location.hash === '#vencedores') return 'winners'
    if (window.location.hash === '#regras') return 'rules'
    return 'home'
  })
  const [, setError] = useState<string | null>(null)
  const [money, setMoney] = useState(0)
  const [ownedPlayers, setOwnedPlayers] = useState<TeamPlayer[]>([])
  const [levelUpCount, setLevelUpCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [winners, setWinners] = useState<WinnerRecord[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAdmin(data.user?.email === 'prudencio.vic@gmail.com'))
    fetchWinners(supabase).then(setWinners).catch(() => setError('Não foi possível carregar o histórico de vencedores.'))
    let active = true
    const loadTeam = async (nextUserId: string | null) => {
      if (!nextUserId) {
        if (active) {
          setUserId(null)
          setMoney(0)
          setOwnedPlayers([])
          setLevelUpCount(0)
        }
        return
      }
      try {
        const team = await fetchTeam(supabase, nextUserId)
        if (active) {
          setUserId(nextUserId)
          setMoney(team.money)
          setOwnedPlayers(team.players)
          setLevelUpCount(team.levelUpCount)
        }
      } catch {
        if (active) setError('Não foi possível carregar o seu time.')
      }
    }
    supabase.auth.getSession().then(({ data }) => loadTeam(data.session?.user.id ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user.email === 'prudencio.vic@gmail.com')
      void loadTeam(session?.user.id ?? null)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const navigateTo = (nextPage: 'home' | 'npc' | 'items' | 'winners' | 'rules') => {
    setPage(nextPage)
    const hash = nextPage === 'npc' ? '#sorteio-npc' : nextPage === 'items' ? '#itens' : nextPage === 'winners' ? '#vencedores' : nextPage === 'rules' ? '#regras' : '#home'
    window.history.replaceState(null, '', hash)
  }

  const updateMoney = (amount: number) => {
    setMoney((current) => {
      const next = Math.max(0, current + amount)
      if (userId) void saveTeam(supabase, userId, next, ownedPlayers, levelUpCount).catch(() => setError('Não foi possível salvar o orçamento.'))
      return next
    })
  }

  const addPlayer = (skill: number, value: number, assignedPosition: PlayerPosition) => {
    if (ownedPlayers.length >= 11) return 'O time já possui 11 jogadores.'
    if (!Number.isInteger(skill) || skill < 11 || skill > 21) return 'O poder deve ser um número inteiro entre 11 e 21.'
    if (!Number.isFinite(value) || value < 2 || value > 70) return 'O valor deve estar entre € 2 e € 70 milhões.'
    const positionCount = ownedPlayers.filter((player) => player.assignedPosition === assignedPosition).length
    const vacancies = { GOL: 1, ZAG: 2, LAT: 2, VOL: 1, MEI: 2, ATA: 3 }
    if (positionCount >= vacancies[assignedPosition]) return `Não há mais vaga disponível para ${assignedPosition}.`
    const next = [...ownedPlayers, { id: `team-player-${Date.now()}`, skill, value, assignedPosition }]
    setOwnedPlayers(next)
    if (userId) void saveTeam(supabase, userId, money, next, levelUpCount).catch(() => setError('Não foi possível salvar o jogador.'))
    return null
  }

  const removePlayer = (playerId: string) => {
    const next = ownedPlayers.filter((player) => player.id !== playerId)
    setOwnedPlayers(next)
    if (userId) void saveTeam(supabase, userId, money, next, levelUpCount).catch(() => setError('Não foi possível remover o jogador.'))
  }

  const addWinner = async (name: string) => {
    const normalizedName = name.trim()
    if (!normalizedName) return 'Informe o nome do vencedor.'
    try { setWinners(await saveWinner(supabase, normalizedName)) } catch { return 'Não foi possível salvar o vencedor.' }
    return null
  }

  const addWin = async (winnerId: string) => {
    try { setWinners(await addWinnerWin(supabase, winnerId)) } catch { setError('Não foi possível adicionar a vitória.') }
  }

  const removeWinner = async (winnerId: string) => {
    try { setWinners(await deleteWinner(supabase, winnerId)) } catch { setError('Não foi possível remover o vencedor.') }
  }

  if (page === 'home') return <HomePage onNavigate={navigateTo} money={money} ownedPlayers={ownedPlayers} onUpdateMoney={updateMoney} onRemovePlayer={removePlayer} onAddPlayer={addPlayer} />
  if (page === 'npc') return <NpcDrawPage onNavigate={navigateTo} />
  if (page === 'items') return <ItemsPage onNavigate={navigateTo} userId={userId} />
  if (page === 'winners') return <WinnersPage onNavigate={navigateTo} winners={winners} isAdmin={isAdmin} onAddWinner={addWinner} onAddWin={addWin} onRemoveWinner={removeWinner} />
  if (page === 'rules') return <RulesPage onNavigate={navigateTo} />
  return <HomePage onNavigate={navigateTo} money={money} ownedPlayers={ownedPlayers} onUpdateMoney={updateMoney} onRemovePlayer={removePlayer} onAddPlayer={addPlayer} />
}
