import { useEffect, useMemo, useState } from 'react'
import { fetchPlayers } from './services/playersApi'
import type { FootballPlayer, PlayerPosition, TeamPlayer } from './types/game'
import { getPositionLabel, getSkillLabel } from './utils/gameRules'
import { NpcDrawPage } from './components/NpcDrawPage'
import { HomePage } from './components/HomePage'
import { AppHeader } from './components/AppHeader'
import { ItemsPage } from './components/ItemsPage'
import { WinnersPage, WinnersPasswordPage } from './components/WinnersPage'
import { RulesPage } from './components/RulesPage'
import type { WinnerRecord } from './components/WinnersPage'
import { addWinnerWin, deleteWinner, fetchWinners, saveWinner } from './services/winnersApi'
import './App.css'

const positionOptions: Array<PlayerPosition | 'TODAS'> = ['TODAS', 'GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA']
const moneyStorageKey = 'deck-fc:team-money'
const ownedPlayersStorageKey = 'deck-fc:team-players'

function getStoredMoney() {
  const value = Number(window.localStorage.getItem(moneyStorageKey))
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function getStoredOwnedPlayers(): TeamPlayer[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(ownedPlayersStorageKey) || '[]') as unknown
    return Array.isArray(value) ? value.filter((player): player is TeamPlayer => typeof player === 'object' && player !== null && typeof player.id === 'string' && Number.isInteger(player.skill) && Number.isFinite(player.value) && ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'].includes(player.assignedPosition)) : []
  } catch {
    return []
  }
}

