# Instruções do Copilot — Deck Building de Futebol

## Objetivo e escopo atual

Criar um jogo de **Deck Building de futebol**, inicialmente com foco exclusivo na **estrutura Front-end**. Não implementar sorteios, compras, rodadas, partidas, campeonatos ou qualquer jogabilidade antes de suas regras serem definidas e solicitadas.

Antes de modificar código, inspecionar a estrutura existente, reutilizar componentes e padrões, explicar brevemente a abordagem e limitar mudanças ao solicitado. Priorizar TypeScript, funções puras para regras, componentes reutilizáveis e testes. Não instalar dependências sem necessidade.

## Fonte de dados e API fake

- Manter **exatamente 500 cartas** em `src/data/players.json`, versionado no projeto e estável entre execuções.
- Expor a base por uma **API fake local**, sem banco de dados nem API externa. Se o projeto usar Next.js App Router, preferir Route Handlers (`GET /api/players` e `GET /api/players/[id]`), com filtros opcionais de posição, habilidade e preço. Caso use outra stack, adaptar à estrutura existente.
- Os componentes de UI devem consumir a camada de serviço da API, e não importar diretamente o JSON.
- O JSON é o catálogo imutável. Quando houver jogabilidade, o estado dos times e da partida deverá ficar separado; definir persistência nessa fase.
- Gerar a base uma única vez por script reproduzível e validar o resultado. Não gerar novos jogadores em cada carregamento.

## Estrutura das cartas

```ts
type PlayerPosition = 'GOL' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'ATA';

interface FootballPlayer {
  id: string;
  name: string;
  age: number;
  nationality: string;
  positions: PlayerPosition[];
  skill: number;
  value: number; // milhões
}

interface DeckCard {
  playerId: string;
  assignedPosition: PlayerPosition;
}
```

- Cada carta tem ID único, habilidade inteira entre **11 e 21**, e **1 a 3 posições distintas e válidas**.
- Uma carta ocupa uma única vaga e só pode ser escalada em uma de suas posições.
- Não usar o campo singular `position` para representar as posições da carta.

## Distribuição exata de habilidades — 500 cartas

| Habilidade | Quantidade | Percentual |
| --- | ---: | ---: |
| 11 a 15 | 300 | 60% |
| 16 a 19 | 150 | 30% |
| 20 | 35 | 7% |
| 21 | 15 | 3% |

Dentro de cada faixa, distribuir de modo variado, sem mudar os totais. Nenhuma carta pode ter habilidade abaixo de 11 ou acima de 21.

## Distribuição exata da quantidade de posições — 500 cartas

| Quantidade de posições | Quantidade | Percentual |
| --- | ---: | ---: |
| 1 | 325 | 65% |
| 2 | 125 | 25% |
| 3 | 50 | 10% |

As duas distribuições acima são requisitos independentes e devem ser validadas simultaneamente. Escolher combinações de posições plausíveis para futebol; não definir restrições adicionais de combinações sem autorização.

## Tabela oficial de valores (em milhões)

O preço depende **exclusivamente da habilidade e da quantidade de posições**, conforme esta tabela; não usar fórmulas antigas nem multiplicadores. Preço mínimo: **2 milhões**; máximo: **70 milhões**.

| Habilidade | 1 posição | 2 posições | 3 posições |
| --- | ---: | ---: | ---: |
| 11 | 2 | 5 | 8 |
| 12 | 4 | 7 | 10 |
| 13 | 6 | 9 | 12 |
| 14 | 9 | 12 | 15 |
| 15 | 12 | 16 | 20 |
| 16 | 16 | 21 | 26 |
| 17 | 21 | 27 | 33 |
| 18 | 27 | 34 | 41 |
| 19 | 34 | 42 | 50 |
| 20 | 42 | 51 | 60 |
| 21 | 50 | 60 | 70 |

Um jogador de habilidade 20 com 3 posições (60 milhões) vale mais que um jogador de habilidade 21 com 1 posição (50 milhões). A habilidade mede a qualidade individual; a versatilidade agrega valor estratégico, sem aumentar a habilidade. Centralizar a consulta de preço em uma função e rejeitar entradas inválidas.

## Participantes e estrutura de times (regras para validação, sem jogabilidade agora)

- De **1 a 5 participantes**, cada um controla um time com orçamento próprio em milhões.
- Cada time pode conter **até 11 cartas**.
- A composição de um time completo deve ser exatamente:

| Posição | Vagas |
| --- | ---: |
| GOL | 1 |
| ZAG | 2 |
| LAT | 2 |
| VOL | 1 |
| MEI | 2 |
| ATA | 3 |
| **Total** | **11** |

- Não ultrapassar a quantidade de vagas por posição.
- Não permitir o mesmo jogador em dois times ou duas vagas ao mesmo tempo.
- Uma carta mult posição pode ocupar **uma** das posições indicadas nela, nunca mais de uma simultaneamente.
- Manter validações de composição separadas da UI; a implementação do sorteio e aquisição ficará para etapa posterior.

## Interface inicial

Criar somente a estrutura e componentes necessários para visualizar as cartas, suas habilidades, valores e posições, respeitando os padrões e a stack já presentes no projeto. Não presumir fluxos de compra ou sorteio.

## Testes e critérios de aceite

Validar automaticamente:

1. Exatamente 500 cartas e IDs únicos.
2. Habilidades inteiras de 11 a 21; totais de **300 / 150 / 35 / 15** por faixa.
3. Quantidades de posições de **325 / 125 / 50** para 1 / 2 / 3 posições.
4. Posições válidas e sem repetição em cada carta.
5. Valores iguais à tabela oficial, sempre entre 2 e 70 milhões.
6. A API fake retorna os dados corretos, sem alterar o JSON.
7. As funções de validação impedem exceder 11 cartas, ultrapassar vagas, atribuir posição inexistente ou duplicar cartas.

Não alterar as regras sem autorização. Ao finalizar cada tarefa, listar arquivos modificados, testes executados e pendências.

## Mecânicas futuras (não implementar)

Sorteio de cartas, aquisição, turnos, orçamento inicial, descarte, persistência de partida, campeonatos e simulação de partidas ainda dependem de decisões de jogabilidade. Não inventar esses detalhes.
