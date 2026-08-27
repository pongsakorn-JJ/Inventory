require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATION_FILES = ['migration.sql', 'migration-images.sql'];

// Codes that mean "this statement was already applied" — safe to skip so the
// whole set of migration files can be re-run any number of times.
const ALREADY_APPLIED_CODES = new Set([
  'ER_DUP_FIELDNAME', // ADD COLUMN that already exists
  'ER_BAD_FIELD_ERROR', // CHANGE COLUMN <old> when <old> was already renamed
]);

(async function run() {
  const requestedFile = process.argv[2];
  const files = requestedFile ? [requestedFile] : MIGRATION_FILES;

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Migration file not found, skipping: ${file}`);
      continue;
    }

    console.log(`\n== Running ${file} ==`);
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await conn.query(statement);
        console.log('OK:', statement);
      } catch (err) {
        if (ALREADY_APPLIED_CODES.has(err.code)) {
          console.log('SKIP (already applied):', statement);
        } else {
          console.error('FAILED:', statement);
          await conn.end();
          throw err;
        }
      }
    }
  }

  await conn.end();
  console.log('\nMigration complete.');
})().catch((err) => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
