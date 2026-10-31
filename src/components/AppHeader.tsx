export type HeaderPage = 'home' | 'catalog' | 'npc' | 'items' | 'winners' | 'rules'

interface AppHeaderProps {
  activePage: HeaderPage
  onNavigate: (page: HeaderPage) => void
}

export function AppHeader({ activePage, onNavigate }: AppHeaderProps) {
  return <header className="header">
    <div className="logo"><span>◆</span> DECK<span>FC</span></div>
    <div className="header-copy"><span>FOOTBALL DECK BUILDING</span><strong>Construção de deck</strong></div>
    <nav className="main-nav" aria-label="Navegação principal">
      <button className={activePage === 'home' ? 'nav-active' : ''} onClick={() => onNavigate('home')}>Home</button>
      <button className={activePage === 'catalog' ? 'nav-active' : ''} onClick={() => onNavigate('catalog')}>Cartas</button>
      <button className={activePage === 'npc' ? 'nav-active' : ''} onClick={() => onNavigate('npc')}>Sorteio NPC</button>
      <button className={activePage === 'items' ? 'nav-active' : ''} onClick={() => onNavigate('items')}>Itens</button>
      <button className={activePage === 'winners' ? 'nav-active' : ''} onClick={() => onNavigate('winners')}>Vencedores</button>
      <button className={activePage === 'rules' ? 'nav-active' : ''} onClick={() => onNavigate('rules')}>Regras</button>
    </nav>
  </header>
}
