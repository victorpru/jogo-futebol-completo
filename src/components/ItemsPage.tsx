import { useEffect, useState } from 'react'
import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'
import { supabase } from '../lib/supabase'
import { deleteSponsorDraw, fetchItemDrawState, fetchSponsorDraws, saveItemDrawState, saveSponsorDraw, type SponsorDraw } from '../services/itemDrawApi'

interface ItemsPageProps {
  onNavigate: (page: HeaderPage) => void
  userId: string | null
  money: number
  teamPower: number
  onPrizeMoney: (amount: number) => void
  openItemDraw?: 'investment' | 'prizes' | null
  onItemDrawOpened?: () => void
  onItemDrawNeedsSetup?: () => void
  modalOnly?: boolean
  initialTab?: ItemsTab
  openPrizeDraw?: boolean
  onPrizeDrawOpened?: () => void
}

export type DrawType = 'yellow' | 'blue' | 'investment' | 'prizes' | 'level-up'
type DrawItem = { label: string; value: number; sponsorIndex?: number }
type ItemsTab = 'draws' | 'level-up'
export interface ItemDrawState {
  levelUpTotal: number
  levelUpRemaining: number[]
  blueRemaining: number[]
  yellowRemaining: number[]
  sponsorshipMoneyClaimed: number
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

export function ItemsPage({ onNavigate, userId, money, teamPower, onPrizeMoney, openPrizeDraw = false, onPrizeDrawOpened, openItemDraw = null, onItemDrawOpened, onItemDrawNeedsSetup, modalOnly = false, initialTab = 'draws' }: ItemsPageProps) {
  const [drawType, setDrawType] = useState<DrawType | null>(null)
  const [drawnItems, setDrawnItems] = useState<DrawItem[]>([])
  const [pendingItems, setPendingItems] = useState<DrawItem[]>([])
  const [currentItem, setCurrentItem] = useState<DrawItem | null>(null)
  const [drawState, setDrawState] = useState<ItemDrawState | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sponsorDraws, setSponsorDraws] = useState<SponsorDraw[]>([])
  const [replacement, setReplacement] = useState<{ current: SponsorDraw; candidate: SponsorDraw } | null>(null)
  const [activeTab, setActiveTab] = useState<ItemsTab>(initialTab)

