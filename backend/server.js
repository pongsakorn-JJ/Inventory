require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3063;
const JWT_SECRET = process.env.JWT_SECRET;
const LOW_STOCK_THRESHOLD = 5;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ========================================
// UPLOADS: product images, always saved as .jpg
// ========================================
const uploadsDir = path.join(__dirname, 'uploads', 'products');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

// ========================================
// MySQL Connection
// ========================================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

(async function testMySQL() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('MySQL Failed:', err.message);
    process.exit(1);
  }
})();

// ========================================
// Middleware: check JWT token
// ========================================
function authToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access Token Required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user; // { id, username, role }
    next();
  });
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function staffOnly(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'user') return res.status(403).json({ error: 'Staff access required' });
  next();
}

// ========================================
// GITHUB SYNC: push a products.json snapshot to GitHub whenever products change
// ========================================
const DB_TIMEZONE_OFFSET_MINUTES = 7 * 60; // matches pool's timezone: '+07:00'

function formatMySQLDateTime(value) {
  if (!value) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const shifted = new Date(date.getTime() + DB_TIMEZONE_OFFSET_MINUTES * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`;
}

async function syncProductsToGithub() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { synced: false, reason: 'GITHUB_TOKEN not configured' };

  const repo = process.env.GITHUB_REPO;
  const filePath = process.env.GITHUB_FILE;
  const branch = process.env.GITHUB_BRANCH || 'main';

  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    const formatted = rows.map((row) => ({
      ...row,
      created_at: formatMySQLDateTime(row.created_at),
      ...(row.updated_at !== undefined ? { updated_at: formatMySQLDateTime(row.updated_at) } : {}),
    }));
    const content = Buffer.from(JSON.stringify(formatted, null, 2), 'utf8').toString('base64');

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'inventory-app-sync',
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
        message: `chore: sync products.json (${formatted.length} items)`,
        content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      throw new Error(`GitHub PUT failed (${putRes.status}): ${await putRes.text()}`);
    }

    console.log(`Synced products.json to GitHub (${formatted.length} items)`);
    return { synced: true, count: formatted.length };
  } catch (err) {
    console.error('GitHub Sync Error:', err.message);
    return { synced: false, reason: err.message };
  }
}

let githubSyncTimer = null;
function scheduleGithubSync() {
  if (!process.env.GITHUB_TOKEN) return;
  if (githubSyncTimer) clearTimeout(githubSyncTimer);
  githubSyncTimer = setTimeout(() => {
    githubSyncTimer = null;
    syncProductsToGithub();
  }, 30000);
}

// ========================================
// Health check
// ========================================
app.get('/api', (req, res) => {
  res.send('API is running');
});

// ========================================
// UPLOAD: product image (admin only), saved as .jpg under /uploads/products
// ========================================
app.post('/api/upload', authToken, adminOnly, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

// ========================================
// AUTH: Register
// ========================================
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashed, 'customer']
    );

    const user = { id: result.insertId, username, email, role: 'customer' };
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (e) {
    console.error('Register Error:', e.message);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// ========================================
// AUTH: Login
// ========================================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

    const dbUser = rows[0];
    const match = await bcrypt.compare(password, dbUser.password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    const user = { id: dbUser.id, username: dbUser.username, email: dbUser.email, role: dbUser.role };
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (e) {
    console.error('Login Error:', e.message);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ========================================
// PRODUCTS: Get all, optional ?q= search (public, no login required)
// ========================================
app.get('/api/products', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.json(rows);
    }

    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT * FROM products
       WHERE name LIKE ? OR brand LIKE ? OR location LIKE ? OR category LIKE ?
       ORDER BY created_at DESC`,
      [like, like, like, like]
    );
    res.json(rows);
  } catch (e) {
    console.error('Products Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ========================================
// PRODUCTS: Add (admin only)
// ========================================
app.post('/api/products', authToken, adminOnly, async (req, res) => {
  try {
    const { name, brand, price, oldPrice, rating, category, description, image, location, stockQuantity } = req.body;
    if (!name || !brand || price == null || !category || !image) {
      return res.status(400).json({ error: 'name, brand, price, category, image are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, brand, price, old_price, rating, category, description, image_url, location, total_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, brand, price, oldPrice ?? null, rating ?? 0, category, description ?? null, image, location ?? null, Math.max(0, Number(stockQuantity) || 0)]
    );

    scheduleGithubSync();
    res.status(201).json({
      id: result.insertId,
      name,
      brand,
      price,
      oldPrice: oldPrice ?? null,
      rating: rating ?? 0,
      category,
      description: description ?? null,
      image,
      location: location ?? null,
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
    });
  } catch (e) {
    console.error('Add Product Error:', e.message);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// ========================================
// PRODUCTS: Update (admin only)
// ========================================
app.put('/api/products/:id', authToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, price, oldPrice, rating, category, description, image, location, stockQuantity } = req.body;
    if (!name || !brand || price == null || !category || !image) {
      return res.status(400).json({ error: 'name, brand, price, category, image are required' });
    }

    const [result] = await pool.query(
      `UPDATE products
       SET name = ?, brand = ?, price = ?, old_price = ?, rating = ?, category = ?, description = ?, image_url = ?, location = ?, total_stock = ?
       WHERE id = ?`,
      [name, brand, price, oldPrice ?? null, rating ?? 0, category, description ?? null, image, location ?? null, Math.max(0, Number(stockQuantity) || 0), id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    scheduleGithubSync();
    res.json({ id, name, brand, price, oldPrice: oldPrice ?? null, rating: rating ?? 0, category, description: description ?? null, image, location, stockQuantity });
  } catch (e) {
    console.error('Update Product Error:', e.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ========================================
// PRODUCTS: Delete (admin only)
// ========================================
app.delete('/api/products/:id', authToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    scheduleGithubSync();
    res.json({ success: true });
  } catch (e) {
    console.error('Delete Product Error:', e.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ========================================
// PRODUCTS: Quick stock adjust, e.g. { delta: 1 } or { delta: -1 } (admin only)
// ========================================
app.patch('/api/products/:id/stock', authToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const delta = Number(req.body.delta);
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ error: 'delta must be a non-zero number' });
    }

    const [rows] = await pool.query('SELECT total_stock FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const nextQuantity = Math.max(0, rows[0].total_stock + delta);
    await pool.query('UPDATE products SET total_stock = ? WHERE id = ?', [nextQuantity, id]);
    scheduleGithubSync();
    res.json({ stockQuantity: nextQuantity });
  } catch (e) {
    console.error('Adjust Stock Error:', e.message);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// ========================================
// PRODUCTS: Force an immediate sync of products.json to GitHub (admin only)
// ========================================
app.post('/api/products/sync-github', authToken, adminOnly, async (req, res) => {
  const result = await syncProductsToGithub();
  if (result.synced) {
    res.json({ success: true, count: result.count });
  } else {
    res.status(500).json({ success: false, error: result.reason });
  }
});

// ========================================
// SALES: Record a sale for one product, decrements stock and creates a receipt
// ========================================
app.post('/api/sales', authToken, staffOnly, async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity);
  if (!productId || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'productId and a positive quantity are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [productRows] = await conn.query('SELECT id, name, price, total_stock FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (productRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productRows[0];
    if (qty > product.total_stock) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: `Insufficient stock, only ${product.total_stock} left` });
    }

    const nextQuantity = product.total_stock - qty;
    await conn.query('UPDATE products SET total_stock = ? WHERE id = ?', [nextQuantity, productId]);

    const total = product.price * qty;
    const [receiptResult] = await conn.query(
      'INSERT INTO receipts (user_id, receipt_date, total) VALUES (?, NOW(), ?)',
      [req.user.id, total]
    );
    await conn.query(
      'INSERT INTO receipt_items (receipt_id, name, price, quantity) VALUES (?, ?, ?, ?)',
      [receiptResult.insertId, product.name, product.price, qty]
    );

    await conn.commit();
    conn.release();
    res.status(201).json({ stockQuantity: nextQuantity });
  } catch (e) {
    await conn.rollback();
    conn.release();
    console.error('Record Sale Error:', e.message);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// ========================================
// CART: Get current user's cart
// ========================================
app.get('/api/cart', authToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT product_id, quantity FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json(rows.map((r) => ({ productId: String(r.product_id), quantity: r.quantity })));
  } catch (e) {
    console.error('Get Cart Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// ========================================
// CART: Add item (or increment quantity if exists)
// ========================================
app.post('/api/cart', authToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    await pool.query(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
      [req.user.id, productId]
    );
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('Add To Cart Error:', e.message);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// ========================================
// CART: Update quantity (0 or less removes the item)
// ========================================
app.put('/api/cart/:productId', authToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    } else {
      await pool.query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, req.user.id, productId]);
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Update Cart Error:', e.message);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// ========================================
// CART: Remove item
// ========================================
app.delete('/api/cart/:productId', authToken, async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    res.json({ success: true });
  } catch (e) {
    console.error('Remove From Cart Error:', e.message);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// ========================================
// FAVORITES: Get current user's favorites
// ========================================
app.get('/api/favorites', authToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT product_id FROM favorites WHERE user_id = ?', [req.user.id]);
    res.json(rows.map((r) => String(r.product_id)));
  } catch (e) {
    console.error('Get Favorites Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// ========================================
// FAVORITES: Toggle
// ========================================
app.post('/api/favorites/:productId', authToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const [existing] = await pool.query('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);

    if (existing.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
      return res.json({ favorited: false });
    } else {
      await pool.query('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
      return res.json({ favorited: true });
    }
  } catch (e) {
    console.error('Toggle Favorite Error:', e.message);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// ========================================
// CHECKOUT: Create a receipt from current cart, decrement stock, clear cart
// ========================================
app.post('/api/checkout', authToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cartRows] = await conn.query(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.total_stock
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ? FOR UPDATE`,
      [req.user.id]
    );

    if (cartRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const r of cartRows) {
      if (r.quantity > r.total_stock) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: `สินค้า "${r.name}" มีไม่พอ (คงเหลือ ${r.total_stock})` });
      }
    }

    const total = cartRows.reduce((sum, r) => sum + r.price * r.quantity, 0);

    const [receiptResult] = await conn.query(
      'INSERT INTO receipts (user_id, receipt_date, total) VALUES (?, NOW(), ?)',
      [req.user.id, total]
    );
    const receiptId = receiptResult.insertId;

    for (const r of cartRows) {
      await conn.query('UPDATE products SET total_stock = total_stock - ? WHERE id = ?', [r.quantity, r.product_id]);
      await conn.query(
        'INSERT INTO receipt_items (receipt_id, name, price, quantity) VALUES (?, ?, ?, ?)',
        [receiptId, r.name, r.price, r.quantity]
      );
    }

    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    await conn.commit();
    conn.release();

    res.status(201).json({
      id: String(receiptId),
      date: new Date().toLocaleString('th-TH'),
      items: cartRows.map((r) => ({ name: r.name, price: r.price, quantity: r.quantity })),
      total,
    });
  } catch (e) {
    await conn.rollback();
    conn.release();
    console.error('Checkout Error:', e.message);
    res.status(500).json({ error: 'Failed to checkout' });
  }
});

// ========================================
// ORDERS: Get current user's order history
// ========================================
app.get('/api/orders', authToken, async (req, res) => {
  try {
    const [receipts] = await pool.query(
      'SELECT id, receipt_date, total FROM receipts WHERE user_id = ? ORDER BY receipt_date DESC',
      [req.user.id]
    );

    const result = [];
    for (const r of receipts) {
      const [items] = await pool.query(
        'SELECT name, price, quantity FROM receipt_items WHERE receipt_id = ?',
        [r.id]
      );
      result.push({
        id: String(r.id),
        date: new Date(r.receipt_date).toLocaleString('th-TH'),
        items,
        total: r.total,
      });
    }

    res.json(result);
  } catch (e) {
    console.error('Get Orders Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ========================================
// DASHBOARD: Stock + sales summary (staff only)
// ========================================
app.get('/api/dashboard', authToken, staffOnly, async (req, res) => {
  try {
    const [products] = await pool.query('SELECT id, name, brand, price, category, location, total_stock FROM products');

    const totalProducts = products.length;
    const totalStockUnits = products.reduce((sum, p) => sum + p.total_stock, 0);
    const stockValue = products.reduce((sum, p) => sum + p.price * p.total_stock, 0);
    const lowStockItems = products
      .filter((p) => p.total_stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.total_stock - b.total_stock)
      .map((p) => ({ id: String(p.id), name: p.name, brand: p.brand, location: p.location, stockQuantity: p.total_stock }));

    const byLocationMap = new Map();
    for (const p of products) {
      const key = p.location || 'ไม่ระบุตำแหน่ง';
      const entry = byLocationMap.get(key) || { location: key, productCount: 0, stockUnits: 0 };
      entry.productCount += 1;
      entry.stockUnits += p.total_stock;
      byLocationMap.set(key, entry);
    }

    const [orderStats] = await pool.query('SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total), 0) AS totalRevenue FROM receipts');
    const [byProductRows] = await pool.query(
      `SELECT name, SUM(quantity) AS quantitySold, SUM(price * quantity) AS revenue
       FROM receipt_items GROUP BY name ORDER BY revenue DESC`
    );
    const [recentRows] = await pool.query(
      `SELECT r.id, r.receipt_date, r.total, u.username
       FROM receipts r LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.receipt_date DESC LIMIT 10`
    );

    res.json({
      stock: {
        totalProducts,
        totalStockUnits,
        stockValue,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        lowStockItems,
        byLocation: Array.from(byLocationMap.values()),
      },
      sales: {
        totalOrders: orderStats[0].totalOrders,
        totalRevenue: Number(orderStats[0].totalRevenue),
        byProduct: byProductRows.map((r) => ({ name: r.name, quantitySold: Number(r.quantitySold), revenue: Number(r.revenue) })),
        recent: recentRows.map((r) => ({
          id: String(r.id),
          date: new Date(r.receipt_date).toLocaleString('th-TH'),
          total: Number(r.total),
          username: r.username,
        })),
      },
    });
  } catch (e) {
    console.error('Dashboard Error:', e.message);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API running on port ${port}`);
});
