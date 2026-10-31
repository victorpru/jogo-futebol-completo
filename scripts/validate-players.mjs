import { readFile } from 'node:fs/promises'

const players = JSON.parse(await readFile('src/data/players.json', 'utf8'))
const validPositions = new Set(['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'])
const prices = {
  11: [2, 5, 8], 12: [4, 7, 10], 13: [6, 9, 12], 14: [9, 12, 15],
  15: [12, 16, 20], 16: [16, 21, 26], 17: [21, 27, 33], 18: [27, 34, 41],
  19: [34, 42, 50], 20: [42, 51, 60], 21: [50, 60, 70],
}
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const count = (items, predicate) => items.filter(predicate).length

assert(players.length === 500, 'A base precisa conter exatamente 500 cartas.')
assert(new Set(players.map((player) => player.id)).size === 500, 'IDs duplicados.')
assert(count(players, (player) => player.skill >= 11 && player.skill <= 15) === 300, 'Faixa 11-15 inválida.')
assert(count(players, (player) => player.skill >= 16 && player.skill <= 19) === 150, 'Faixa 16-19 inválida.')
assert(count(players, (player) => player.skill === 20) === 35, 'Quantidade de cartas 20 inválida.')
assert(count(players, (player) => player.skill === 21) === 15, 'Quantidade de cartas 21 inválida.')
assert(count(players, (player) => player.positions.length === 1) === 325, 'Quantidade de cartas com 1 posição inválida.')
assert(count(players, (player) => player.positions.length === 2) === 125, 'Quantidade de cartas com 2 posições inválida.')
assert(count(players, (player) => player.positions.length === 3) === 50, 'Quantidade de cartas com 3 posições inválida.')
for (const player of players) {
  assert(Number.isInteger(player.skill) && player.skill >= 11 && player.skill <= 21, `${player.id}: habilidade inválida.`)
  assert(player.positions.length >= 1 && player.positions.length <= 3, `${player.id}: posições inválidas.`)
  assert(new Set(player.positions).size === player.positions.length && player.positions.every((position) => validPositions.has(position)), `${player.id}: posições repetidas ou inválidas.`)
  assert(player.value === prices[player.skill][player.positions.length - 1], `${player.id}: preço incompatível.`)
}
console.log(`Validado: ${players.length} cartas, distribuições e preços oficiais corretos.`)
