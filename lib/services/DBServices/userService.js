import { query } from '../../db.js';
import bcrypt from 'bcrypt';

  export async function getAll() {
    const sql = `
      SELECT id, name, email, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
  };

  export async function getById(id) {
    const sql = `
      SELECT id, name, email, created_at
      FROM users
      WHERE id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  };

  export async function create({ name, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;
    const result = await query(sql, [name, email, hashedPassword]);
    return result.rows[0];
  };

  export async function update(id, { name, email }) {
    const sql = `
      UPDATE users
      SET name = $1, email = $2
      WHERE id = $3
      RETURNING id, name, email, created_at
    `;
    const result = await query(sql, [name, email, id]);
    return result.rows[0];
  };

  export async function deleteUser(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
    return { success: true };
  };

  export async function verify(email, password) {
    const sql = `SELECT * FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    const user = result.rows[0];

    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    const { password: _pw, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };

