import { query } from '../../db.js'

export async function create({ user_id, file_name }) {
    const sql = `
      INSERT INTO rule_imports (user_id, file_name)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await query(sql, [user_id, file_name]);
    return result.rows[0];
};

export async function getAllByUser(user_id) {
    const sql = `SELECT * FROM rule_imports WHERE user_id = $1 ORDER BY created_at DESC;`;
    const result = await query(sql, [user_id]);
    return result.rows;
};

export async function deleteRuleImport(id) {
    const sql = `DELETE FROM rule_imports WHERE id = $1 RETURNING *;`;
    const result = await query(sql, [id]);
    return result.rows[0];
};
