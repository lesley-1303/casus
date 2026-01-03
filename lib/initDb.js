import { query } from './db.js'

export async function initDatabase() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS rule_imports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rule_import_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS rule_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        rule_import_id UUID NOT NULL,
        CONSTRAINT fk_rule_type_import
          FOREIGN KEY (rule_import_id) REFERENCES rule_imports(id)
          ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rule TEXT NOT NULL,
        groot VARCHAR(255),
        midden VARCHAR(255),
        klein VARCHAR(255),
        bron VARCHAR(255),
        rule_type_id UUID NOT NULL,
        CONSTRAINT fk_rule_rule_type
          FOREIGN KEY (rule_type_id) REFERENCES rule_types(id)
          ON DELETE CASCADE
      );
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
