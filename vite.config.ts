import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function fakeWinnersApi(): Plugin {
  const filePath = resolve('data/winners.json')
  const readWinners = () => JSON.parse(readFileSync(filePath, 'utf8')) as Array<{ id: string; name: string; wins: number }>
  const send = (response: import('node:http').ServerResponse, data: unknown) => {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ data }))
  }
  return {
    name: 'fake-winners-api',
    configureServer(server) {
      server.middlewares.use('/api/winners', (request, response) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        const id = url.pathname.split('/').filter(Boolean).pop()
        const winners = readWinners()
        if (request.method === 'GET') { send(response, winners); return }
        if (request.method === 'POST') {
          let body = ''
          request.on('data', (chunk) => { body += chunk })
          request.on('end', () => {
            const name = String((JSON.parse(body) as { name?: string }).name ?? '').trim()
            if (!name) { response.statusCode = 400; send(response, { error: 'Nome obrigatório' }); return }
            const existing = winners.find((winner) => winner.name.toLowerCase() === name.toLowerCase())
            if (existing) existing.wins += 1
            else winners.push({ id: `winner-${Date.now()}`, name, wins: 1 })
            writeFileSync(filePath, JSON.stringify(winners, null, 2) + '\n')
            send(response, winners)
          })
          return
        }
        if (id && request.method === 'PATCH') {
          const winner = winners.find((item) => item.id === id)
          if (!winner) { response.statusCode = 404; send(response, { error: 'Vencedor não encontrado' }); return }
          winner.wins += 1
          writeFileSync(filePath, JSON.stringify(winners, null, 2) + '\n')
          send(response, winners)
          return
        }
        if (id && request.method === 'DELETE') {
          writeFileSync(filePath, JSON.stringify(winners.filter((item) => item.id !== id), null, 2) + '\n')
          send(response, winners.filter((item) => item.id !== id))
          return
        }
        response.statusCode = 405
        send(response, { error: 'Método não permitido' })
      })
    },
  }
}

export default defineConfig({ plugins: [react(), fakeWinnersApi()] })
