import { useMemo, useState } from 'react'
import { npcTeams } from '../data/npcTeams'
import { drawNpcPlayers, getDrawnPower } from '../utils/npcDraw'
import type { NpcDrawnPlayer } from '../types/npcTeam'
import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'

export function NpcDrawPage({ onNavigate }: { onNavigate: (page: HeaderPage) => void }) {
  const [teamId, setTeamId] = useState(npcTeams[0].id)
  const [drawn, setDrawn] = useState<NpcDrawnPlayer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [drawOrder, setDrawOrder] = useState<NpcDrawnPlayer[]>([])
  const [upgrades, setUpgrades] = useState<number[]>(() => Array.from({ length: npcTeams[0].playerPowers.length }, () => 0))
  const team = useMemo(() => npcTeams.find((item) => item.id === teamId) ?? npcTeams[0], [teamId])
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

  return <main className="npc-page">
    <AppHeader activePage="npc" onNavigate={onNavigate} />
    <section className="npc-hero"><div><span className="eyebrow">SORTEIO DE TIME NPC</span><h1>Revele os 11 jogadores<br /><em>do seu adversário.</em></h1><p>Cada time possui uma distribuição fixa de poderes. O sorteio apenas embaralha os 11 jogadores, sem repetir nenhum jogador na mesma rodada.</p></div><div className="npc-rule"><strong>11</strong><span>JOGADORES POR TIME</span><small>Distribuição baseada na tabela de referência</small></div></section>
    <section className="draw-panel"><div className="team-selector"><label>Escolha o time NPC</label><select value={teamId} onChange={(event) => { setTeamId(event.target.value); setDrawn([]); resetUpgrades() }}>{sortedTeams.map((item) => <option value={item.id} key={item.id}>{item.name} · Poder {item.power}</option>)}</select><div className="team-summary"><span>Poder atual</span><strong>{upgradedPower}</strong><small>{upgradeTotal ? `+${upgradeTotal} em upgrades` : 'sem upgrades'}</small></div></div><button className="draw-button" onClick={openDraw}>Sortear jogadores <span>↗</span></button></section>
    <section className="upgrade-panel"><div><span className="eyebrow">AJUSTES OPCIONAIS</span><h2>Aplicar upgrades antes do sorteio</h2><p>Cada upgrade adiciona +1 ao jogador escolhido. Não existe limite acima de 21.</p></div><button className="reset-upgrades" onClick={resetUpgrades} disabled={!upgradeTotal}>Limpar upgrades</button><div className="upgrade-list">{team.playerPowers.map((power, index) => <div className="upgrade-slot" key={`${team.id}-${index}`}><span>Jogador {index + 1}</span><strong>{power + (upgrades[index] ?? 0)}</strong>{upgrades[index] > 0 && <em>+{upgrades[index]}</em>}<button onClick={() => addUpgrade(index)} aria-label={`Adicionar upgrade ao jogador ${index + 1}`}>+ UP</button></div>)}</div></section>
    <div className="draw-heading"><div><h2>{drawn.length ? `Jogadores sorteados · ${team.name}` : 'Aguardando sorteio'}</h2><p>{drawn.length ? 'Nenhum jogador se repete neste sorteio.' : 'Selecione um time e revele sua composição.'}</p></div>{drawn.length > 0 && <div className="draw-total"><span>PODER SORTEADO</span><strong>{getDrawnPower(drawn)}</strong></div>}</div>
    {drawn.length === 0 ? <div className="draw-empty"><div>♙</div><h3>O time está pronto para ser sorteado</h3><p>Os poderes individuais serão distribuídos em ordem aleatória.</p></div> : <section className="draw-grid">{drawn.map((player) => <article className="npc-player-card" key={player.id}><span className="player-number">{String(player.number).padStart(2, '0')}</span><div className="npc-player-avatar">{player.power}</div><div><span>JOGADOR NPC</span><h3>Jogador {player.number}</h3><p>{player.power >= 20 ? 'Nível lendário' : player.power >= 18 ? 'Nível elite' : 'Nível competitivo'}</p></div><strong>{player.power}</strong></article>)}</section>}
    <footer>O sorteio não utiliza cartas do catálogo e não altera nenhum dado do jogo.</footer>
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
