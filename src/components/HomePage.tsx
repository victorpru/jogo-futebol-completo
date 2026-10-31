import { useState } from 'react'
import type { PlayerPosition, TeamPlayer } from '../types/game'
import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'

interface HomePageProps {
  onNavigate: (page: HeaderPage) => void
  money: number
  ownedPlayers: TeamPlayer[]
  onUpdateMoney: (amount: number) => void
  onRemovePlayer: (playerId: string) => void
  onAddPlayer: (skill: number, value: number, position: PlayerPosition) => string | null
}

const positions: PlayerPosition[] = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA']
const positionNames: Record<PlayerPosition, string> = {
  GOL: 'Goleiros',
  ZAG: 'Zagueiros',
  LAT: 'Laterais',
  VOL: 'Volantes',
  MEI: 'Meias',
  ATA: 'Atacantes',
}
const positionVacancies = { GOL: 1, ZAG: 2, LAT: 2, VOL: 1, MEI: 2, ATA: 3 }

export function HomePage({ onNavigate, money, ownedPlayers, onUpdateMoney, onRemovePlayer, onAddPlayer }: HomePageProps) {
  const totalTeamValue = ownedPlayers.reduce((total, player) => total + player.value, 0)
  return <main className="home-page">
    <AppHeader activePage="home" onNavigate={onNavigate} />
    <section className="home-hero">
      <span className="eyebrow">FOOTBALL DECK BUILDING · TEMPORADA 01</span>
      <h1>Seu espaço para<br /><em>construir o jogo.</em></h1>
      <p>Controle seu orçamento e acompanhe os jogadores que já fazem parte do seu elenco.</p>
    </section>
    <section className="home-dashboard">
      <article className="wallet-panel">
        <div className="wallet-heading"><div><span className="eyebrow">ORÇAMENTO DISPONÍVEL</span><h2>Caixa do time</h2></div><span className="wallet-icon">€</span></div>
        <strong className="wallet-balance">€ {money} mi</strong>
        <MoneyControls onUpdateMoney={onUpdateMoney} />
      </article>
      <article className="squad-panel">
        <div className="squad-heading"><div><span className="eyebrow">MEU ELENCO</span><h2>Jogadores que você tem <span>{ownedPlayers.length}/11</span></h2></div><div className="team-value"><small>VALOR TOTAL DO TIME</small><strong>€ {totalTeamValue} mi</strong></div></div>
        <PlayerForm onAddPlayer={onAddPlayer} disabled={ownedPlayers.length >= 11} occupied={ownedPlayers.reduce<Record<PlayerPosition, number>>((counts, player) => ({ ...counts, [player.assignedPosition]: counts[player.assignedPosition] + 1 }), { GOL: 0, ZAG: 0, LAT: 0, VOL: 0, MEI: 0, ATA: 0 })} />
        <div className="positions-grid">{positions.map((position) => {
          const positionPlayers = ownedPlayers.filter((player) => player.assignedPosition === position)
          return <section className="position-group" key={position}>
            <div className="position-group-heading"><h3>{positionNames[position]}</h3><span>{positionPlayers.length}/{positionVacancies[position]}</span></div>
            <div className="position-players">{positionPlayers.map((player) => {
              const playerIndex = ownedPlayers.indexOf(player) + 1
              return <article className="owned-player" key={player.id}><div className="card-avatar">{String(playerIndex).padStart(2, '0')}</div><div><strong>Jogador {String(playerIndex).padStart(2, '0')}</strong><span>Poder {player.skill}</span><small>€ {player.value} mi</small></div><button onClick={() => onRemovePlayer(player.id)} aria-label={`Remover jogador ${playerIndex}`}>×</button></article>
            })}</div>
            {positionPlayers.length < positionVacancies[position] && <span className="empty-position">Vaga disponível</span>}
          </section>
        })}</div>
      </article>
    </section>
    <section className="home-actions">
      <button onClick={() => onNavigate('items')}><strong>Sorteio de itens</strong><span>Gerencie os sorteios e componentes do jogo ↗</span></button>
      <button onClick={() => onNavigate('npc')}><strong>Sorteio NPC</strong><span>Revele os 11 jogadores de um time ↗</span></button>
      <button onClick={() => onNavigate('winners')}><strong>Histórico de vencedores</strong><span>Veja quem ganhou e quantas partidas venceu ↗</span></button>
      <button onClick={() => onNavigate('rules')}><strong>Regras do jogo</strong><span>Veja como montar seu time e escolher cartas ↗</span></button>
    </section>
    <footer>O catálogo e o sorteio estão disponíveis nesta etapa inicial.</footer>
  </main>
}

function PlayerForm({ onAddPlayer, disabled, occupied }: { onAddPlayer: HomePageProps['onAddPlayer']; disabled: boolean; occupied: Record<PlayerPosition, number> }) {
  const [skill, setSkill] = useState('')
  const [value, setValue] = useState('')
  const [position, setPosition] = useState<PlayerPosition>('GOL')
  const [error, setError] = useState('')
  const submit = () => {
    const result = onAddPlayer(Number(skill), Number(value), position)
    if (result) {
      setError(result)
      return
    }
    setSkill('')
    setValue('')
    setError('')
  }
  return <div className="player-form">
    <span className="form-caption">ADICIONAR JOGADOR MANUALMENTE</span>
    <div className="player-form-fields">
      <label>Poder<input type="number" min="11" max="21" step="1" value={skill} onChange={(event) => setSkill(event.target.value)} placeholder="11–21" /></label>
      <label>Valor (mi)<input type="number" min="2" max="70" step="1" value={value} onChange={(event) => setValue(event.target.value)} placeholder="2–70" /></label>
      <label>Posição<select value={position} onChange={(event) => setPosition(event.target.value as PlayerPosition)}>{positions.map((item) => <option key={item} value={item} disabled={occupied[item] >= positionVacancies[item]}>{item} ({occupied[item]}/{positionVacancies[item]})</option>)}</select></label>
      <button onClick={submit} disabled={disabled}>{disabled ? 'Time completo' : 'Adicionar'}</button>
    </div>
    {error && <p className="form-error">{error}</p>}
  </div>
}

function MoneyControls({ onUpdateMoney }: { onUpdateMoney: (amount: number) => void }) {
  const [amount, setAmount] = useState('')
  const parsedAmount = Number(amount)
  const apply = (multiplier: number) => {
    if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
      onUpdateMoney(parsedAmount * multiplier)
      setAmount('')
    }
  }
  return <div className="money-controls"><label htmlFor="money-amount">Valor da movimentação (em milhões)</label><div><input id="money-amount" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ex.: 25" /><button onClick={() => apply(1)} disabled={!amount}>Adicionar</button><button className="money-remove" onClick={() => apply(-1)} disabled={!amount}>Remover</button></div></div>
}
