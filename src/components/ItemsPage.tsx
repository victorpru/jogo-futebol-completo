import { useState } from 'react'
import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'

interface ItemsPageProps {
  onNavigate: (page: HeaderPage) => void
}

type DrawType = 'yellow' | 'blue' | 'investment' | 'prizes'
type DrawItem = { label: string; value: number }
const levelUpStorageKey = 'deck-fc:prizes-level-up-count'

const yellowCompanies = ['Aurora Motors', 'Boreal Foods', 'Céu Azul Energia', 'Delta Mobile', 'Estrela Bank', 'Futura Labs', 'Granito Motors', 'Horizonte Saúde', 'Íris Telecom', 'Jatobá Bebidas', 'Lume Sports', 'Maré Alta', 'Nexum Tech', 'Orbe Seguros', 'Pioneira Logística', 'Quasar Finance', 'Rota 21', 'Semente Viva', 'Trópico Wear', 'União Digital', 'Vale Norte', 'W1 Construções', 'Xênia Cosméticos', 'Yara Transportes', 'Zênite Hotels']
const blueCompanies = ['Atlas Cloud', 'Brisa Airlines', 'Conecta Pay', 'Dínamo Fitness', 'Eclipse Motors', 'Farol Mídia', 'Gênesis Foods', 'Hidro Mais', 'Impacto Solar', 'Jardim Real', 'Kairós Health', 'Lagoa Bank', 'Mosaico Design', 'Nobre Motors', 'Onda Telecom']

const itemCategories = [
  { key: 'yellow', eyebrow: 'PATROCINADORES', title: 'Patrocinadores amarelos', description: '25 empresas fictícias com valores de € 1 a € 25 milhões.', accent: 'yellow', count: 25 },
  { key: 'blue', eyebrow: 'PATROCINADORES', title: 'Patrocinadores azuis', description: '15 empresas fictícias com valores de € 1 a € 15 milhões.', accent: 'blue', count: 15 },
  { key: 'investment', eyebrow: 'RECURSOS', title: 'Investimentos', description: 'Um sorteio único com 25 resultados.', accent: 'green', count: 25 },
  { key: 'prizes', eyebrow: 'RECOMPENSAS', title: 'Prêmios', description: '25 prêmios-base e LEVEL-UP configurável.', accent: 'purple', count: 25 },
] as const

function createPrizeItems(levelUpCount: number): DrawItem[] {
  return [
    ...Array.from({ length: 25 }, () => ({ label: 'Prêmio', value: Math.floor(Math.random() * 21) + 5 })),
    ...Array.from({ length: levelUpCount }, () => ({ label: 'LEVEL-UP', value: 0 })),
  ]
}

function prepareDrawItems(type: DrawType, levelUpCount = 0): DrawItem[] {
  const items = type === 'yellow'
    ? yellowCompanies.map((label, index) => ({ label, value: index + 1 }))
    : type === 'blue'
      ? blueCompanies.map((label, index) => ({ label, value: index + 1 }))
      : type === 'prizes'
        ? createPrizeItems(levelUpCount)
      : [
          ...Array.from({ length: 10 }, () => ({ label: 'Investimento', value: Math.floor(Math.random() * 21) + 5 })),
          ...Array.from({ length: 15 }, () => ({ label: 'Não encontrou investimento', value: 0 })),
        ]
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temporary = items[index]
    items[index] = items[randomIndex]
    items[randomIndex] = temporary
  }
  return items
}

function getStoredLevelUpCount() {
  const storedValue = Number(window.localStorage.getItem(levelUpStorageKey))
  return Number.isInteger(storedValue) && storedValue >= 0 && storedValue <= 25 ? storedValue : 0
}

export function ItemsPage({ onNavigate }: ItemsPageProps) {
  const [drawType, setDrawType] = useState<DrawType | null>(null)
  const [drawnItems, setDrawnItems] = useState<DrawItem[]>([])
  const [pendingItems, setPendingItems] = useState<DrawItem[]>([])
  const [currentItem, setCurrentItem] = useState<DrawItem | null>(null)
  const [levelUpCount, setLevelUpCount] = useState(getStoredLevelUpCount)

  const openDraw = (type: DrawType) => {
    setDrawType(type)
    setDrawnItems([])
    setCurrentItem(null)
    setPendingItems(prepareDrawItems(type, levelUpCount))
  }

  const clearLevelUpCount = () => {
    setLevelUpCount(0)
    window.localStorage.removeItem(levelUpStorageKey)
  }

  const updateLevelUpCount = (value: number) => {
    setLevelUpCount(value)
    window.localStorage.setItem(levelUpStorageKey, String(value))
  }

  const drawItem = () => {
    if (!drawType) return
    if (drawnItems.length >= 1) return
    const item = pendingItems[0]
    if (!item) return
    setDrawnItems((items) => [...items, item])
    setPendingItems((items) => items.slice(1))
    setCurrentItem(item)
  }

  const title = drawType === 'yellow' ? 'Patrocinadores amarelos' : drawType === 'blue' ? 'Patrocinadores azuis' : drawType === 'prizes' ? 'Prêmios' : 'Investimentos'
  const drawTotal = drawType === 'prizes' ? 25 + levelUpCount : drawType === 'yellow' ? 25 : drawType === 'blue' ? 15 : 25
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
        <div className="item-category-footer"><strong>{category.count === null ? '—' : category.count}</strong><span>{category.count === null ? 'itens cadastrados' : 'itens no sorteio'}</span></div>
        {category.key === 'prizes' && <div className="level-up-main-control">
          <label htmlFor="level-up-count">LEVEL-UP no sorteio</label>
          <select id="level-up-count" value={levelUpCount} onChange={(event) => updateLevelUpCount(Number(event.target.value))} disabled={levelUpCount > 0}>
            {Array.from({ length: 26 }, (_, index) => <option key={index} value={index}>{index}</option>)}
          </select>
          {levelUpCount > 0 && <button onClick={clearLevelUpCount}>Limpar</button>}
        </div>}
        <button className="item-draw-button" onClick={() => openDraw(category.key)}>Abrir sorteio</button>
      </article>)}
    </section>
    <footer>Os efeitos, quantidades e regras dos itens serão configurados nas próximas etapas.</footer>
    {drawType && <div className="item-modal-backdrop" role="presentation">
      <section className="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-draw-title">
        <button className="item-modal-close" onClick={closeDraw} aria-label="Fechar sorteio">×</button>
        <span className="eyebrow">SORTEIO ÚNICO</span>
        <h2 id="item-draw-title">{title} <small>{drawnItems.length} / {drawTotal}</small></h2>
        <div className={`item-draw-value ${currentItem?.label === 'Não encontrou investimento' ? 'item-draw-empty' : ''}`}>
          {currentItem ? <><strong>{currentItem.label}</strong>{currentItem.label !== 'Não encontrou investimento' && currentItem.label !== 'LEVEL-UP' && <span>€ {currentItem.value} mi</span>}</> : '—'}
        </div>
        <div className="item-draw-actions"><button className="primary-draw-button" onClick={drawItem} disabled={drawnItems.length >= 1}>{drawnItems.length >= 1 ? 'Feche para sortear novamente' : 'Sortear resultado'}</button></div>
      </section>
    </div>}
  </main>
}