function PlayerCard({ player }: { player: FootballPlayer }) {
  return <article className="card">
    <div className="card-top"><span className="card-id">#{player.id.replace('player-', '')}</span><span className="card-rarity">{getSkillLabel(player.skill)}</span></div>
    <div className="card-avatar">{player.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
    <span className="card-position">{player.positions.join(' · ')}</span>
    <h2>{player.name}</h2><p>{player.nationality} · {player.age} anos</p>
    <div className="card-stats"><div><strong>{player.skill}</strong><span>HABILIDADE</span></div><div><strong>€ {player.value} mi</strong><span>VALOR</span></div></div>
    <div className="position-list">{player.positions.map((position) => <span key={position}>{getPositionLabel(position)}</span>)}</div>
  </article>
}

export default function App() {
  const [page, setPage] = useState<'home' | 'catalog' | 'npc' | 'items' | 'winners' | 'rules'>(() => {
    if (window.location.hash === '#sorteio-npc') return 'npc'
    if (window.location.hash === '#catalogo') return 'catalog'
    if (window.location.hash === '#itens') return 'items'
    if (window.location.hash === '#vencedores') return 'winners'
    if (window.location.hash === '#regras') return 'rules'
    return 'home'
  })
  const [players, setPlayers] = useState<FootballPlayer[]>([])
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState<PlayerPosition | 'TODAS'>('TODAS')
  const [minSkill, setMinSkill] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [sort, setSort] = useState<'skill' | 'value'>('skill')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [money, setMoney] = useState(getStoredMoney)
  const [ownedPlayers, setOwnedPlayers] = useState<TeamPlayer[]>(getStoredOwnedPlayers)
  const [winners, setWinners] = useState<WinnerRecord[]>([])
  const [winnersUnlocked, setWinnersUnlocked] = useState(false)

  useEffect(() => {
    fetchPlayers().then(setPlayers).catch(() => setError('Não foi possível carregar o catálogo de cartas.')).finally(() => setLoading(false))
    fetchWinners().then(setWinners).catch(() => setError('Não foi possível carregar o histórico de vencedores.'))
  }, [])

  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => !search || player.name.toLowerCase().includes(search.toLowerCase()))
      .filter((player) => position === 'TODAS' || player.positions.includes(position))
      .filter((player) => !minSkill || player.skill >= Number(minSkill))
      .filter((player) => !maxValue || player.value <= Number(maxValue))
      .sort((a, b) => sort === 'skill' ? b.skill - a.skill || b.value - a.value : b.value - a.value || b.skill - a.skill)
  }, [players, search, position, minSkill, maxValue, sort])

  const navigateTo = (nextPage: 'home' | 'catalog' | 'npc' | 'items' | 'winners' | 'rules') => {
    setPage(nextPage)
    const hash = nextPage === 'npc' ? '#sorteio-npc' : nextPage === 'catalog' ? '#catalogo' : nextPage === 'items' ? '#itens' : nextPage === 'winners' ? '#vencedores' : nextPage === 'rules' ? '#regras' : '#home'
    window.history.replaceState(null, '', hash)
  }

  const updateMoney = (amount: number) => {
    setMoney((current) => {
      const next = Math.max(0, current + amount)
      window.localStorage.setItem(moneyStorageKey, String(next))
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
    window.localStorage.setItem(ownedPlayersStorageKey, JSON.stringify(next))
    return null
  }

  const removePlayer = (playerId: string) => {
    const next = ownedPlayers.filter((player) => player.id !== playerId)
    setOwnedPlayers(next)
    window.localStorage.setItem(ownedPlayersStorageKey, JSON.stringify(next))
  }

  const addWinner = async (name: string) => {
    const normalizedName = name.trim()
    if (!normalizedName) return 'Informe o nome do vencedor.'
    try { setWinners(await saveWinner(normalizedName)) } catch { return 'Não foi possível salvar o vencedor.' }
    return null
  }

  const addWin = async (winnerId: string) => {
    try { setWinners(await addWinnerWin(winnerId)) } catch { setError('Não foi possível adicionar a vitória.') }
  }

  const removeWinner = async (winnerId: string) => {
    try { setWinners(await deleteWinner(winnerId)) } catch { setError('Não foi possível remover o vencedor.') }
  }

  if (page === 'home') return <HomePage onNavigate={navigateTo} money={money} ownedPlayers={ownedPlayers} onUpdateMoney={updateMoney} onRemovePlayer={removePlayer} onAddPlayer={addPlayer} />
  if (page === 'npc') return <NpcDrawPage onNavigate={navigateTo} />
  if (page === 'items') return <ItemsPage onNavigate={navigateTo} />
  if (page === 'winners' && !winnersUnlocked) return <WinnersPasswordPage onNavigate={navigateTo} onUnlock={() => setWinnersUnlocked(true)} />
  if (page === 'winners') return <WinnersPage onNavigate={navigateTo} winners={winners} onAddWinner={addWinner} onAddWin={addWin} onRemoveWinner={removeWinner} />
  if (page === 'rules') return <RulesPage onNavigate={navigateTo} />

  return <main className="catalog-shell">
    <AppHeader activePage="catalog" onNavigate={navigateTo} />
    <section className="hero"><div><span className="eyebrow">FOOTBALL DECK BUILDING · TEMPORADA 01</span><h1>Encontre as cartas<br /><em>que definem o jogo.</em></h1><p>Explore o catálogo completo de jogadores e monte sua estratégia. Cada carta tem uma identidade, um valor e posições únicas.</p></div><div className="hero-total"><strong>{players.length || '—'}</strong><span>CARTAS DISPONÍVEIS</span><small>Dados carregados pela API fake local</small></div></section>
    <section className="toolbar"><label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome..." /></label><select value={position} onChange={(event) => setPosition(event.target.value as PlayerPosition | 'TODAS')} aria-label="Filtrar por posição">{positionOptions.map((item) => <option key={item} value={item}>{item === 'TODAS' ? 'Todas as posições' : item}</option>)}</select><select value={minSkill} onChange={(event) => setMinSkill(event.target.value)} aria-label="Habilidade mínima"><option value="">Qualquer habilidade</option><option value="15">Habilidade 15+</option><option value="18">Habilidade 18+</option><option value="20">Habilidade 20+</option></select><select value={maxValue} onChange={(event) => setMaxValue(event.target.value)} aria-label="Valor máximo"><option value="">Qualquer valor</option><option value="20">Até € 20 mi</option><option value="40">Até € 40 mi</option><option value="60">Até € 60 mi</option></select><select value={sort} onChange={(event) => setSort(event.target.value as 'skill' | 'value')} aria-label="Ordenar cartas"><option value="skill">Maior habilidade</option><option value="value">Maior valor</option></select></section>
    <div className="catalog-heading"><div><h2>Cartas de jogadores <span>{filteredPlayers.length}</span></h2><p>Visualização do catálogo · Somente leitura</p></div><div className="api-badge"><i /> API FAKE · ONLINE</div></div>
    {error && <div className="error">{error}</div>}{loading ? <div className="loading">Consultando /api/players...</div> : <section className="cards-grid">{filteredPlayers.map((player) => <PlayerCard key={player.id} player={player} />)}</section>}
    <footer>O catálogo é imutável nesta etapa. Sorteios, aquisição, decks e partidas serão definidos posteriormente.</footer>
  </main>
}
