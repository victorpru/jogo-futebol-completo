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
import { deleteSponsorDraw, fetchSponsorDraws, saveItemDrawState } from './services/itemDrawApi'
import './App.css'

export default function App() {
  const [page, setPage] = useState<'home' | 'npc' | 'items' | 'winners' | 'rules'>(() => {
    if (window.location.hash === '#sorteio-npc') return 'npc'
    if (window.location.hash === '#itens' || window.location.hash === '#itens-level-up') return 'items'
    if (window.location.hash === '#vencedores') return 'winners'
    if (window.location.hash === '#regras') return 'rules'
    return 'home'
  })
  const [, setError] = useState<string | null>(null)
  const [money, setMoney] = useState(300)
  const [ownedPlayers, setOwnedPlayers] = useState<TeamPlayer[]>([])
  const [levelUpCount, setLevelUpCount] = useState(0)
  const [hasClaimedBudgetBonus, setHasClaimedBudgetBonus] = useState(false)
  const [isBudgetBonusActive, setIsBudgetBonusActive] = useState(false)
  const [requestedItemDraw, setRequestedItemDraw] = useState<'investment' | 'prizes' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [winners, setWinners] = useState<WinnerRecord[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const teamPower = ownedPlayers.reduce((total, player) => total + player.skill, 0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAdmin(data.user?.email === 'prudencio.vic@gmail.com'))
    fetchWinners(supabase).then(setWinners).catch(() => setError('Não foi possível carregar o histórico de vencedores.'))
    let active = true
    const loadTeam = async (nextUserId: string | null) => {
      if (!nextUserId) {
        if (active) {
          setUserId(null)
          setMoney(300)
          setOwnedPlayers([])
          setLevelUpCount(0)
          setHasClaimedBudgetBonus(false)
          setIsBudgetBonusActive(false)
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
          setHasClaimedBudgetBonus(team.hasClaimedBudgetBonus)
          setIsBudgetBonusActive(team.isBudgetBonusActive)
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
    if (nextPage !== 'items') setRequestedItemDraw(null)
    const hash = nextPage === 'npc' ? '#sorteio-npc' : nextPage === 'items' ? '#itens' : nextPage === 'winners' ? '#vencedores' : nextPage === 'rules' ? '#regras' : '#home'
    window.history.replaceState(null, '', hash)
  }

  const claimBudgetBonus = () => {
    if (hasClaimedBudgetBonus) return
    const nextMoney = money + 100
    setMoney(nextMoney)
    setHasClaimedBudgetBonus(true)
    setIsBudgetBonusActive(true)
    if (userId) void saveTeam(supabase, userId, nextMoney, ownedPlayers, levelUpCount, true, true).catch(() => setError('Não foi possível adicionar o bônus ao orçamento.'))
  }

  const removeBudgetBonus = () => {
    if (!isBudgetBonusActive || !window.confirm('Remover os € 100 milhões do bônus do caixa?')) return
    const nextMoney = money - 100
    setMoney(nextMoney)
    setHasClaimedBudgetBonus(false)
    setIsBudgetBonusActive(false)
    if (userId) void saveTeam(supabase, userId, nextMoney, ownedPlayers, levelUpCount, false, false).catch(() => setError('Não foi possível remover o bônus do orçamento.'))
  }

  const addPlayer = (skill: number, value: number, assignedPosition: PlayerPosition) => {
    if (ownedPlayers.length >= 11) return 'O time já possui 11 jogadores.'
    if (!Number.isInteger(skill) || skill < 11 || skill > 21) return 'O poder deve ser um número inteiro entre 11 e 21.'
    if (!Number.isFinite(value) || value < 2 || value > 70) return 'O valor deve estar entre € 2 e € 70 milhões.'
    if (value > money) return 'O caixa do time não possui saldo suficiente para este jogador.'
    const positionCount = ownedPlayers.filter((player) => player.assignedPosition === assignedPosition).length
    const vacancies = { GOL: 1, ZAG: 2, LAT: 2, VOL: 1, MEI: 2, ATA: 3 }
    if (positionCount >= vacancies[assignedPosition]) return `Não há mais vaga disponível para ${assignedPosition}.`
    const next = [...ownedPlayers, { id: `team-player-${Date.now()}`, skill, value, assignedPosition }]
    const nextMoney = money - value
    setOwnedPlayers(next)
    setMoney(nextMoney)
    if (userId) void saveTeam(supabase, userId, nextMoney, next, levelUpCount, hasClaimedBudgetBonus, isBudgetBonusActive).catch(() => setError('Não foi possível salvar o jogador.'))
    return null
  }

  const removePlayer = (playerId: string) => {
    const player = ownedPlayers.find((item) => item.id === playerId)
    if (!player) return
    const next = ownedPlayers.filter((item) => item.id !== playerId)
    const nextMoney = money + player.value
    setOwnedPlayers(next)
    setMoney(nextMoney)
    if (userId) void saveTeam(supabase, userId, nextMoney, next, levelUpCount, hasClaimedBudgetBonus, isBudgetBonusActive).catch(() => setError('Não foi possível remover o jogador.'))
  }

  const removeAllPlayers = () => {
    if (ownedPlayers.length === 0 || !window.confirm('Retirar todos os jogadores e devolver os valores ao caixa?')) return
    const recoveredValue = ownedPlayers.reduce((total, player) => total + player.value, 0)
    const nextMoney = money + recoveredValue
    setOwnedPlayers([])
    setMoney(nextMoney)
    if (userId) void saveTeam(supabase, userId, nextMoney, [], levelUpCount, hasClaimedBudgetBonus, isBudgetBonusActive).catch(() => setError('Não foi possível retirar todos os jogadores.'))
  }

  const resetBudget = async () => {
    if (!window.confirm('Resetar prêmios, patrocínios e bônus? O caixa ficará em € 300 milhões menos o valor dos jogadores.')) return
    const playersValue = ownedPlayers.reduce((total, player) => total + player.value, 0)
    const nextMoney = 300 - playersValue
    setMoney(nextMoney)
    setHasClaimedBudgetBonus(false)
    setIsBudgetBonusActive(false)
    if (!userId) return
    try {
      await saveTeam(supabase, userId, nextMoney, ownedPlayers, levelUpCount, false, false)
      const sponsorDraws = await fetchSponsorDraws(supabase)
      await Promise.all(sponsorDraws.filter((draw) => draw.userId === userId).map((draw) => deleteSponsorDraw(supabase, draw)))
      await saveItemDrawState(supabase, userId, {
        levelUpTotal: 0,
        levelUpRemaining: [],
        blueRemaining: [4, 6, 6, 7, 8, 10, 12, 15, 15],
        yellowRemaining: [3, 4, 6, 7, 8, 8, 10, 10, 11, 12, 12, 14, 15, 16, 16, 18, 18, 20, 20, 20, 22, 22, 24, 25, 30],
        sponsorshipMoneyClaimed: 0,
      })
    } catch {
      setError('Não foi possível resetar os prêmios e patrocínios.')
    }
  }

  const addPrizeMoney = (amount: number) => {
    if (!userId || !Number.isFinite(amount) || amount <= 0) return
    const nextMoney = money + amount
    setMoney(nextMoney)
    void saveTeam(supabase, userId, nextMoney, ownedPlayers, levelUpCount, hasClaimedBudgetBonus, isBudgetBonusActive)
      .catch(() => setError('Não foi possível adicionar o prêmio ao caixa.'))
  }

  const openItemDraw = (type: 'investment' | 'prizes') => {
    setRequestedItemDraw(type)
  }

  const openLevelUpSetup = () => {
    window.open(`${window.location.origin}${window.location.pathname}#itens-level-up`, '_blank', 'noopener,noreferrer')
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

  if (page === 'home') return <><HomePage onNavigate={navigateTo} userId={userId} onAddPrizeMoney={addPrizeMoney} onOpenItemDraw={openItemDraw} money={money} teamPower={teamPower} ownedPlayers={ownedPlayers} hasClaimedBudgetBonus={hasClaimedBudgetBonus} isBudgetBonusActive={isBudgetBonusActive} onClaimBudgetBonus={claimBudgetBonus} onRemoveBudgetBonus={removeBudgetBonus} onResetBudget={resetBudget} onRemoveAllPlayers={removeAllPlayers} onRemovePlayer={removePlayer} onAddPlayer={addPlayer} /><ItemsPage onNavigate={navigateTo} userId={userId} money={money} teamPower={teamPower} onPrizeMoney={addPrizeMoney} openItemDraw={requestedItemDraw} onItemDrawOpened={() => setRequestedItemDraw(null)} onItemDrawNeedsSetup={openLevelUpSetup} modalOnly /></>
  if (page === 'npc') return <NpcDrawPage onNavigate={navigateTo} userId={userId} money={money} teamPower={teamPower} onPrizeMoney={addPrizeMoney} />
  if (page === 'items') return <ItemsPage onNavigate={navigateTo} userId={userId} money={money} teamPower={teamPower} onPrizeMoney={addPrizeMoney} openItemDraw={requestedItemDraw} onItemDrawOpened={() => setRequestedItemDraw(null)} initialTab={window.location.hash === '#itens-level-up' ? 'level-up' : 'draws'} />
  if (page === 'winners') return <WinnersPage onNavigate={navigateTo} money={money} teamPower={teamPower} winners={winners} isAdmin={isAdmin} onAddWinner={addWinner} onAddWin={addWin} onRemoveWinner={removeWinner} />
  if (page === 'rules') return <RulesPage onNavigate={navigateTo} money={money} teamPower={teamPower} />
  return <HomePage onNavigate={navigateTo} userId={userId} onAddPrizeMoney={addPrizeMoney} onOpenItemDraw={openItemDraw} money={money} teamPower={teamPower} ownedPlayers={ownedPlayers} hasClaimedBudgetBonus={hasClaimedBudgetBonus} isBudgetBonusActive={isBudgetBonusActive} onClaimBudgetBonus={claimBudgetBonus} onRemoveBudgetBonus={removeBudgetBonus} onResetBudget={resetBudget} onRemoveAllPlayers={removeAllPlayers} onRemovePlayer={removePlayer} onAddPlayer={addPlayer} />
}
