# Deck FC

Catálogo front-end de um jogo de Deck Building de futebol. Nesta etapa o projeto implementa somente a visualização das cartas e a API fake local. Não há sorteios, aquisição, orçamento, partidas, campeonatos ou persistência de jogabilidade.

## Stack

- React 19
- TypeScript
- Vite
- LocalStorage ainda não é utilizado nesta etapa, pois as regras de persistência da partida serão definidas posteriormente.
- Supabase Auth para cadastro, login e encerramento de sessão.

## Configuração do Supabase

Crie um arquivo `.env.local` na raiz do projeto durante o desenvolvimento local:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

Na Vercel, cadastre as mesmas variáveis em **Settings → Environment Variables** para
Production, Preview e Development. A chave publishable pode ser usada no frontend;
chaves `service_role` ou `sb_secret_` nunca devem ser expostas.

O botão **Entrar** no cabeçalho permite criar uma conta, fazer login e sair. A
confirmação de e-mail segue a configuração de Authentication → Providers no
projeto Supabase. Cartas, sorteio NPC e histórico permanecem nas APIs locais
existentes; nenhuma tabela de jogabilidade foi criada nesta etapa.

## Catálogo e API fake

O arquivo [players.json](./src/data/players.json) contém exatamente 500 cartas estáveis e versionadas. A aplicação não importa esse JSON nos componentes: a tela consulta a camada [playersApi.ts](./src/services/playersApi.ts), que usa os endpoints providos pelo plugin local do Vite:

```text
GET /api/players
GET /api/players/:id
GET /api/players?position=ATA
GET /api/players?minSkill=15
GET /api/players?maxValue=30
```

As respostas são padronizadas com `data`, `total` e `filters`. O catálogo é somente leitura e não é alterado durante a execução.

## Navegação

A aplicação possui três áreas separadas:

- Home (`#home`): página inicial reservada para futuras informações dos jogadores.
- Catálogo (`#catalogo`): consulta visual das 500 cartas.
- Sorteio NPC (`#sorteio-npc`): sorteio sequencial dos 11 jogadores de um time NPC.

A tela atual fica registrada no hash da URL para que o refresh preserve a página aberta.

## Regras implementadas

- Habilidade inteira entre 11 e 21.
- Distribuição de habilidades: 300 cartas entre 11–15, 150 entre 16–19, 35 com 20 e 15 com 21.
- Distribuição de posições: 325 cartas com 1 posição, 125 com 2 e 50 com 3.
- Posições válidas: `GOL`, `ZAG`, `LAT`, `VOL`, `MEI`, `ATA`.
- Preços conforme a tabela oficial por habilidade e quantidade de posições.
- Funções puras para preço oficial e validação futura de decks em [gameRules.ts](./src/utils/gameRules.ts).

## Executar e validar

```bash
npm install
npm run dev
```

Validações:

```bash
npm run validate:data
npm run typecheck
npm run lint
npm run build
```

O catálogo pode ser regenerado somente de forma explícita pelo script reproduzível:

```bash
node scripts/generate-players.mjs
```

## Times NPC

Os times NPC da tabela de referência estão cadastrados em [npcTeams.ts](./src/data/npcTeams.ts). Cada registro possui `id`, `name`, uma lista `playerPowers` com os 11 poderes individuais e o `power` total. Por exemplo, `3 × 20` significa três jogadores com poder 20.

A página de sorteio embaralha esses 11 jogadores sem repetir jogador dentro do resultado. Poderes iguais podem aparecer quando a distribuição do time possui multiplicidade, mas cada posição sorteada tem um jogador NPC próprio. A implementação de campeonatos e partidas ainda não faz parte desta etapa.

O botão **Sortear jogadores** abre um modal sequencial. O jogador atual aparece no centro, os jogadores já revelados ficam à esquerda e o próximo jogador permanece oculto à direita. As setas permitem voltar ou avançar, e o botão é bloqueado depois do 11º jogador.
