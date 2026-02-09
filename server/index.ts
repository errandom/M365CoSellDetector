import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { databaseRouter } from './routes/database.js'
import { scanResultsRouter } from './routes/scanResults.js'
import { connectToDatabase, closeDatabaseConnection } from './services/databaseService.js'

const app = express()
const PORT = process.env.SERVER_PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' })) // Increased limit for batch operations

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
    console.log('Connecting to Fabric SQL database...')
    await connectToDatabase()
    console.log('Database connection established')
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
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
