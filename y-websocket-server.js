#!/usr/bin/env node

/**
 * This is a simple standalone WebSocket server for Yjs
 * It synchronizes document updates between clients
 * Used for the whiteboard and code sharing features
 */

const WebSocket = require('ws')
const http = require('http')
const { setupWSConnection } = require('y-websocket/bin/utils')

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 1234

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('YJS WebSocket server running')
})

const wss = new WebSocket.Server({ server })

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true })
  
  conn.on('close', () => {
    console.log('Connection closed')
  })
})

server.listen(port, host, () => {
  console.log(`YJS WebSocket server running at http://${host}:${port}`)
  console.log('Handling whiteboard and code sharing synchronization')
})

process.on('SIGINT', () => {
  console.log('\nStopping YJS WebSocket server')
  wss.close(() => {
    server.close(() => {
      process.exit(0)
    })
  })
})