import { useState } from 'react'
import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'

export interface WinnerRecord {
  id: string
  name: string
  wins: number
}

interface WinnersPageProps {
  onNavigate: (page: HeaderPage) => void
  winners: WinnerRecord[]
  isAdmin: boolean
  onAddWinner: (name: string) => Promise<string | null>
  onAddWin: (id: string) => Promise<void>
  onRemoveWinner: (id: string) => Promise<void>
}

export function WinnersPage({ onNavigate, winners, isAdmin, onAddWinner, onAddWin, onRemoveWinner }: WinnersPageProps) {
  return <main className="winners-page">
    <AppHeader activePage="winners" onNavigate={onNavigate} />
    <section className="winners-hero">
      <span className="eyebrow">FOOTBALL DECK BUILDING · HISTÓRICO</span>
      <h1>Quem já venceu<br /><em>o jogo.</em></h1>
      <p>Registre os vencedores e acompanhe quantas partidas cada pessoa ganhou.</p>
    </section>
    <section className="winners-layout">
      {isAdmin && <WinnerForm onAddWinner={onAddWinner} />}
      <section className="winner-list">
        <div className="winner-list-heading"><div><span className="eyebrow">PLACAR HISTÓRICO</span><h2>Vencedores</h2></div><strong>{winners.reduce((total, winner) => total + winner.wins, 0)} {winners.reduce((total, winner) => total + winner.wins, 0) === 1 ? 'vitória' : 'vitórias'}</strong></div>
        {winners.length === 0 ? <div className="winner-empty"><span>◆</span><p>Nenhum vencedor registrado ainda.</p></div> : <div className="winner-records">{[...winners].sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name)).map((winner) => <article className="winner-record" key={winner.id}><span className="winner-rank">{winner.wins}</span><div><strong>{winner.name}</strong></div>{isAdmin && <><button className="winner-add-button" onClick={() => onAddWin(winner.id)} aria-label={`Adicionar vitória para ${winner.name}`}>+</button><button onClick={() => onRemoveWinner(winner.id)} aria-label={`Remover ${winner.name}`}>×</button></>}</article>)}</div>}
      </section>
    </section>
    <footer>O histórico fica salvo neste navegador.</footer>
  </main>
}

function WinnerForm({ onAddWinner }: { onAddWinner: WinnersPageProps['onAddWinner'] }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const submit = async () => {
    const result = await onAddWinner(name)
    if (result) {
      setError(result)
      return
    }
    setName('')
    setError('')
  }
  return <article className="winner-form"><span className="eyebrow">NOVO REGISTRO</span><h2>Adicionar vencedor</h2><label>Nome<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Victor" /></label><button onClick={submit}>Salvar vencedor</button>{error && <p className="form-error">{error}</p>}</article>
}
