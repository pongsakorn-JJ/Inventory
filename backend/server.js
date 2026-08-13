require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3063;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

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

// ========================================
// Health check
// ========================================
app.get('/api', (req, res) => {
  res.send('API is running');
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
      [username, email, hashed, 'user']
    );

    const user = { id: result.insertId, username, email, role: 'user' };
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
// PRODUCTS: Get all (public, no login required)
// ========================================
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
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
    const { name, brand, price, oldPrice, rating, category, image } = req.body;
    if (!name || !brand || price == null || !category || !image) {
      return res.status(400).json({ error: 'name, brand, price, category, image are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, brand, price, old_price, rating, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, brand, price, oldPrice ?? null, rating ?? 0, category, image]
    );

    res.status(201).json({ id: result.insertId, name, brand, price, oldPrice: oldPrice ?? null, rating: rating ?? 0, category, image });
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
    const { name, brand, price, oldPrice, rating, category, image } = req.body;

    if (!name || !brand || price == null || !category || !image) {
      return res.status(400).json({ error: 'name, brand, price, category, image are required' });
    }

    const [result] = await pool.query(
      'UPDATE products SET name = ?, brand = ?, price = ?, old_price = ?, rating = ?, category = ?, image = ? WHERE id = ?',
      [name, brand, price, oldPrice ?? null, rating ?? 0, category, image, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, id });
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
    await pool.query('DELETE FROM cart_items WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM favorites WHERE product_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete Product Error:', e.message);
    res.status(500).json({ error: 'Failed to delete product' });
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
// CHECKOUT: Create a receipt from current cart, then clear cart
// ========================================
app.post('/api/checkout', authToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cartRows] = await conn.query(
      `SELECT c.product_id, c.quantity, p.name, p.price
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (cartRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const total = cartRows.reduce((sum, r) => sum + r.price * r.quantity, 0);

    const [receiptResult] = await conn.query(
      'INSERT INTO receipts (user_id, receipt_date, total) VALUES (?, NOW(), ?)',
      [req.user.id, total]
    );
    const receiptId = receiptResult.insertId;

    for (const r of cartRows) {
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
// RECEIPTS: Get current user's receipt history
// ========================================
app.get('/api/receipts', authToken, async (req, res) => {
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
    console.error('Get Receipts Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API running on port ${port}`);
});