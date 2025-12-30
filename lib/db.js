import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function query(text, params) {
  try {
    const res = await pool.query(text, params)
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export default pool