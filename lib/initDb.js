import { query } from './db.js'

export async function initDatabase() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Database tables created successfully')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
}