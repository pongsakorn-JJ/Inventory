require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  for (const statement of statements) {
    try {
      await conn.query(statement);
      console.log('OK:', statement);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('SKIP (column already exists):', statement);
      } else {
        console.error('FAILED:', statement);
        throw err;
      }
    }
  }

  await conn.end();
  console.log('Migration complete.');
})().catch((err) => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
