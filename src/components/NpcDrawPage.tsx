import { useEffect, useMemo, useState } from 'react'
import { npcTeams } from '../data/npcTeams'
import { drawNpcPlayers, getDrawnPower } from '../utils/npcDraw'
import type { NpcDrawnPlayer } from '../types/npcTeam'
import { addDrawParticipant, fetchDrawParticipants, removeDrawParticipant, type DrawParticipant } from '../services/participantDrawApi'
import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'
import { supabase } from '../lib/supabase'
import { fetchItemDrawState, saveItemDrawState } from '../services/itemDrawApi'
import type { ItemDrawState } from './ItemsPage'
import { fetchNpcTournamentState, saveNpcTournamentState, type NpcTournamentSnapshot } from '../services/npcTournamentApi'
import { allNpcTeamNames, brasileiroTeams, copaDoBrasilTeams, libertadoresFixedTeams, mundialTeams, npcTournaments, paulistaTeams, type NpcTournamentId } from '../data/npcTournaments'

const prizeValues = [7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12, 12, 15, 15, 15, 15, 18, 18, 20, 20, 20, 20, 25, 25]
const championshipRewards = {
  Paulista: [10, 10, 5],
  'Copa do Brasil': [15, 15, 7],
  Brasileiro: [20, 20, 10],
  Libertadores: [25, 25, 12],
} as const
type Championship = keyof typeof championshipRewards
type NpcDrawTab = 'teams' | 'tournaments'
type MatchResolution = {
  roundIndex: number
  matchIndex: number
  teams: [{ name: string; power: number }, { name: string; power: number }]
  stronger: { name: string; power: number }
  weaker: { name: string; power: number }
  difference: number
  roll: number | null
  winner: string | null
}

function shuffleTeams<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }
  return shuffled
}

function normalizeTeamName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

function findNpcTeam(name: string) {
  const aliases: Record<string, string> = {
    atleticomineiro: 'Atlético-MG',
    athleticoparanaense: 'Athletico-PR',
    vascodagama: 'Vasco',
    bayerndemunchent: 'Bayern de Munique',
  }
  const normalizedName = normalizeTeamName(name)
  const catalogName = aliases[normalizedName] ?? name
  const normalizedCatalogName = normalizeTeamName(catalogName)
  return npcTeams.find((item) => normalizeTeamName(item.name) === normalizedCatalogName)
}

function buildTournamentTeams(fixedTeamNames: readonly string[], participants: DrawParticipant[], teamCount: number) {
  const participantNames = new Set(participants.map((participant) => participant.name))
  const participantTeams = participants.map((participant) => ({
    name: participant.name,
    color: null,
    isUser: true,
  }))
  const remainingTeams = fixedTeamNames
    .filter((name) => !participantNames.has(name))
    .map((name) => ({ name, color: null, isUser: false }))
  return [...participantTeams, ...remainingTeams].slice(0, teamCount)
}