  useEffect(() => {
    if (!userId) return
    Promise.all([fetchItemDrawState(supabase, userId), fetchSponsorDraws(supabase)]).then(([saved, sponsors]) => {
      setDrawState(saved ?? { levelUpTotal: 0, levelUpRemaining: [], blueRemaining: [...blueValues], yellowRemaining: [...yellowValues], sponsorshipMoneyClaimed: 0 })
      setSponsorDraws(sponsors)
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
    setReplacement(null)
    if (type === 'yellow' || type === 'blue') {
      const values = type === 'blue' ? blueValues : yellowValues
      setPendingItems(values.map((value, sponsorIndex) => ({ value, sponsorIndex }))
        .filter((item) => !sponsorDraws.some((draw) => draw.sponsorType === type && draw.sponsorIndex === item.sponsorIndex))
        .map((item) => ({ label: type === 'blue' ? 'Patrocínio azul' : 'Patrocínio amarelo', value: item.value, sponsorIndex: item.sponsorIndex })))
      return
    }
    const levelUpItems = type === 'prizes'
      ? drawState.levelUpRemaining.map(() => ({ label: 'LEVEL-UP', value: 0 }))
      : []
    setPendingItems([...prepareDrawItems(type), ...levelUpItems])
  }

  useEffect(() => {
    if (!openPrizeDraw || !drawState || isLoading) return
    openDraw('prizes')
    onPrizeDrawOpened?.()
  }, [openPrizeDraw, drawState, isLoading])

  useEffect(() => {
    if (!openItemDraw || !drawState || isLoading) return
    let active = true
    const prepareRequestedDraw = async () => {
      let currentState = drawState
      if (userId) {
        try {
          currentState = await fetchItemDrawState(supabase, userId) ?? drawState
          if (active) setDrawState(currentState)
        } catch {
          if (active) setError('Não foi possível verificar o cadastro de LEVEL-UP.')
          return
        }
      }
      if (!active) return
      if (openItemDraw === 'prizes' && currentState.levelUpTotal === 0) {
        setActiveTab('level-up')
        onItemDrawOpened?.()
        onItemDrawNeedsSetup?.()
        return
      }
      setActiveTab('draws')
      openDraw(openItemDraw)
      onItemDrawOpened?.()
    }
    void prepareRequestedDraw()
    return () => {
      active = false
    }
  }, [openItemDraw, drawState, isLoading, userId])

  const clearDraw = () => {
    if (!drawState) return
    persistState({ ...drawState, levelUpTotal: 0, levelUpRemaining: [], sponsorshipMoneyClaimed: 0 })
    if (userId) {
      const ownDraws = sponsorDraws.filter((draw) => draw.userId === userId)
      void Promise.all(ownDraws.map((draw) => deleteSponsorDraw(supabase, draw)))
        .then(() => setSponsorDraws((draws) => draws.filter((draw) => draw.userId !== userId)))
        .catch(() => setError('Não foi possível limpar os patrocínios.'))
    }
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
    if (type === 'yellow') return yellowValues.length - sponsorDraws.filter((draw) => draw.sponsorType === 'yellow').length
    if (type === 'blue') return blueValues.length - sponsorDraws.filter((draw) => draw.sponsorType === 'blue').length
    return prizeItems.length + (drawState?.levelUpRemaining.length ?? 0)
  }
  const totalSponsorship = sponsorDraws
    .filter((draw) => draw.userId === userId)
    .reduce((total, draw) => total + draw.value, 0)
  const claimSponsorship = () => {
    if (totalSponsorship <= 0) return
    onPrizeMoney(totalSponsorship)
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
    if ((drawType === 'prizes' && item.label === 'Prêmio') || (drawType === 'investment' && item.value > 0)) onPrizeMoney(item.value)
    if (drawState && (drawType === 'blue' || drawType === 'yellow' || (drawType === 'prizes' && item.label === 'LEVEL-UP'))) {
      if (drawType === 'prizes' && item.label === 'LEVEL-UP') {
        const levelUpIndex = pendingItems
          .slice(0, itemIndex)
          .filter((pendingItem) => pendingItem.label === 'LEVEL-UP').length
        persistState({ ...drawState, levelUpRemaining: drawState.levelUpRemaining.filter((_, index) => index !== levelUpIndex) })
        return
      }
      if ((drawType === 'blue' || drawType === 'yellow') && item.sponsorIndex !== undefined && userId) {
        const sponsorDraw: SponsorDraw = { sponsorType: drawType, sponsorIndex: item.sponsorIndex, value: item.value, userId }
        const current = sponsorDraws.find((draw) => draw.sponsorType === drawType && draw.userId === userId)
        if (current) {
          setReplacement({ current, candidate: sponsorDraw })
        } else {
          void saveSponsorDraw(supabase, sponsorDraw)
            .then(() => setSponsorDraws((draws) => [...draws, sponsorDraw]))
            .catch(() => setError('Não foi possível salvar o patrocínio sorteado.'))
        }
      }
    }
  }

  const chooseSponsor = async (choice: 'current' | 'candidate') => {
    if (!replacement) return
    if (choice === 'current') {
      const keptItem: DrawItem = {
        label: replacement.current.sponsorType === 'blue' ? 'Patrocínio azul' : 'Patrocínio amarelo',
        value: replacement.current.value,
        sponsorIndex: replacement.current.sponsorIndex,
      }
      setCurrentItem(keptItem)
      setDrawnItems([keptItem])
      setReplacement(null)
      return
    }
    try {
      await deleteSponsorDraw(supabase, replacement.current)
      await saveSponsorDraw(supabase, replacement.candidate)
      setSponsorDraws((draws) => [...draws.filter((draw) => draw !== replacement.current), replacement.candidate])
      const keptItem: DrawItem = {
        label: replacement.candidate.sponsorType === 'blue' ? 'Patrocínio azul' : 'Patrocínio amarelo',
        value: replacement.candidate.value,
        sponsorIndex: replacement.candidate.sponsorIndex,
      }
      setCurrentItem(keptItem)
      setDrawnItems([keptItem])
      setReplacement(null)
    } catch {
      try {
        await saveSponsorDraw(supabase, replacement.current)
      } catch {
        setError('Não foi possível restaurar o patrocínio atual.')
        return
      }
      setError('Não foi possível substituir o patrocínio.')
    }
  }

  const title = drawType === 'yellow' ? 'Patrocinadores amarelos' : drawType === 'blue' ? 'Patrocinadores azuis' : drawType === 'prizes' ? 'Prêmios' : drawType === 'level-up' ? 'LEVEL-UP' : 'Investimentos'
  const drawTotal = drawType === 'prizes' ? 32 + (drawState?.levelUpTotal ?? 0) : drawType === 'yellow' ? yellowValues.length : drawType === 'blue' ? blueValues.length : 25
  const closeDraw = () => {
    setDrawType(null)
    setDrawnItems([])
    setPendingItems([])
    setCurrentItem(null)
    setReplacement(null)
  }

  return <main className={modalOnly ? 'items-page items-page-modal-only' : 'items-page'}>
    <AppHeader activePage="items" onNavigate={onNavigate} money={money} teamPower={teamPower} />
    <section className="items-heading">
      <div><h2>Categorias de itens</h2><p>Sorteios únicos · Resultados revelados um por vez</p></div>
      <span className="items-status"><i /> EM CONFIGURAÇÃO</span>
    </section>
    <div className="items-tabs" role="tablist" aria-label="Seções de itens">
      <button className={activeTab === 'draws' ? 'items-tab-active' : ''} onClick={() => setActiveTab('draws')} role="tab" aria-selected={activeTab === 'draws'} type="button">Sorteios</button>
      <button className={activeTab === 'level-up' ? 'items-tab-active' : ''} onClick={() => setActiveTab('level-up')} role="tab" aria-selected={activeTab === 'level-up'} type="button">Cadastrar LEVEL-UP</button>
    </div>
    {activeTab === 'draws' && <>
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
        {(category.key === 'yellow' || category.key === 'blue') && sponsorDraws.filter((draw) => draw.sponsorType === category.key && draw.userId === userId).map((draw) => <div className="sponsor-draw-record" key={`${draw.sponsorType}-${draw.sponsorIndex}`}><span>€ {draw.value} mi</span></div>)}
      </article>)}
    </section>
    <div className="sponsorship-total"><div><span>VALOR TOTAL DOS PATROCÍNIOS</span><strong>€ {totalSponsorship} mi</strong></div><button onClick={claimSponsorship} disabled={totalSponsorship <= 0}>Adicionar valor ao caixa</button></div>
    <div className="item-draw-actions"><button onClick={clearDraw} disabled={!userId || isLoading}>Limpar sorteios</button></div>
    {!userId && <p className="auth-message">Entre na sua conta para usar e salvar os sorteios.</p>}
    {error && <p className="form-error">{error}</p>}
    <footer>Os sorteios azul, amarelo e LEVEL-UP ficam salvos por usuário.</footer>
    </>}
    {activeTab === 'level-up' && <section className="level-up-setup-panel">
      <span className="eyebrow">CONFIGURAÇÃO DE PRÊMIOS</span>
      <h2>Cadastrar LEVEL-UP</h2>
      <p>Defina quantos LEVEL-UP estarão disponíveis no sorteio de prêmios.</p>
      <label htmlFor="level-up-tab-count">Quantidade de LEVEL-UP</label>
      <select id="level-up-tab-count" value={drawState?.levelUpTotal ?? 0} onChange={(event) => updateLevelUpCount(Number(event.target.value))} disabled={!userId || isLoading || (drawState?.levelUpTotal ?? 0) > 0}>
        {Array.from({ length: 26 }, (_, index) => <option key={index} value={index}>{index}</option>)}
      </select>
      {(drawState?.levelUpTotal ?? 0) > 0 && <p className="level-up-registered">{drawState?.levelUpTotal} LEVEL-UP cadastrado(s).</p>}
    </section>}
    {drawType && <div className="item-modal-backdrop" role="presentation">
      <section className="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-draw-title">
        <button className="item-modal-close" onClick={closeDraw} aria-label="Fechar sorteio">×</button>
        <span className="eyebrow">SORTEIO ÚNICO</span>
        <h2 id="item-draw-title">{title} <small>{drawnItems.length} / {drawTotal}</small></h2>
        <div className={`item-draw-value ${currentItem?.label === 'Não encontrou investimento' ? 'item-draw-empty' : ''}`}>
          {currentItem ? <><strong>{currentItem.label}</strong>{currentItem.label !== 'Não encontrou investimento' && currentItem.label !== 'LEVEL-UP' && <span>€ {currentItem.value} mi</span>}</> : '—'}
        </div>
        {replacement && <div className="sponsor-replacement">
          <p>Você já tem um patrocínio {replacement.current.sponsorType === 'blue' ? 'azul' : 'amarelo'}. Escolha qual vai permanecer:</p>
          <div>
            <button onClick={() => void chooseSponsor('current')}><strong>MANTER</strong><span>€ {replacement.current.value} mi</span></button>
            <button onClick={() => void chooseSponsor('candidate')}><strong>TROCAR</strong><span>€ {replacement.candidate.value} mi</span></button>
          </div>
        </div>}
        <div className="item-draw-actions"><button className="primary-draw-button" onClick={drawnItems.length >= 1 ? closeDraw : drawItem} disabled={drawnItems.length === 0 && pendingItems.length === 0}>{drawnItems.length >= 1 ? 'Fechar modal' : 'Sortear resultado'}</button></div>
      </section>
    </div>}
  </main>
}
