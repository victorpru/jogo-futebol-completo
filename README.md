# Deck FC

Aplicação front-end de um jogo de Deck Building de futebol. A tela de catálogo
de cartas foi removida nesta etapa. O projeto mantém login, times por usuário,
itens, sorteio NPC e histórico de vencedores.

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

O botão **Entrar** no cabeçalho permite criar uma conta, fazer login com e-mail
ou Google e sair. Para ativar o Google, configure o provedor em
Authentication → Providers no Supabase e informe a URL do site em
Authentication → URL Configuration. A
confirmação de e-mail segue a configuração de Authentication → Providers no
projeto Supabase. Para salvar o orçamento e o elenco por usuário, execute o
conteúdo de [team-state.sql](./supabase/team-state.sql) no SQL Editor do
Supabase. As políticas RLS garantem que cada conta só leia e altere o próprio
time. O orçamento, o elenco, as posições e a configuração de LEVEL-UP ficam no
Supabase; não há persistência desses dados no navegador. Cartas, sorteio NPC e
histórico permanecem nas APIs locais existentes.

Para configurar o histórico de vencedores, execute [winners.sql](./supabase/winners.sql)
no SQL Editor. Usuários autenticados podem visualizar o histórico, mas somente
`prudencio.vic@gmail.com` pode adicionar, alterar ou remover registros.

Para salvar os sorteios de patrocínios e LEVEL-UP por usuário, execute
[item-draw-state.sql](./supabase/item-draw-state.sql) no SQL Editor. Cada
resultado sorteado é removido do pool até que o usuário clique em limpar
sorteios. Prêmios e investimentos continuam sorteios sem pool persistente.

## Navegação

A aplicação possui três áreas separadas:

- Home (`#home`): orçamento e elenco do usuário.
- Sorteio NPC (`#sorteio-npc`): sorteio sequencial dos 11 jogadores de um time NPC.

A tela atual fica registrada no hash da URL para que o refresh preserve a página aberta.

## Executar e validar

```bash
npm install
npm run dev
```

Validações:

```bash
npm run typecheck
npm run lint
npm run build
```

## Times NPC

Os times NPC da tabela de referência estão cadastrados em [npcTeams.ts](./src/data/npcTeams.ts). Cada registro possui `id`, `name`, uma lista `playerPowers` com os 11 poderes individuais e o `power` total. Por exemplo, `3 × 20` significa três jogadores com poder 20.

A página de sorteio embaralha esses 11 jogadores sem repetir jogador dentro do resultado. Poderes iguais podem aparecer quando a distribuição do time possui multiplicidade, mas cada posição sorteada tem um jogador NPC próprio. A implementação de campeonatos e partidas ainda não faz parte desta etapa.

O botão **Sortear jogadores** abre um modal sequencial. O jogador atual aparece no centro, os jogadores já revelados ficam à esquerda e o próximo jogador permanece oculto à direita. As setas permitem voltar ou avançar, e o botão é bloqueado depois do 11º jogador.
