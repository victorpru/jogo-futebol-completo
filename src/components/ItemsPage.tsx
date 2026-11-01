import { useEffect, useState } from 'react'
import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'
import { supabase } from '../lib/supabase'
import { fetchItemDrawState, getRemainingForType, saveItemDrawState } from '../services/itemDrawApi'

interface ItemsPageProps {
  onNavigate: (page: HeaderPage) => void
  userId: string | null
}

export type DrawType = 'yellow' | 'blue' | 'investment' | 'prizes' | 'level-up'
type DrawItem = { label: string; value: number }
export interface ItemDrawState {
  levelUpTotal: number
  levelUpRemaining: number[]
  blueRemaining: number[]
  yellowRemaining: number[]
}

const blueValues = [4, 6, 6, 7, 8, 10, 12, 15, 15]
const blueItems = blueValues.map((value) => ({ label: 'Patrocínio azul', value }))
const yellowValues = [3, 4, 6, 7, 8, 8, 10, 10, 11, 12, 12, 14, 15, 16, 16, 16, 18, 18, 20, 20, 22, 22, 24, 25, 30]
const yellowItems = yellowValues.map((value) => ({ label: 'Patrocínio amarelo', value }))
const prizeItems = [7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12, 12, 15, 15, 15, 15, 18, 18, 20, 20, 20, 20, 25, 25].map((value) => ({ label: 'Prêmio', value }))
const investmentItems: DrawItem[] = [
  ...[7, 7, 7, 7, 9, 9, 11, 11, 15, 15].map((value) => ({ label: 'Investimento', value })),
  ...Array.from({ length: 15 }, () => ({ label: 'Não encontrou investimento', value: 0 })),
]

const itemCategories = [
  { key: 'yellow', eyebrow: 'PATROCINADORES', title: 'Patrocinadores amarelos', description: '25 patrocínios com valores de € 3 a € 30 milhões.', accent: 'yellow', count: 25 },
  { key: 'blue', eyebrow: 'PATROCINADORES', title: 'Patrocinadores azuis', description: '9 patrocínios com valores de € 4 a € 15 milhões.', accent: 'blue', count: 9 },
  { key: 'investment', eyebrow: 'RECURSOS', title: 'Investimentos', description: '10 investimentos e 15 resultados sem investimento.', accent: 'green', count: 25 },
  { key: 'prizes', eyebrow: 'RECOMPENSAS', title: 'Prêmios', description: '32 prêmios-base e LEVEL-UP configurável.', accent: 'purple', count: 32 },
] as const

function prepareDrawItems(type: DrawType): DrawItem[] {
  const items = type === 'yellow'
    ? [...yellowItems]
    : type === 'blue'
      ? [...blueItems]
      : type === 'prizes'
        ? [...prizeItems]
        : type === 'level-up'
          ? []
      : [...investmentItems]
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temporary = items[index]
    items[index] = items[randomIndex]
    items[randomIndex] = temporary
  }
  return items
}

