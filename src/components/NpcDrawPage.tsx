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

const prizeValues = [7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12, 12, 15, 15, 15, 15, 18, 18, 20, 20, 20, 20, 25, 25]
const championshipRewards = {
  Paulista: [10, 10, 5],
  'Copa do Brasil': [15, 15, 7],
  Brasileiro: [20, 20, 10],
  Libertadores: [25, 25, 12],
} as const
type Championship = keyof typeof championshipRewards

export function NpcDrawPage({ onNavigate, userId, money, teamPower, onPrizeMoney }: { onNavigate: (page: HeaderPage) => void; userId: string | null; money: number; teamPower: number; onPrizeMoney: (amount: number) => void }) {
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

  useEffect(() => {
    fetchDrawParticipants(supabase).then(setParticipants).catch(() => setParticipantError('Não foi possível carregar os participantes.'))
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
    <section className="draw-panel"><div className="team-selector"><label>Escolha o time NPC</label><select value={selectedParticipantId ? `participant:${selectedParticipantId}` : teamId} onChange={(event) => { const value = event.target.value; if (value.startsWith('participant:')) { setSelectedParticipantId(value.slice('participant:'.length)); setDrawn([]); setUpgrades(Array.from({ length: 11 }, () => 0)); return } setSelectedParticipantId(null); setTeamId(value); setDrawn([]); resetUpgrades() }}>{sortedTeams.map((item) => <option value={item.id} key={item.id}>{item.name} · Poder {item.power}</option>)}{participants.length > 0 && <optgroup label="Times cadastrados">{participants.map((participant) => <option value={`participant:${participant.id}`} key={participant.id}>{participant.name}</option>)}</optgroup>}</select><div className="team-summary"><span>Poder atual</span><strong>{upgradedPower}</strong><small>{upgradeTotal ? `+${upgradeTotal} em upgrades` : 'sem upgrades'}</small></div></div><div className="draw-panel-buttons"><button className="team-draw-button" onClick={drawTeam}>Sortear time <span>↗</span></button><button className="draw-button" onClick={openDraw}>Sortear jogadores <span>↗</span></button></div></section>
    <section className="match-actions"><button className="win-match-button" onClick={openPrizeModal}>Venci a partida <span>🏆</span></button></section>
    <section className="championship-rewards">
      <div><span className="eyebrow">PREMIAÇÃO DO CAMPEONATO</span><h2>Adicionar premiação ao caixa</h2><p>O primeiro lugar também abre o sorteio de um prêmio adicional.</p></div>
      <select value={championship} onChange={(event) => setChampionship(event.target.value as Championship)} aria-label="Campeonato">
        {Object.keys(championshipRewards).map((name) => <option key={name}>{name}</option>)}
      </select>
      <div className="championship-reward-buttons">
        <button onClick={() => awardChampionship(1)} disabled={!userId}>1º lugar · € {championshipRewards[championship][0]} mi + prêmio</button>
        <button onClick={() => awardChampionship(2)} disabled={!userId}>2º lugar · € {championshipRewards[championship][1]} mi</button>
        <button onClick={() => awardChampionship(3)} disabled={!userId}>3º lugar · € {championshipRewards[championship][2]} mi</button>
      </div>
    </section>
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
    <section className="upgrade-panel"><div><span className="eyebrow">AJUSTES OPCIONAIS</span><h2>Aplicar upgrades antes do sorteio</h2><p>Cada upgrade adiciona +1 ao jogador escolhido. Não existe limite acima de 21.</p></div><button className="reset-upgrades" onClick={resetUpgrades} disabled={!upgradeTotal}>Limpar upgrades</button><div className="upgrade-list">{team.playerPowers.map((power, index) => <div className="upgrade-slot" key={`${team.id}-${index}`}><span>Jogador {index + 1}</span><strong>{power + (upgrades[index] ?? 0)}</strong>{upgrades[index] > 0 && <em>+{upgrades[index]}</em>}<button onClick={() => addUpgrade(index)} aria-label={`Adicionar upgrade ao jogador ${index + 1}`}>+ UP</button></div>)}</div></section>
    {drawn.length > 0 && <div className="draw-heading"><div><h2>Jogadores sorteados · {team.name}</h2><p>Nenhum jogador se repete neste sorteio.</p></div><div className="draw-total"><span>PODER SORTEADO</span><strong>{getDrawnPower(drawn)}</strong></div></div>}
    {drawn.length > 0 && <section className="draw-grid">{drawn.map((player) => <article className="npc-player-card" key={player.id}><span className="player-number">{String(player.number).padStart(2, '0')}</span><div className="npc-player-avatar">{player.power}</div><div><span>JOGADOR NPC</span><h3>Jogador {player.number}</h3><p>{player.power >= 20 ? 'Nível lendário' : player.power >= 18 ? 'Nível elite' : 'Nível competitivo'}</p></div><strong>{player.power}</strong></article>)}</section>}
    <section className="participant-panel">
      <div className="participant-heading"><div><span className="eyebrow">PARTICIPANTES</span><h2>Times cadastrados</h2></div></div>
      <div className="participant-form"><input value={participantName} onChange={(event) => setParticipantName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addParticipant() }} placeholder="Nome do participante" maxLength={80} /><button onClick={() => void addParticipant()}>Adicionar</button></div>
      {participantError && <p className="form-error">{participantError}</p>}
      <div className="participant-list">{participants.map((participant) => <div className="participant-item" key={participant.id}><strong>{participant.name}</strong><button onClick={() => void removeParticipant(participant.id)} aria-label={`Remover ${participant.name}`}>×</button></div>)}</div>
    </section>
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
