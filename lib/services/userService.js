import { query } from '../db.js'
import bcrypt from 'bcrypt'

export async function getAllUsers() {
  const result = await query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC')
  return result.rows
}

export async function getUserById(id) {
  const result = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id])
  return result.rows[0]
}

export async function createUser(name, email, password) {
  const hashedPassword = await bcrypt.hash(password, 10)
  
  const result = await query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, hashedPassword]
  )
  return result.rows[0]
}

export async function updateUser(id, name, email) {
  const result = await query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at',
    [name, email, id]
  )
  return result.rows[0]
}

export async function deleteUser(id) {
  await query('DELETE FROM users WHERE id = $1', [id])
  return { success: true }
}

export async function verifyUser(email, password) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email])
  const user = result.rows[0]
  
  if (!user) {
    return null
  }
  
  const isValid = await bcrypt.compare(password, user.password)
  
  if (isValid) {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  
  return null
}