export function ItemsPage({ onNavigate, userId }: ItemsPageProps) {
  const [drawType, setDrawType] = useState<DrawType | null>(null)
  const [drawnItems, setDrawnItems] = useState<DrawItem[]>([])
  const [pendingItems, setPendingItems] = useState<DrawItem[]>([])
  const [currentItem, setCurrentItem] = useState<DrawItem | null>(null)
  const [drawState, setDrawState] = useState<ItemDrawState | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    fetchItemDrawState(supabase, userId).then((saved) => {
      setDrawState(saved ?? { levelUpTotal: 0, levelUpRemaining: [], blueRemaining: [...blueValues], yellowRemaining: [...yellowValues] })
    }).catch(() => setError('Não foi possível carregar os sorteios dos itens.')).finally(() => setLoadingState(false))
  }, [userId])
  const isLoading = userId !== null && loadingState

  const persistState = (nextState: ItemDrawState) => {
    setDrawState(nextState)
    if (userId) void saveItemDrawState(supabase, userId, nextState).catch(() => setError('Não foi possível salvar o estado dos itens.'))
  }

  const openDraw = (type: DrawType) => {
    if (!drawState) return
    setDrawType(type)
    setDrawnItems([])
    setCurrentItem(null)
    const remaining = getRemainingForType(drawState, type)
    const levelUpItems = type === 'prizes'
      ? drawState.levelUpRemaining.map(() => ({ label: 'LEVEL-UP', value: 0 }))
      : []
    setPendingItems(remaining
      ? remaining.map((value) => ({ label: type === 'blue' ? 'Patrocínio azul' : 'Patrocínio amarelo', value }))
      : [...prepareDrawItems(type), ...levelUpItems])
  }

  const clearDraw = () => {
    if (!drawState) return
    persistState({ ...drawState, levelUpTotal: 0, levelUpRemaining: [], blueRemaining: [...blueValues], yellowRemaining: [...yellowValues] })
    setDrawType(null)
    setDrawnItems([])
    setPendingItems([])
    setCurrentItem(null)
  }

  const updateLevelUpCount = (value: number) => {
    if (!drawState) return
    persistState({ ...drawState, levelUpTotal: value, levelUpRemaining: Array.from({ length: value }, () => 0) })
  }

  const remainingCount = (type: 'yellow' | 'blue' | 'prizes') => {
    if (!drawState) return 0
    if (type === 'yellow') return drawState.yellowRemaining.length
    if (type === 'blue') return drawState.blueRemaining.length
    return prizeItems.length + drawState.levelUpRemaining.length
  }

  const drawItem = () => {
    if (!drawType) return
    if (drawnItems.length >= 1) return
    if (pendingItems.length === 0) return
    const itemIndex = Math.floor(Math.random() * pendingItems.length)
    const item = pendingItems[itemIndex]
    if (!item) return
    setDrawnItems((items) => [...items, item])
    setPendingItems((items) => items.filter((_, index) => index !== itemIndex))
    setCurrentItem(item)
    if (drawState && (drawType === 'blue' || drawType === 'yellow' || (drawType === 'prizes' && item.label === 'LEVEL-UP'))) {
      if (drawType === 'prizes' && item.label === 'LEVEL-UP') {
        const levelUpIndex = pendingItems
          .slice(0, itemIndex)
          .filter((pendingItem) => pendingItem.label === 'LEVEL-UP').length
        persistState({ ...drawState, levelUpRemaining: drawState.levelUpRemaining.filter((_, index) => index !== levelUpIndex) })
        return
      }
      const remaining = getRemainingForType(drawState, drawType)
      if (remaining) persistState({ ...drawState, ...(drawType === 'blue' ? { blueRemaining: remaining.filter((_, index) => index !== itemIndex) } : { yellowRemaining: remaining.filter((_, index) => index !== itemIndex) }) })
    }
  }

  const title = drawType === 'yellow' ? 'Patrocinadores amarelos' : drawType === 'blue' ? 'Patrocinadores azuis' : drawType === 'prizes' ? 'Prêmios' : drawType === 'level-up' ? 'LEVEL-UP' : 'Investimentos'
  const drawTotal = drawType === 'prizes' ? 32 + (drawState?.levelUpTotal ?? 0) : drawType === 'yellow' ? yellowValues.length : drawType === 'blue' ? blueValues.length : 25
  const closeDraw = () => {
    setDrawType(null)
    setDrawnItems([])
    setPendingItems([])
    setCurrentItem(null)
  }

  return <main className="items-page">
    <AppHeader activePage="items" onNavigate={onNavigate} />
    <section className="items-hero">
      <span className="eyebrow">FOOTBALL DECK BUILDING · COMPONENTES</span>
      <h1>Itens para<br /><em>facilitar o jogo.</em></h1>
      <p>Organize os componentes físicos do jogo em sorteios únicos. Cada categoria possui seus próprios resultados e não mantém histórico após o fechamento.</p>
    </section>
    <section className="items-heading">
      <div><h2>Categorias de itens</h2><p>Sorteios únicos · Resultados revelados um por vez</p></div>
      <span className="items-status"><i /> EM CONFIGURAÇÃO</span>
    </section>
    <section className="items-grid">
      {itemCategories.map((category) => <article className={`item-category item-${category.accent}`} key={category.key}>
        <div className="item-category-icon" aria-hidden="true">◆</div>
        <span className="item-category-eyebrow">{category.eyebrow}</span>
        <h3>{category.title}</h3>
        <p>{category.description}</p>
        <div className="item-category-footer"><strong>{category.key === 'yellow' || category.key === 'blue' || category.key === 'prizes' ? remainingCount(category.key) : category.count}</strong><span>itens disponíveis</span></div>
        {category.key === 'prizes' && <div className="level-up-main-control">
          <label htmlFor="level-up-count">LEVEL-UP no sorteio</label>
          <select id="level-up-count" value={drawState?.levelUpTotal ?? 0} onChange={(event) => updateLevelUpCount(Number(event.target.value))} disabled={!userId || isLoading || (drawState?.levelUpTotal ?? 0) > 0}>
            {Array.from({ length: 26 }, (_, index) => <option key={index} value={index}>{index}</option>)}
          </select>
        </div>}
        <button className="item-draw-button" onClick={() => openDraw(category.key)} disabled={!userId || isLoading || ((category.key === 'yellow' || category.key === 'blue') && remainingCount(category.key) === 0)}>Abrir sorteio</button>
      </article>)}
    </section>
    <div className="item-draw-actions"><button onClick={clearDraw} disabled={!userId || isLoading}>Limpar sorteios</button></div>
    {!userId && <p className="auth-message">Entre na sua conta para usar e salvar os sorteios.</p>}
    {error && <p className="form-error">{error}</p>}
    <footer>Os sorteios azul, amarelo e LEVEL-UP ficam salvos por usuário.</footer>
    {drawType && <div className="item-modal-backdrop" role="presentation">
      <section className="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-draw-title">
        <button className="item-modal-close" onClick={closeDraw} aria-label="Fechar sorteio">×</button>
        <span className="eyebrow">SORTEIO ÚNICO</span>
        <h2 id="item-draw-title">{title} <small>{drawnItems.length} / {drawTotal}</small></h2>
        <div className={`item-draw-value ${currentItem?.label === 'Não encontrou investimento' ? 'item-draw-empty' : ''}`}>
          {currentItem ? <><strong>{currentItem.label}</strong>{currentItem.label !== 'Não encontrou investimento' && currentItem.label !== 'LEVEL-UP' && <span>€ {currentItem.value} mi</span>}</> : '—'}
        </div>
        <div className="item-draw-actions"><button className="primary-draw-button" onClick={drawItem} disabled={drawnItems.length >= 1 || pendingItems.length === 0}>{pendingItems.length === 0 ? 'Sorteio esgotado' : drawnItems.length >= 1 ? 'Feche para sortear novamente' : 'Sortear resultado'}</button></div>
      </section>
    </div>}
  </main>
}
