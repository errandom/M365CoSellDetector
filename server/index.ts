import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { databaseRouter } from './routes/database.js'
import { scanResultsRouter } from './routes/scanResults.js'
import { closeDatabaseConnection, setUserToken } from './services/databaseService.js'

const app = express()
const PORT = process.env.SERVER_PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' })) // Increased limit for batch operations

// SQL Token middleware - extracts bearer token and makes it available to database service
app.use((req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    setUserToken(token)
  } else {
    setUserToken(null)
  }
  next()
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Database routes (read from MSX data)
app.use('/api', databaseRouter)

// Scan results routes (read/write scan results)
app.use('/api', scanResultsRouter)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  })
})

// Start server
async function startServer() {
  try {
    // Note: Database connections are now created per-request using user tokens
    // No upfront connection needed
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log('Using user-delegated authentication for Fabric SQL')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...')
  await closeDatabaseConnection()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...')
  await closeDatabaseConnection()
  process.exit(0)
})

startServer()
