// Shared GitHub Contents API helper, used by the product-image upload route
// and by scripts/migrate-images.js.

async function putFileToGithub({ token, repo, branch, filePath, contentBase64, message }) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'inventory-app-image-upload',
  };

  let sha;
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  if (getRes.ok) {
    sha = (await getRes.json()).sha;
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub GET failed (${getRes.status}): ${await getRes.text()}`);
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    throw new Error(`GitHub PUT failed (${putRes.status}): ${await putRes.text()}`);
  }

  return putRes.json();
}

// Unicode combining-diacritical-marks block (0x0300-0x036F): stripped after
// NFKD normalization so accented Latin letters fold down to their plain
// ASCII base letter for the slug. Written as a codepoint range check rather
// than a regex escape to avoid editor/encoding round-trip issues.
const COMBINING_MARKS_START = 768; // 0x0300
const COMBINING_MARKS_END = 879; // 0x036f

function slugify(text) {
  let stripped = '';
  for (const ch of String(text).toLowerCase().normalize('NFKD')) {
    const code = ch.codePointAt(0);
    if (code >= COMBINING_MARKS_START && code <= COMBINING_MARKS_END) continue;
    stripped += ch;
  }
  const slug = stripped
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'product';
}

const MIME_EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

module.exports = { putFileToGithub, slugify, MIME_EXT_MAP };
