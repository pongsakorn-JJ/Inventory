// One-off migration: re-host every product image that isn't already served
// from raw.githubusercontent.com onto this repo's GitHub, then update
// products.image_url to point at the new location.
//
// Usage:
//   node scripts/migrate-images.js --dry-run   (show what would happen, no writes)
//   node scripts/migrate-images.js             (upload for real + update the DB)
//
// Never deletes rows or the table — only downloads, re-uploads, and updates
// the image_url column. A failed row is logged and skipped, not fatal.

require('dotenv').config();
const path = require('path');
const mysql = require('mysql2/promise');
const { putFileToGithub, slugify, MIME_EXT_MAP } = require(path.join(__dirname, '..', 'github'));

const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!DRY_RUN && (!token || !repo)) {
    console.error('GITHUB_TOKEN and GITHUB_REPO must be set in backend/.env to run for real.');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  const [rows] = await conn.query(
    "SELECT id, name, image_url FROM products WHERE image_url IS NULL OR image_url NOT LIKE 'https://raw.githubusercontent.com/%'"
  );

  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}${rows.length} product(s) need their image re-hosted on GitHub.\n`);

  let migrated = 0;
  let failed = 0;

  for (const row of rows) {
    console.log(`#${row.id} ${row.name}`);
    console.log(`  from: ${row.image_url}`);

    try {
      if (!row.image_url) throw new Error('image_url is empty');

      const imgRes = await fetch(row.image_url);
      if (!imgRes.ok) throw new Error(`download failed (HTTP ${imgRes.status})`);

      const contentType = (imgRes.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const ext = MIME_EXT_MAP[contentType] || 'jpg';
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      if (buffer.length === 0) throw new Error('downloaded file is empty');

      const filename = `${slugify(row.name)}-${Date.now()}.${ext}`;
      const repoPath = `frontend/assets/images/products/${filename}`;
      const newUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${repoPath}`;

      if (DRY_RUN) {
        console.log(`  would upload -> ${repoPath} (${buffer.length} bytes, ${contentType || 'unknown content-type'})`);
        console.log(`  would set image_url -> ${newUrl}\n`);
        migrated++;
        continue;
      }

      await putFileToGithub({
        token,
        repo,
        branch,
        filePath: repoPath,
        contentBase64: buffer.toString('base64'),
        message: `feat: add product image ${filename}`,
      });
      await conn.query('UPDATE products SET image_url = ? WHERE id = ?', [newUrl, row.id]);

      console.log(`  uploaded -> ${repoPath}`);
      console.log(`  image_url updated -> ${newUrl}\n`);
      migrated++;
    } catch (err) {
      failed++;
      console.error(`  SKIPPED: ${err.message}\n`);
    }
  }

  await conn.end();
  console.log(`Done: ${migrated} migrated, ${failed} skipped, ${rows.length} total.`);
  if (DRY_RUN) console.log('This was a dry run — nothing was uploaded and the database was not changed.');
}

run().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
