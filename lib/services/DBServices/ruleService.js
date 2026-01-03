import { query } from '../../db.js'
export async function create({ rule, groot, midden, klein, bron, rule_type_id }) {
    const sql = `
      INSERT INTO rules (rule, groot, midden, klein, bron, rule_type_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await query(sql, [rule, groot, midden, klein, bron, rule_type_id]);
    return result.rows[0];
};

export async function getById(id) {
    const sql = `SELECT * FROM rules WHERE id = $1;`;
    const result = await query(sql, [id]);
    return result.rows[0];
};

export async function getAllByRuleType(rule_type_id) {
    const sql = `
      SELECT * FROM rules
      WHERE rule_type_id = $1
      ORDER BY groot, midden, klein;
    `;
    const result = await query(sql, [rule_type_id]);
    return result.rows;
};

export async function deleteRule(id) {
    const sql = `DELETE FROM rules WHERE id = $1 RETURNING *;`;
    const result = await query(sql, [id]);
    return result.rows[0];
};

