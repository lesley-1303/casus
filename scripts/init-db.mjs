import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

console.log('DATABASE_URL:', process.env.DATABASE_URL)

import { initDatabase } from '../lib/initDb.js'

initDatabase()
  .then(() => {
    console.log('Database initialized successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })