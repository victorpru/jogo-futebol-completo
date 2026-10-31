import { AppHeader } from './AppHeader'
import type { HeaderPage } from './AppHeader'

interface RulesPageProps {
  onNavigate: (page: HeaderPage) => void
}

const rules = [
  { title: 'Escolha a cor do seu pino', text: 'Depois de escolher os jogadores, escolha a cor do pino que vai representar você no tabuleiro.' },
  { title: 'Escolha dos jogadores', text: 'Serão 5 rodadas de escolha, com 8 jogadores disponíveis por mão.' },
  { title: 'Monte seu time', text: 'Escolha os jogadores para formar o seu time.' },
  { title: 'Orçamento inicial', text: 'Todos os jogadores começam com 300 milhões.' },
  { title: 'Campeonatos', text: 'Paulista: 8 times.\nCopa do Brasil: 16 times, tirando os 3 melhores times.\nBrasileiro: 16 times, somente os melhores.\nLibertadores: os 4 melhores do Brasileiro, o campeão da Copa do Brasil e os times argentinos.' },
  { title: 'Premiações dos campeonatos', text: 'Em cada campeonato, o primeiro e o segundo colocados recebem o mesmo valor em dinheiro. O primeiro colocado também recebe um prêmio adicional, e o terceiro colocado recebe uma premiação menor.\n\nPaulista: primeiro — 10 milhões + um prêmio; segundo — 10 milhões; terceiro — 5 milhões.\nCopa do Brasil: primeiro — 15 milhões + um prêmio; segundo — 15 milhões; terceiro — 7 milhões.\nBrasileiro: primeiro — 20 milhões + um prêmio; segundo — 20 milhões; terceiro — 10 milhões.\nLibertadores: primeiro — 25 milhões + um prêmio; segundo — 25 milhões; terceiro — 12 milhões.' },
  { title: 'Vitórias no torneio', text: 'Cada vitória conquistada no torneio vale 5 milhões.' },
  { title: 'Início do jogo', text: 'Depois que todas as escolhas e preparações forem concluídas, o jogo começa.' },
  { title: 'Avanço dos campeonatos', text: 'Depois de 3 rodadas de cada jogador, o próximo campeonato começa automaticamente.' },
  { title: 'Casas do tabuleiro', text: 'O tabuleiro possui 5 casas. Cada casa leva a uma ação diferente:\n\n1. Negociação.\n2. Buscar patrocínio.\n3. Amistoso.\n4. Buscar investimento.\n5. Iniciar o campeonato antes da 3ª rodada.' },
  { title: '1 — Negociação', text: 'Na negociação, existem 3 pilhas de jogadores:\n\n1. Jogadores de poder 11 a 15: pegue 8 cartas e não gaste nada para entrar.\n2. Jogadores de poder 16 a 19: pegue 5 cartas e não gaste nada para entrar.\n3. Jogadores de poder 20 a 21: pegue 3 cartas, escolha somente 1 e pague 20 milhões para entrar nessa pilha.' },
  { title: '2 — Buscar patrocínio', text: 'Você sorteará um patrocínio azul ou amarelo.' },
  { title: '3 — Amistoso', text: 'Você sorteará um dos times NPC para jogar contra. O sorteio também definirá as cores dos jogadores adversários.' },
  { title: '4 — Buscar investimento', text: 'Você sorteará um investimento.' },
  { title: '5 — Iniciar o campeonato', text: 'O campeonato será iniciado antes da 3ª rodada.' },
  { title: 'Bônus depois da Copa do Brasil', text: 'Depois da Copa do Brasil, cada jogador ganha 100 milhões.' },
  { title: 'Regra extra: pular a vez', text: 'Ao pular a sua vez, você pode dar upgrade no jogador de sua escolha por 50 milhões.' },
]

export function RulesPage({ onNavigate }: RulesPageProps) {
  return <main className="rules-page">
    <AppHeader activePage="rules" onNavigate={onNavigate} />
    <section className="rules-hero">
      <span className="eyebrow">FOOTBALL DECK BUILDING · REGRAS</span>
      <h1>Entenda como<br /><em>o jogo funciona.</em></h1>
      <p>Consulte as regras definidas para montar seu time e escolher suas cartas.</p>
    </section>
    <section className="rules-content">{rules.map((rule, index) => <article className={`rule-card${index === 0 ? ' rule-card-main' : ''}`} key={rule.title}>
      <span className="rule-number">{String(index + 1).padStart(2, '0')}</span>
      <div><h2>{rule.title}</h2><p>{rule.text}</p></div>
    </article>)}</section>
    <section className="rules-summary">
      <span className="eyebrow">RESUMO</span>
      <strong>5 rodadas × 8 jogadores por mão</strong>
      <span>Monte seu time, escolha seu pino e comece com 300 milhões.</span>
    </section>
    <footer>Novas regras serão adicionadas conforme forem definidas.</footer>
  </main>
}
