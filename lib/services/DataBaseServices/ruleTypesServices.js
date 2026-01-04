import { query } from '../../db.js'
export async function create({ name, rule_import_id }) {
    const sql = `
      INSERT INTO rule_types (name, rule_import_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await query(sql, [name, rule_import_id]);
    return result.rows[0];
};

export async function getById(id) {
    const sql = `SELECT * FROM rule_types WHERE id = $1;`;
    const result = await query(sql, [id]);
    return result.rows[0];
};

export async function getAllByImport(rule_import_id) {
    const sql = `
      SELECT * FROM rule_types
      WHERE rule_import_id = $1
      ORDER BY name ASC;
    `;
    const result = await query(sql, [rule_import_id]);
    return result.rows;
};

export async function deleteRuleType(id) {
    const sql = `DELETE FROM rule_types WHERE id = $1 RETURNING *;`;
    const result = await query(sql, [id]);
    return result.rows[0];
};
