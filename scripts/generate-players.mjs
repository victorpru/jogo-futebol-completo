import { mkdir, writeFile } from 'node:fs/promises'

const firstNames = ['Alex', 'Bruno', 'Caio', 'Davi', 'Enzo', 'Felipe', 'Gustavo', 'Hugo', 'Igor', 'João', 'Kaique', 'Lucas', 'Mateus', 'Nicolas', 'Otávio', 'Pedro', 'Rafael', 'Samuel', 'Theo', 'Vitor']
const lastNames = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Henrique', 'Ibrahim', 'Jardim', 'Lopes', 'Mendes', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Vieira']
const nationalities = ['Brasil', 'Argentina', 'Uruguai', 'Colômbia', 'Portugal', 'Espanha', 'França', 'Nigéria']
const positionSets = [
  ['GOL'], ['ZAG'], ['LAT'], ['VOL'], ['MEI'], ['ATA'],
  ['GOL', 'ZAG'], ['LAT', 'ZAG'], ['VOL', 'MEI'], ['MEI', 'ATA'],
  ['GOL', 'ZAG', 'LAT'], ['LAT', 'VOL', 'MEI'], ['VOL', 'MEI', 'ATA'],
]
const prices = {
  11: [2, 5, 8], 12: [4, 7, 10], 13: [6, 9, 12], 14: [9, 12, 15],
  15: [12, 16, 20], 16: [16, 21, 26], 17: [21, 27, 33], 18: [27, 34, 41],
  19: [34, 42, 50], 20: [42, 51, 60], 21: [50, 60, 70],
}

const skills = [
  ...Array.from({ length: 300 }, (_, index) => 11 + (index % 5)),
  ...Array.from({ length: 150 }, (_, index) => 16 + (index % 4)),
  ...Array.from({ length: 35 }, () => 20),
  ...Array.from({ length: 15 }, () => 21),
]
const positionCounts = [
  ...Array.from({ length: 325 }, () => 1),
  ...Array.from({ length: 125 }, () => 2),
  ...Array.from({ length: 50 }, () => 3),
]

const players = Array.from({ length: 500 }, (_, index) => {
  const skill = skills[index]
  const positions = positionSets[index < 325 ? index % 6 : index < 450 ? 6 + (index % 4) : 10 + (index % 3)].slice(0, positionCounts[index])
  return {
    id: `player-${String(index + 1).padStart(3, '0')}`,
    name: `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`,
    age: 18 + ((index * 13) % 19),
    nationality: nationalities[index % nationalities.length],
    positions,
    skill,
    value: prices[skill][positions.length - 1],
  }
})

await mkdir('src/data', { recursive: true })
await writeFile('src/data/players.json', `${JSON.stringify(players, null, 2)}\n`)