export function NpcDrawPage({ onNavigate, userId, money, teamPower, onPrizeMoney }: { onNavigate: (page: HeaderPage) => void; userId: string | null; money: number; teamPower: number; onPrizeMoney: (amount: number) => void }) {
  const [activeTab, setActiveTab] = useState<NpcDrawTab>('teams')
  const [teamId, setTeamId] = useState(npcTeams[0].id)
  const [drawn, setDrawn] = useState<NpcDrawnPlayer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [drawOrder, setDrawOrder] = useState<NpcDrawnPlayer[]>([])
  const [upgrades, setUpgrades] = useState<number[]>(() => Array.from({ length: npcTeams[0].playerPowers.length }, () => 0))
  const [participants, setParticipants] = useState<DrawParticipant[]>([])
  const [participantName, setParticipantName] = useState('')
  const [participantError, setParticipantError] = useState<string | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false)
  const [prizeState, setPrizeState] = useState<ItemDrawState | null>(null)
  const [prizeResult, setPrizeResult] = useState<number | 'LEVEL-UP' | null>(null)
  const [prizeError, setPrizeError] = useState<string | null>(null)
  const [championship, setChampionship] = useState<Championship>('Paulista')
  const [selectedTournamentId, setSelectedTournamentId] = useState<NpcTournamentId>('paulista')
  const [shuffleVersion, setShuffleVersion] = useState(0)
  const [bracketWinners, setBracketWinners] = useState<Record<string, string>>({})
  const [libertadoresTeams, setLibertadoresTeams] = useState<string[]>([...libertadoresFixedTeams])
  const [libertadoresTeamToAdd, setLibertadoresTeamToAdd] = useState('')
  const [mundialOpponent, setMundialOpponent] = useState<(typeof mundialTeams)[number] | null>(null)
  const [matchResolution, setMatchResolution] = useState<MatchResolution | null>(null)
  const [savedTournamentState, setSavedTournamentState] = useState<NpcTournamentSnapshot>({ teams: {}, winners: {}, libertadoresTeams: [...libertadoresFixedTeams], mundialOpponent: null })
  const [isTournamentStateLoaded, setIsTournamentStateLoaded] = useState(false)
  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId)
  const team = useMemo(() => {
    if (selectedParticipant) {
      return { id: selectedParticipant.id, name: selectedParticipant.name, playerPowers: Array.from({ length: 11 }, () => 0), power: 0 }
    }
    return npcTeams.find((item) => item.id === teamId) ?? npcTeams[0]
  }, [selectedParticipant, teamId])
  const sortedTeams = useMemo(() => [...npcTeams].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [])
  const currentPlayer = drawOrder[currentIndex]
  const nextPlayer = drawOrder[currentIndex + 1]
  const canAdvance = currentIndex < drawn.length - 1 || Boolean(nextPlayer)

  const openDraw = () => {
    setDrawn([])
    setDrawOrder(drawNpcPlayers(team, upgrades))
    setCurrentIndex(-1)
    setIsModalOpen(true)
  }

  const drawTeam = () => {
    const availableTeams = [
      ...npcTeams.map((item) => ({ type: 'npc' as const, item })),
      ...participants.map((item) => ({ type: 'participant' as const, item })),
    ]
    const selected = availableTeams[Math.floor(Math.random() * availableTeams.length)]
    if (!selected) return
    if (selected.type === 'participant') {
      setSelectedParticipantId(selected.item.id)
      setDrawn([])
      setDrawOrder([])
      setCurrentIndex(0)
      setUpgrades(Array.from({ length: 11 }, () => 0))
      setIsModalOpen(false)
      return
    }
    const randomTeam = selected.item
    if (!randomTeam) return
    setSelectedParticipantId(null)
    setTeamId(randomTeam.id)
    setDrawn([])
    setDrawOrder([])
    setCurrentIndex(0)
    setUpgrades(Array.from({ length: randomTeam.playerPowers.length }, () => 0))
    setIsModalOpen(false)
  }

  const showNextPlayer = () => {
    if (currentIndex < drawn.length - 1) {
      setCurrentIndex((current) => current + 1)
      return
    }
    if (!nextPlayer) return
    setDrawn((current) => [...current, nextPlayer])
    setCurrentIndex((current) => current + 1)
  }

  const showPreviousPlayer = () => {
    if (currentIndex < 0) return
    setCurrentIndex((current) => current - 1)
  }

  const closeDraw = () => setIsModalOpen(false)
  const addUpgrade = (index: number) => {
    setUpgrades((current) => current.map((value, upgradeIndex) => upgradeIndex === index ? value + 1 : value))
  }
  const resetUpgrades = () => setUpgrades(Array.from({ length: team.playerPowers.length }, () => 0))
  const upgradeTotal = upgrades.reduce((total, value) => total + value, 0)
  const upgradedPower = team.power + upgradeTotal
  const selectedTournament = npcTournaments.find((item) => item.id === selectedTournamentId) ?? npcTournaments[0]
  const bracketTeamCount = selectedTournament.teamCount ?? 16
  const bracketRounds = Array.from({ length: Math.log2(bracketTeamCount) }, (_, roundIndex) => Math.max(1, bracketTeamCount / 2 ** (roundIndex + 1)))
  const bracketRoundNames = bracketTeamCount === 8 ? ['Quartas de final', 'Semifinal', 'Final'] : ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final']
  const bracketTeams = useMemo(() => {
    if (selectedTournament.id === 'libertadores') {
      const savedTeams = savedTournamentState.teams.libertadores
      if (savedTeams) return savedTeams
      return shuffleTeams([
        ...libertadoresTeams.map((name) => ({
          name,
          color: null,
          isUser: participants.some((participant) => participant.name === name),
        })),
      ])
    }
    if (selectedTournament.id === 'mundial') return []
    if (selectedTournament.id !== 'paulista' && selectedTournament.id !== 'copa-do-brasil' && selectedTournament.id !== 'brasileiro') return []
    const fixedTeams = selectedTournament.id === 'paulista'
      ? paulistaTeams
      : selectedTournament.id === 'copa-do-brasil'
        ? copaDoBrasilTeams
        : brasileiroTeams
    const tournamentTeams = buildTournamentTeams(fixedTeams, participants, bracketTeamCount)
    const savedTeams = savedTournamentState.teams[selectedTournament.id]
    const expectedNames = new Set(tournamentTeams.map((team) => team.name))
    if (savedTeams && savedTeams.length === tournamentTeams.length && savedTeams.every((team) => expectedNames.has(team.name))) {
      return savedTeams.map((team) => ({ ...team, color: null, isUser: team.isUser ?? participants.some((participant) => participant.name === team.name) }))
    }
    return shuffleTeams(tournamentTeams)
  }, [participants, selectedTournament.id, bracketTeamCount, shuffleVersion, libertadoresTeams, savedTournamentState.teams])
  const mundialBracketTeams = useMemo(() => {
    if (selectedTournament.id !== 'mundial') return []
    const libertadoresChampion = savedTournamentState.winners.libertadores?.['2-0']
    return [
      { name: libertadoresChampion ?? 'Campeão da Libertadores', color: null },
      { name: mundialOpponent ?? 'Adversário a sortear', color: null },
    ]
  }, [selectedTournament.id, savedTournamentState.winners, mundialOpponent])

  useEffect(() => {
    fetchNpcTournamentState(supabase)
      .then((state) => {
        const nextState = state ?? { teams: {}, winners: {}, libertadoresTeams: [...libertadoresFixedTeams], mundialOpponent: null }
        setSavedTournamentState(nextState)
        setBracketWinners(nextState.winners[selectedTournamentId] ?? {})
        setLibertadoresTeams(nextState.libertadoresTeams.length > 0 ? nextState.libertadoresTeams : [...libertadoresFixedTeams])
        setMundialOpponent(nextState.mundialOpponent as (typeof mundialTeams)[number] | null)
          setIsTournamentStateLoaded(true)
        })
      .catch(() => setPrizeError('Não foi possível carregar o chaveamento salvo.'))
  }, [])

  useEffect(() => {
    if (!isTournamentStateLoaded || !userId) return
    const savedTeams = savedTournamentState.teams[selectedTournamentId]
    const hasCurrentTeams = savedTeams?.length === bracketTeams.length
      && savedTeams.every((team, index) => team.name === bracketTeams[index]?.name)
    if (!hasCurrentTeams && bracketTeams.length > 0) {
      setSavedTournamentState((current) => ({ ...current, teams: { ...current.teams, [selectedTournamentId]: bracketTeams } }))
      return
    }
    void saveNpcTournamentState(supabase, savedTournamentState).catch(() => setPrizeError('Não foi possível salvar o chaveamento.'))
  }, [bracketTeams, isTournamentStateLoaded, savedTournamentState, selectedTournamentId, userId])
  const libertadoresTeamOptions = [...new Set([...allNpcTeamNames, ...participants.map((participant) => participant.name)])]
    .filter((name) => !libertadoresTeams.includes(name))
  const addLibertadoresTeam = () => {
    if (!libertadoresTeamToAdd || libertadoresTeams.length >= bracketTeamCount) return
    setLibertadoresTeams((current) => current.includes(libertadoresTeamToAdd) ? current : [...current, libertadoresTeamToAdd])
    setSavedTournamentState((state) => ({ ...state, libertadoresTeams: [...libertadoresTeams, libertadoresTeamToAdd], teams: { ...state.teams, libertadores: undefined }, winners: { ...state.winners, libertadores: {} } }))
    setLibertadoresTeamToAdd('')
    setBracketWinners({})
  }
  const drawMundialOpponent = () => {
    const opponent = mundialTeams[Math.floor(Math.random() * mundialTeams.length)]
    setMundialOpponent(opponent)
    setSavedTournamentState((state) => ({ ...state, mundialOpponent: opponent }))
  }
  const getBracketSlot = (roundIndex: number, matchIndex: number, slotIndex: number) => {
    if (roundIndex === 0) return bracketTeams[matchIndex * 2 + slotIndex]?.name
    return bracketWinners[`${roundIndex - 1}-${matchIndex * 2 + slotIndex}`]
  }
  const isMatchReady = (roundIndex: number, matchIndex: number) =>
    Boolean(getBracketSlot(roundIndex, matchIndex, 0) && getBracketSlot(roundIndex, matchIndex, 1))
  const selectBracketWinner = (roundIndex: number, matchIndex: number, name: string) => {
    if (!isMatchReady(roundIndex, matchIndex)) return
    const next = Object.fromEntries(Object.entries(bracketWinners).filter(([key]) => Number(key.split('-')[0]) <= roundIndex))
    next[`${roundIndex}-${matchIndex}`] = name
    setBracketWinners(next)
    setSavedTournamentState((state) => ({ ...state, winners: { ...state.winners, [selectedTournamentId]: next } }))
  }
  const openMatchResolution = (roundIndex: number, matchIndex: number, selectedName: string) => {
    const names = [getBracketSlot(roundIndex, matchIndex, 0), getBracketSlot(roundIndex, matchIndex, 1)]
    if (!names[0] || !names[1]) return
    const teamsInBracket = names.map((name) => bracketTeams.find((team) => team.name === name))
    if (teamsInBracket.some((team) => team?.isUser)) {
      selectBracketWinner(roundIndex, matchIndex, selectedName)
      return
    }
    const teams = names.map((name) => {
      const team = findNpcTeam(name)
      return { name, power: team?.power ?? 0 }
    })
    const stronger = teams[0].power >= teams[1].power ? teams[0] : teams[1]
    const weaker = stronger === teams[0] ? teams[1] : teams[0]
    setMatchResolution({
      roundIndex,
      matchIndex,
      teams: [teams[0], teams[1]],
      stronger,
      weaker,
      difference: stronger.power - weaker.power,
      roll: null,
      winner: null,
    })
  }
  const resolveMatch = () => {
    if (!matchResolution) return
    const { difference, stronger, weaker } = matchResolution
    if (difference >= 16) {
      setMatchResolution((current) => current ? { ...current, winner: stronger.name } : current)
      return
    }
    const roll = Math.floor(Math.random() * 6) + 1
    const strongerWins = difference <= 5 ? roll <= 3 : difference <= 10 ? roll <= 4 : roll <= 5
    setMatchResolution((current) => current ? { ...current, roll, winner: strongerWins ? stronger.name : weaker.name } : current)
  }
  const confirmMatchResolution = () => {
    if (!matchResolution?.winner) return
    selectBracketWinner(matchResolution.roundIndex, matchResolution.matchIndex, matchResolution.winner)
    setMatchResolution(null)
  }
  const resetTournamentResults = () => {
    if (selectedTournamentId === 'libertadores') {
      const resetTeams = shuffleTeams(libertadoresFixedTeams.map((name) => ({ name, color: null, isUser: false })))
      setLibertadoresTeams([...libertadoresFixedTeams])
      setLibertadoresTeamToAdd('')
      setBracketWinners({})
      setSavedTournamentState((state) => ({
        ...state,
        teams: { ...state.teams, libertadores: resetTeams },
        winners: { ...state.winners, libertadores: {} },
        libertadoresTeams: [...libertadoresFixedTeams],
        mundialOpponent: null,
      }))
      setMundialOpponent(null)
      setShuffleVersion((version) => version + 1)
      setMatchResolution(null)
      return
    }
    setBracketWinners({})
    setSavedTournamentState((state) => ({
      ...state,
      winners: {},
      mundialOpponent: null,
    }))
    setMundialOpponent(null)
    setMatchResolution(null)
  }
  const reshuffleBracket = () => {
    setBracketWinners({})
    setSavedTournamentState((state) => ({ ...state, teams: { ...state.teams, [selectedTournamentId]: shuffleTeams(bracketTeams) }, winners: { ...state.winners, [selectedTournamentId]: {} } }))
    setShuffleVersion((version) => version + 1)
  }

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setParticipants(await fetchDrawParticipants(supabase))
      } catch {
        setParticipantError('Não foi possível carregar os participantes.')
      }
    }
    void loadParticipants()
  }, [])

  useEffect(() => {
    if (!userId) {
      setPrizeState(null)
      return
    }
    fetchItemDrawState(supabase, userId)
      .then((state) => setPrizeState(state ?? { levelUpTotal: 0, levelUpRemaining: [], blueRemaining: [], yellowRemaining: [], sponsorshipMoneyClaimed: 0 }))
      .catch(() => setPrizeError('Não foi possível carregar os prêmios.'))
  }, [userId])

  const addParticipant = async () => {
    const name = participantName.trim()
    if (!name) {
      setParticipantError('Digite o nome do participante.')
      return
    }
    try {
      const participant = await addDrawParticipant(supabase, name)
      setParticipants((current) => [...current, participant])
      setParticipantName('')
      setParticipantError(null)
    } catch {
      setParticipantError('Não foi possível adicionar o participante.')
    }
  }

  const removeParticipant = async (id: string) => {
    try {
      await removeDrawParticipant(supabase, id)
      setParticipants((current) => current.filter((participant) => participant.id !== id))
    } catch {
      setParticipantError('Não foi possível remover o participante.')
    }
  }

  const openPrizeModal = () => {
    setPrizeResult(null)
    setPrizeError(null)
    setIsPrizeModalOpen(true)
  }

  const drawPrize = () => {
    if (!prizeState || prizeResult !== null) return
    const options: Array<number | 'LEVEL-UP'> = [...prizeValues, ...prizeState.levelUpRemaining.map(() => 'LEVEL-UP' as const)]
    const result = options[Math.floor(Math.random() * options.length)]
    if (result === undefined) return
    setPrizeResult(result)
    if (typeof result === 'number') onPrizeMoney(result)
    if (result === 'LEVEL-UP' && userId) {
      const nextState = { ...prizeState, levelUpRemaining: prizeState.levelUpRemaining.slice(1) }
      setPrizeState(nextState)
      void saveItemDrawState(supabase, userId, nextState).catch(() => setPrizeError('O prêmio foi revelado, mas não foi possível salvar o LEVEL-UP.'))
    }

  }

  const awardChampionship = (place: 1 | 2 | 3) => {
    const fixedReward = championshipRewards[championship][place - 1]
    onPrizeMoney(fixedReward)
    if (place === 1) openPrizeModal()
  }

  return <main className="npc-page">
    <AppHeader activePage="npc" onNavigate={onNavigate} money={money} teamPower={teamPower} />
    <section className="npc-hero"><div className="npc-rule"><strong>11</strong><span>JOGADORES POR TIME</span><small>Distribuição baseada na tabela de referência</small></div></section>
    <nav className="npc-tabs" aria-label="Seções do sorteio de NPC">
      <button className={activeTab === 'teams' ? 'npc-tab-active' : ''} onClick={() => setActiveTab('teams')} type="button">Times</button>
      <button className={activeTab === 'tournaments' ? 'npc-tab-active' : ''} onClick={() => setActiveTab('tournaments')} type="button">Torneios</button>
    </nav>
    {activeTab === 'teams' && <>
    <section className="draw-panel"><div className="team-selector"><label>Escolha o time NPC</label><select value={selectedParticipantId ? `participant:${selectedParticipantId}` : teamId} onChange={(event) => { const value = event.target.value; if (value.startsWith('participant:')) { setSelectedParticipantId(value.slice('participant:'.length)); setDrawn([]); setUpgrades(Array.from({ length: 11 }, () => 0)); return } setSelectedParticipantId(null); setTeamId(value); setDrawn([]); resetUpgrades() }}>{sortedTeams.map((item) => <option value={item.id} key={item.id}>{item.name} · Poder {item.power}</option>)}{participants.length > 0 && <optgroup label="Times cadastrados">{participants.map((participant) => <option value={`participant:${participant.id}`} key={participant.id}>{participant.name}</option>)}</optgroup>}</select><div className="team-summary"><span>Poder atual</span><strong>{upgradedPower}</strong><small>{upgradeTotal ? `+${upgradeTotal} em upgrades` : 'sem upgrades'}</small></div></div><div className="draw-panel-buttons"><button className="team-draw-button" onClick={drawTeam}>Sortear time <span>↗</span></button><button className="draw-button" onClick={openDraw}>Sortear jogadores <span>↗</span></button></div></section>
    <section className="match-actions"><button className="win-match-button" onClick={openPrizeModal}>Venci a partida <span>🏆</span></button></section>
    <section className="upgrade-panel"><div><span className="eyebrow">AJUSTES OPCIONAIS</span><h2>Aplicar upgrades antes do sorteio</h2><p>Cada upgrade adiciona +1 ao jogador escolhido. Não existe limite acima de 21.</p></div><button className="reset-upgrades" onClick={resetUpgrades} disabled={!upgradeTotal}>Limpar upgrades</button><div className="upgrade-list">{team.playerPowers.map((power, index) => <div className="upgrade-slot" key={`${team.id}-${index}`}><span>Jogador {index + 1}</span><strong>{power + (upgrades[index] ?? 0)}</strong>{upgrades[index] > 0 && <em>+{upgrades[index]}</em>}<button onClick={() => addUpgrade(index)} aria-label={`Adicionar upgrade ao jogador ${index + 1}`}>+ UP</button></div>)}</div></section>
    {drawn.length > 0 && <div className="draw-heading"><div><h2>Jogadores sorteados · {team.name}</h2><p>Nenhum jogador se repete neste sorteio.</p></div><div className="draw-total"><span>PODER SORTEADO</span><strong>{getDrawnPower(drawn)}</strong></div></div>}
    {drawn.length > 0 && <section className="draw-grid">{drawn.map((player) => <article className="npc-player-card" key={player.id}><span className="player-number">{String(player.number).padStart(2, '0')}</span><div className="npc-player-avatar">{player.power}</div><div><span>JOGADOR NPC</span><h3>Jogador {player.number}</h3><p>{player.power >= 20 ? 'Nível lendário' : player.power >= 18 ? 'Nível elite' : 'Nível competitivo'}</p></div><strong>{player.power}</strong></article>)}</section>}
    <section className="participant-panel">
      <div className="participant-heading"><div><span className="eyebrow">PARTICIPANTES</span><h2>Usuários cadastrados</h2></div></div>
      <div className="participant-form"><input value={participantName} onChange={(event) => setParticipantName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addParticipant() }} placeholder="Nome do participante" maxLength={80} /><button onClick={() => void addParticipant()}>Adicionar</button></div>
      {participantError && <p className="form-error">{participantError}</p>}
      <div className="participant-list">{participants.map((participant) => <div className="participant-item" key={participant.id}><strong>{participant.name}</strong><button onClick={() => void removeParticipant(participant.id)} aria-label={`Remover ${participant.name}`}>×</button></div>)}</div>
    </section>
    </>}
    {activeTab === 'tournaments' && <section className="tournaments-section">
      <div className="tournaments-heading"><div><span className="eyebrow">ESTRUTURA DOS CAMPEONATOS</span><h2>Escolha um campeonato</h2><p>Os times serão adicionados quando você enviar a lista.</p></div><span className="tournaments-status">CONFIGURAÇÃO INICIAL</span></div>
      <div className="tournament-list">{npcTournaments.map((tournament) => <button className={`tournament-card ${selectedTournamentId === tournament.id ? 'tournament-card-active' : ''}`} key={tournament.id} onClick={() => { setSelectedTournamentId(tournament.id); setBracketWinners(savedTournamentState.winners[tournament.id] ?? {}) }} type="button"><strong>{tournament.name}</strong><span>{tournament.format}</span></button>)}</div>
      {selectedTournament.id === 'libertadores' && <div className="libertadores-team-picker">
        <div><span className="eyebrow">MONTAR LIBERTADORES</span><h3>Adicionar times</h3><p>Boca Juniors, Peñarol e River Plate são fixos. Escolha os demais times até completar 8 vagas.</p></div>
        <div className="libertadores-team-picker-controls">
          <select value={libertadoresTeamToAdd} onChange={(event) => setLibertadoresTeamToAdd(event.target.value)} aria-label="Time para adicionar à Libertadores">
            <option value="">Selecione um time</option>
            {libertadoresTeamOptions.map((name) => <option value={name} key={name}>{name}</option>)}
          </select>
          <button type="button" onClick={addLibertadoresTeam} disabled={!libertadoresTeamToAdd || libertadoresTeams.length >= bracketTeamCount}>Adicionar</button>
        </div>
      </div>}
      {selectedTournament.id === 'mundial' && <div className="libertadores-team-picker">
        <div><span className="eyebrow">MUNDIAL</span><h3>Sortear adversário</h3><p>O campeão da Libertadores enfrenta um adversário sorteado.</p></div>
        <div className="libertadores-team-picker-controls">
          <button type="button" onClick={drawMundialOpponent}>Sortear adversário</button>
        </div>
      </div>}
      <div className="tournament-bracket">
        <div className="bracket-heading"><div><span className="eyebrow">CHAVEAMENTO</span><h3>{selectedTournament.name}</h3></div><div className="bracket-heading-actions"><span>{bracketTeamCount} vagas</span><button type="button" onClick={resetTournamentResults}>Zerar resultados</button><button type="button" onClick={reshuffleBracket}>Embaralhar</button></div></div>
        <div className="bracket-scroll">
          <div className={`bracket ${selectedTournament.id === 'mundial' ? 'bracket-single-team' : ''}`}>
            {selectedTournament.id === 'mundial' && <div className="bracket-single-card"><span className="bracket-round-title">FINAL DO MUNDIAL</span><strong>{mundialBracketTeams[0]?.name ?? 'Campeão da Libertadores'}</strong><span>vs.</span><strong>{mundialBracketTeams[1]?.name ?? 'Adversário a sortear'}</strong></div>}
            {bracketRounds.map((matchCount, roundIndex) => <div className={`bracket-round bracket-round-${roundIndex}`} key={bracketRoundNames[roundIndex]}>
              <span className="bracket-round-title">{bracketRoundNames[roundIndex]}</span>
              <div className="bracket-matches">{Array.from({ length: matchCount }, (_, matchIndex) => <div className="bracket-match" key={`${roundIndex}-${matchIndex}`}>
                {[0, 1].map((slotIndex) => {
                  const name = getBracketSlot(roundIndex, matchIndex, slotIndex)
                  const isWinner = bracketWinners[`${roundIndex}-${matchIndex}`] === name && Boolean(name)
                  return <button className={`bracket-slot ${isWinner ? 'bracket-slot-winner' : ''}`} disabled={!name} key={slotIndex} onClick={() => name && openMatchResolution(roundIndex, matchIndex, name)} type="button">{name ?? 'A definir'}</button>
                })}
              </div>)}</div>
            </div>)}
            <div className="bracket-trophy" aria-hidden="true">🏆</div>
          </div>
        </div>
        <p className="bracket-note">Os confrontos serão preenchidos quando os times deste campeonato forem cadastrados.</p>
      </div>
      <div className="championship-rewards">
        <div><span className="eyebrow">PREMIAÇÃO DO CAMPEONATO</span><h2>Adicionar premiação ao caixa</h2><p>O primeiro lugar também abre o sorteio de um prêmio adicional.</p></div>
        <select value={championship} onChange={(event) => setChampionship(event.target.value as Championship)} aria-label="Campeonato">
          {Object.keys(championshipRewards).map((name) => <option key={name}>{name}</option>)}
        </select>
        <div className="championship-reward-buttons">
          <button onClick={() => awardChampionship(1)} disabled={!userId}>1º lugar · € {championshipRewards[championship][0]} mi + prêmio</button>
          <button onClick={() => awardChampionship(2)} disabled={!userId}>2º lugar · € {championshipRewards[championship][1]} mi</button>
          <button onClick={() => awardChampionship(3)} disabled={!userId}>3º lugar · € {championshipRewards[championship][2]} mi</button>
        </div>
      </div>
    </section>}
    {matchResolution && <div className="draw-modal-backdrop" role="presentation" onClick={() => setMatchResolution(null)}>
      <section className="match-modal" role="dialog" aria-modal="true" aria-labelledby="match-modal-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar confronto" onClick={() => setMatchResolution(null)}>×</button>
        <span className="eyebrow">CONFRONTO ENTRE NPCs</span>
        <h2 id="match-modal-title">Definição do vencedor</h2>
        <div className="match-teams">{matchResolution.teams.map((team) => <div key={team.name}><strong>{team.name}</strong><span>Poder total: {team.power}</span></div>)}</div>
        <p className="match-difference">Diferença de poder: <strong>{matchResolution.difference}</strong></p>
        <p className="match-rule">{matchResolution.difference >= 16 ? 'Diferença de 16 ou mais: o time mais forte vence automaticamente.' : matchResolution.difference <= 5 ? 'Diferença até 5: 1–3 vence o mais forte; 4–6 vence o mais fraco.' : matchResolution.difference <= 10 ? 'Diferença de 6 a 10: 1–4 vence o mais forte; 5–6 vence o mais fraco.' : 'Diferença de 11 a 15: 1–5 vence o mais forte; 6 vence o mais fraco.'}</p>
        {matchResolution.roll !== null && <div className="match-die">D6: <strong>{matchResolution.roll}</strong></div>}
        {matchResolution.winner && <p className="match-winner">Vencedor: <strong>{matchResolution.winner}</strong></p>}
        <div className="match-modal-actions"><button type="button" onClick={matchResolution.winner ? confirmMatchResolution : resolveMatch}>{matchResolution.winner ? 'Confirmar vencedor' : matchResolution.difference >= 16 ? 'Definir vencedor' : 'Rolar dado D6'}</button></div>
      </section>
    </div>}
    {isPrizeModalOpen && <div className="item-modal-backdrop" role="presentation" onClick={() => setIsPrizeModalOpen(false)}>
      <section className="item-modal" role="dialog" aria-modal="true" aria-labelledby="npc-prize-title" onClick={(event) => event.stopPropagation()}>
        <button className="item-modal-close" onClick={() => setIsPrizeModalOpen(false)} aria-label="Fechar sorteio">×</button>
        <span className="eyebrow">PRÊMIO DA VITÓRIA</span>
        <h2 id="npc-prize-title">Prêmios <small>32 + {prizeState?.levelUpRemaining.length ?? 0} LEVEL-UP</small></h2>
        <div className="item-draw-value">{prizeResult === null ? '—' : prizeResult === 'LEVEL-UP' ? <strong>LEVEL-UP</strong> : <><strong>Prêmio</strong><span>€ {prizeResult} mi</span></>}</div>
        {prizeError && <p className="form-error">{prizeError}</p>}
        {!userId && <p className="auth-message">Entre na sua conta para sortear e salvar o LEVEL-UP.</p>}
        <div className="item-draw-actions"><button className="primary-draw-button" onClick={prizeResult !== null ? () => setIsPrizeModalOpen(false) : drawPrize} disabled={!userId || prizeState === null}>{prizeResult === null ? 'Sortear prêmio' : 'Fechar modal'}</button></div>
      </section>
    </div>}
    {isModalOpen && <div className="draw-modal-backdrop" role="presentation" onClick={closeDraw}>
      <section className="draw-modal" role="dialog" aria-modal="true" aria-labelledby="draw-modal-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar sorteio" onClick={closeDraw}>×</button>
        <div className="modal-heading"><span className="eyebrow">SORTEIO EM ANDAMENTO</span><h2 id="draw-modal-title">{team.name}</h2><p>Jogador {Math.max(currentIndex + 1, 1)} de 11</p></div>
        <div className="draw-stage">
          <div className="draw-history"><span className="stage-label">JÁ SORTEADOS</span>{drawn.length === 0 ? <div className="history-empty">Nenhum jogador<br />revelado ainda</div> : <div className="history-list">{drawn.map((player, index) => <div className="history-player" key={player.id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{player.power}</strong></div>)}</div>}</div>
          <div className="current-draw"><span className="stage-label">PODER DO JOGADOR</span><div className="power-orb">{currentIndex < 0 ? '?' : currentPlayer?.power}</div><strong>{currentIndex < 0 ? 'Pronto para sortear' : `Jogador ${currentPlayer.number}`}</strong><small>{currentIndex < 0 ? 'Clique no botão para revelar' : 'Jogador revelado'}</small></div>
          <div className="next-draw"><span className="stage-label">PRÓXIMO JOGADOR</span><div className="next-card">{nextPlayer ? <><div className="next-orb">?</div><strong>Oculto</strong><small>Aguardando sorteio</small></> : <><div className="next-orb done">✓</div><strong>Finalizado</strong><small>Os 11 jogadores foram sorteados</small></>}</div></div>
        </div>
        <div className="modal-controls"><button className="arrow-button" aria-label="Voltar jogador" onClick={showPreviousPlayer} disabled={currentIndex < 0}>←</button><button className="modal-draw-button" onClick={showNextPlayer} disabled={!canAdvance}>{currentIndex < drawn.length - 1 ? `Ver jogador ${currentIndex + 2}` : nextPlayer ? `Sortear jogador ${currentIndex + 2}` : 'Sorteio concluído'} <span>{canAdvance ? '→' : '✓'}</span></button><button className="arrow-button" aria-label="Avançar jogador" onClick={showNextPlayer} disabled={!canAdvance}>→</button></div>
        <div className="modal-progress"><span style={{ width: `${(drawn.length / 11) * 100}%` }} /></div>
      </section>
    </div>}
  </main>
}
