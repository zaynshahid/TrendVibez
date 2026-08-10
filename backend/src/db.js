import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

let pool = null;

// Helper to execute queries with automatic pool allocation
export async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDb first.');
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function initDb() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306'),
  };

  try {
    // 1. Establish connection to MySQL without DB first, to ensure database exists
    const tempConnection = await mysql.createConnection(config);
    const dbName = process.env.DB_NAME || 'trendvibe_db';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // 2. Initialize the connection pool with database selected
    pool = mysql.createPool({
      ...config,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL database: ${dbName}`);

    // 3. Create tables
    await createTables();

    // 4. Seed tables
    await seedSettings();
    await seedAdmin();
    await seedProducts();
    await seedCategories();
    await seedProductSizeInventory();
    await seedOrdersAndCarts();

  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

async function createTables() {
  // Categories table
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      image VARCHAR(2083) NOT NULL DEFAULT '',
      subtitle VARCHAR(255) NOT NULL DEFAULT '',
      createdAt VARCHAR(50) NOT NULL
    )
  `);

  // Migrate existing categories table to add image and subtitle columns
  try { await query(`ALTER TABLE categories ADD COLUMN image VARCHAR(2083) NOT NULL DEFAULT ''`); } catch (e) {}
  try { await query(`ALTER TABLE categories ADD COLUMN subtitle VARCHAR(255) NOT NULL DEFAULT ''`); } catch (e) {}

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      createdAt VARCHAR(50) NOT NULL
    )
  `);

  // Products table
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image VARCHAR(2083) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      rating DECIMAL(3, 2) NOT NULL DEFAULT 4.5,
      variantData TEXT NOT NULL,
      createdAt VARCHAR(50) NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS product_size_inventory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productId VARCHAR(36) NOT NULL,
      sizeName VARCHAR(50) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      createdAt VARCHAR(50) NOT NULL,
      UNIQUE KEY uq_product_size (productId, sizeName),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Ensure any legacy variant table is removed
  await query('DROP TABLE IF EXISTS product_variants');

  // Migrate existing products table if needed
  try {
    await query(`ALTER TABLE products ADD COLUMN variantData TEXT NOT NULL`);
  } catch (e) {}

  // Cart items table
  await query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      userId VARCHAR(36) NOT NULL,
      productId VARCHAR(36) NOT NULL,
      variantId VARCHAR(36) NOT NULL DEFAULT '',
      selectedColor VARCHAR(100) NOT NULL DEFAULT '',
      quantity INT NOT NULL,
      PRIMARY KEY (userId, productId, variantId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Migrations for cart_items if table already existed
  try {
    await query(`ALTER TABLE cart_items ADD COLUMN variantId VARCHAR(36) NOT NULL DEFAULT '' AFTER productId`);
  } catch (e) {}
  try {
    await query(`ALTER TABLE cart_items ADD COLUMN selectedColor VARCHAR(100) NOT NULL DEFAULT '' AFTER variantId`);
  } catch (e) {}
  try {
    await query(`ALTER TABLE cart_items DROP PRIMARY KEY, ADD PRIMARY KEY (userId, productId, variantId)`);
  } catch (e) {}

  // Orders table
  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      orderReference VARCHAR(50) NOT NULL UNIQUE,
      userId VARCHAR(36) NOT NULL,
      totalAmount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      paymentStatus VARCHAR(50) NOT NULL DEFAULT 'Paid',
      paymentMethod VARCHAR(50) NOT NULL DEFAULT 'Mock Card',
      createdAt VARCHAR(50) NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Order items table
  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId VARCHAR(36) NOT NULL,
      productId VARCHAR(36),
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity INT NOT NULL,
      image VARCHAR(2083) NOT NULL,
      selectedColor VARCHAR(100) NOT NULL DEFAULT '',
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
    )
  `);

  try {
    await query(`ALTER TABLE order_items ADD COLUMN selectedColor VARCHAR(100) NOT NULL DEFAULT '' AFTER image`);
  } catch (e) {}

  // Email logs table
  await query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipient VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      sentAt VARCHAR(50) NOT NULL,
      errorMessage TEXT
    )
  `);

  // Password resets table
  await query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email VARCHAR(255) PRIMARY KEY,
      token VARCHAR(255) NOT NULL,
      expiresAt VARCHAR(50) NOT NULL
    )
  `);

  // Activity / Audit logs table
  await query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      adminId   VARCHAR(36) NOT NULL,
      adminName VARCHAR(255) NOT NULL,
      action    VARCHAR(100) NOT NULL,
      module    VARCHAR(100) NOT NULL,
      recordId  VARCHAR(255),
      oldData   TEXT,
      newData   TEXT,
      ipAddress VARCHAR(64),
      createdAt VARCHAR(50) NOT NULL
    )
  `);

  // Site settings table
  await query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Support queries table
  await query(`
    CREATE TABLE IF NOT EXISTS support_queries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function seedSettings() {
  try {
    await query(`INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('notification_enabled', 'true')`);
    await query(`INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('notification_product_id', '')`);
  } catch (e) {
    console.error('Error seeding site settings:', e);
  }
}

async function seedAdmin() {
  const usersCount = await query('SELECT COUNT(*) as count FROM users');
  if (usersCount[0].count > 0) return;

  const usersJsonPath = path.join(DATA_DIR, 'users.json');
  let users = [];
  if (fs.existsSync(usersJsonPath)) {
    try {
      users = JSON.parse(fs.readFileSync(usersJsonPath, 'utf-8'));
    } catch (e) {
      console.error('Error parsing users.json:', e);
    }
  }

  // If we couldn't load users from users.json, seed defaults
  if (users.length === 0) {
    const salt1 = bcrypt.genSaltSync(10);
    const salt2 = bcrypt.genSaltSync(10);
    users = [
      {
        id: uuidv4(),
        name: 'TrendVibe Admin',
        email: 'admin@trendvibe.com',
        password: bcrypt.hashSync('adminpassword', salt1),
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Zain Shahid',
        email: 'zainshahid131@gmail.com',
        password: bcrypt.hashSync('123456789', salt2),
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
  }

  for (const user of users) {
    await query(
      'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.name, user.email, user.password, user.role, user.createdAt]
    );
  }
  console.log('Seeded users table.');
}

async function seedProducts() {
  const productsCount = await query('SELECT COUNT(*) as count FROM products');
  if (productsCount[0].count === 0) {
    const productsJsonPath = path.join(DATA_DIR, 'products.json');
    let products = [];
    if (fs.existsSync(productsJsonPath)) {
      try {
        products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));
      } catch (e) {
        console.error('Error parsing products.json:', e);
      }
    }

    for (const product of products) {
      await query(
        'INSERT INTO products (id, name, description, price, category, image, stock, rating, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          product.id,
          product.name,
          product.description,
          parseFloat(product.price),
          product.category,
          product.image,
          parseInt(product.stock),
          parseFloat(product.rating || 4.5),
          product.createdAt || new Date().toISOString()
        ]
      );
    }
    console.log('Seeded products table.');
  }
}

async function seedCategories() {
  const countRes = await query('SELECT COUNT(*) as count FROM categories');
  if (countRes[0].count > 0) return;

  const defaultCategories = [
    { name: 'Men',     image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&auto=format&fit=crop&q=80', subtitle: 'Tailoring & Denim' },
    { name: 'Women',   image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80', subtitle: 'Dresses & Trousers' },
    { name: 'Kids',    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=700&auto=format&fit=crop&q=80', subtitle: 'Fleece & Dungarees' },
    { name: 'Footwear',image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', subtitle: 'Sneakers & Loafers' },
  ];

  // Also pull in any extra categories already in products table
  const prodCats = await query('SELECT DISTINCT category FROM products');
  const catMap = new Map(defaultCategories.map(c => [c.name.toLowerCase(), c]));
  prodCats.forEach(row => {
    const key = (row.category || '').trim().toLowerCase();
    if (key && !catMap.has(key)) {
      catMap.set(key, { name: row.category.trim(), image: '', subtitle: '' });
    }
  });

  const now = new Date().toISOString();
  for (const cat of catMap.values()) {
    await query(
      'INSERT IGNORE INTO categories (id, name, image, subtitle, createdAt) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), cat.name, cat.image, cat.subtitle, now]
    );
  }
  console.log('Seeded categories table.');
}

async function seedProductSizeInventory() {
  const rows = await query('SELECT id, variantData FROM products');
  for (const product of rows) {
    const variants = (() => {
      try {
        const parsed = JSON.parse(product.variantData || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    await syncProductSizeInventory(product.id, variants);
    const sizeRows = await query('SELECT stock FROM product_size_inventory WHERE productId = ?', [product.id]);
    if (sizeRows.length > 0) {
      const totalSizeStock = sizeRows.reduce((sum, row) => sum + parseInt(row.stock || 0), 0);
      await query('UPDATE products SET stock = ? WHERE id = ?', [totalSizeStock, product.id]);
    }
  }
}

async function seedOrdersAndCarts() {
  // Seed carts
  const cartItemsCount = await query('SELECT COUNT(*) as count FROM cart_items');
  if (cartItemsCount[0].count === 0) {
    const cartsJsonPath = path.join(DATA_DIR, 'carts.json');
    if (fs.existsSync(cartsJsonPath)) {
      try {
        const carts = JSON.parse(fs.readFileSync(cartsJsonPath, 'utf-8'));
        for (const [userId, items] of Object.entries(carts)) {
          const userExists = await query('SELECT 1 FROM users WHERE id = ?', [userId]);
          if (userExists.length === 0) continue;

          for (const item of items) {
            const prodExists = await query('SELECT 1 FROM products WHERE id = ?', [item.productId]);
            if (prodExists.length === 0) continue;

            await query(
              'INSERT INTO cart_items (userId, productId, quantity) VALUES (?, ?, ?)',
              [userId, item.productId, parseInt(item.quantity)]
            );
          }
        }
        console.log('Seeded cart_items table.');
      } catch (e) {
        console.error('Error seeding carts:', e);
      }
    }
  }

  // Seed orders and order_items
  const ordersCount = await query('SELECT COUNT(*) as count FROM orders');
  if (ordersCount[0].count === 0) {
    const ordersJsonPath = path.join(DATA_DIR, 'orders.json');
    if (fs.existsSync(ordersJsonPath)) {
      try {
        const orders = JSON.parse(fs.readFileSync(ordersJsonPath, 'utf-8'));
        for (const order of orders) {
          const userExists = await query('SELECT 1 FROM users WHERE id = ?', [order.userId]);
          if (userExists.length === 0) continue;

          await query(
            'INSERT INTO orders (id, orderReference, userId, totalAmount, status, name, email, address, paymentStatus, paymentMethod, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              order.id,
              order.orderReference,
              order.userId,
              parseFloat(order.totalAmount),
              order.status,
              order.name,
              order.email,
              order.address,
              order.paymentStatus || 'Paid',
              order.paymentMethod || 'Mock Card',
              order.createdAt
            ]
          );

          for (const item of order.items) {
            const prodExists = await query('SELECT 1 FROM products WHERE id = ?', [item.productId]);
            const productId = prodExists.length > 0 ? item.productId : null;

            await query(
              'INSERT INTO order_items (orderId, productId, name, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
              [
                order.id,
                productId,
                item.name,
                parseFloat(item.price),
                parseInt(item.quantity),
                item.image
              ]
            );
          }
        }
        console.log('Seeded orders and order_items tables.');
      } catch (e) {
        console.error('Error seeding orders:', e);
      }
    }
  }
}

// User methods
export async function findUserByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createUser({ id, name, email, password, role, createdAt }) {
  await query(
    'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, email.toLowerCase(), password, role || 'user', createdAt || new Date().toISOString()]
  );
  return { id, name, email, role, createdAt };
}

export async function updateUser(id, updates) {
  const setClause = [];
  const values = [];
  Object.entries(updates).forEach(([key, value]) => {
    setClause.push(`\`${key}\` = ?`);
    values.push(value);
  });
  values.push(id);
  await query(`UPDATE users SET ${setClause.join(', ')} WHERE id = ?`, values);
  return findUserById(id);
}

export async function getAllUsers() {
  return query('SELECT id, name, email, role, createdAt FROM users');
}

export async function deleteUser(id) {
  await query('DELETE FROM users WHERE id = ?', [id]);
}

// Product methods
export async function getProductSizeInventory(productId) {
  const rows = await query(
    'SELECT id, productId, sizeName, stock, createdAt FROM product_size_inventory WHERE productId = ? ORDER BY sizeName ASC',
    [productId]
  );
  return rows.map(row => ({
    ...row,
    stock: parseInt(row.stock)
  }));
}

async function syncProductSizeInventory(productId, variants = []) {
  await query('DELETE FROM product_size_inventory WHERE productId = ?', [productId]);

  const sizeVariants = (Array.isArray(variants) ? variants : [])
    .filter(variant => (variant?.variantType || 'color') === 'size' && (variant?.color || '').toString().trim() !== '')
    .map(variant => ({
      sizeName: variant.color.toString().trim(),
      stock: parseInt(variant.stock || 0)
    }));

  if (sizeVariants.length === 0) return;

  for (const variant of sizeVariants) {
    await query(
      'INSERT INTO product_size_inventory (productId, sizeName, stock, createdAt) VALUES (?, ?, ?, ?)',
      [productId, variant.sizeName, variant.stock, new Date().toISOString()]
    );
  }
}

function sortSizeNames(sizeNames) {
  return sizeNames.sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    if (!Number.isNaN(aNum)) return -1;
    if (!Number.isNaN(bNum)) return 1;

    const order = ['xxs', 'xs', 'small', 's', 'medium', 'm', 'large', 'l', 'xl', 'xxl', 'one size'];
    const aIndex = order.indexOf(a.toLowerCase());
    const bIndex = order.indexOf(b.toLowerCase());
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }

    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export async function getProductSizeOptions({ category } = {}) {
  let sql = `
    SELECT DISTINCT psi.sizeName
    FROM product_size_inventory psi
    INNER JOIN products p ON p.id = psi.productId
    WHERE psi.sizeName <> ''
  `;
  const params = [];

  if (category) {
    sql += ' AND LOWER(p.category) = LOWER(?)';
    params.push(category);
  }

  const rows = await query(sql, params);
  return sortSizeNames(rows.map(row => row.sizeName));
}

export async function getAllProducts({ category, q, sort, minPrice, maxPrice, minRating, inStock, size } = {}) {
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND LOWER(category) = LOWER(?)';
    params.push(category);
  }

  if (q) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
    const searchVal = `%${q.toLowerCase()}%`;
    params.push(searchVal, searchVal);
  }

  if (minPrice !== undefined && minPrice !== '') {
    sql += ' AND price >= ?';
    params.push(parseFloat(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    sql += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (minRating !== undefined && minRating !== '') {
    sql += ' AND rating >= ?';
    params.push(parseFloat(minRating));
  }

  if (inStock === 'true' || inStock === true) {
    sql += ' AND stock > 0';
  }

  if (size !== undefined && size !== '') {
    sql += ` AND EXISTS (
      SELECT 1
      FROM product_size_inventory psi
      WHERE psi.productId = products.id
        AND LOWER(psi.sizeName) = LOWER(?)
        ${inStock === 'true' || inStock === true ? 'AND psi.stock > 0' : ''}
    )`;
    params.push(size);
  }

  if (sort) {
    if (sort === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else if (sort === 'rating') {
      sql += ' ORDER BY rating DESC';
    } else if (sort === 'newest') {
      sql += ' ORDER BY createdAt DESC';
    }
  } else {
    sql += ' ORDER BY createdAt DESC';
  }

  const rows = await query(sql, params);

  const products = [];
  for (const r of rows) {
    const sizeInventory = await getProductSizeInventory(r.id);
    products.push({
      ...r,
      price: parseFloat(r.price),
      rating: parseFloat(r.rating),
      stock: parseInt(r.stock),
      variants: (() => {
        try {
          const parsed = JSON.parse(r.variantData || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
      sizeInventory
    });
  }

  return products;
}

export async function getProductById(id) {
  const rows = await query('SELECT * FROM products WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const sizeInventory = await getProductSizeInventory(rows[0].id);
  return {
    ...rows[0],
    price: parseFloat(rows[0].price),
    rating: parseFloat(rows[0].rating),
    stock: parseInt(rows[0].stock),
    variants: (() => {
      try {
        const parsed = JSON.parse(rows[0].variantData || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    sizeInventory
  };
}

export async function createProduct({ id, name, description, price, category, image, stock, rating, createdAt, variants, variantData }) {
  const prodId = id || uuidv4();
  const created = createdAt || new Date().toISOString();
  const rat = rating !== undefined ? parseFloat(rating) : 4.5;
  const data = variantData !== undefined ? variantData : variants;
  await query(
    'INSERT INTO products (id, name, description, price, category, image, stock, rating, variantData, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [prodId, name, description, price, category, image, stock, rat, JSON.stringify(Array.isArray(data) ? data : []), created]
  );
  await syncProductSizeInventory(prodId, Array.isArray(data) ? data : []);
  return getProductById(prodId);
}

export async function updateProduct(id, updates) {
  const { variants, variantData, ...productUpdates } = updates;
  if (Object.keys(productUpdates).length > 0) {
    const setClause = [];
    const values = [];
    Object.entries(productUpdates).forEach(([key, value]) => {
      setClause.push(`\`${key}\` = ?`);
      values.push(value);
    });
    values.push(id);
    await query(`UPDATE products SET ${setClause.join(', ')} WHERE id = ?`, values);
  }

  if (variants !== undefined || variantData !== undefined) {
    const data = variantData !== undefined ? variantData : variants;
    await query('UPDATE products SET variantData = ? WHERE id = ?', [JSON.stringify(Array.isArray(data) ? data : []), id]);
    await syncProductSizeInventory(id, Array.isArray(data) ? data : []);
  }

  return getProductById(id);
}

export async function deleteProduct(id) {
  await query('DELETE FROM products WHERE id = ?', [id]);
}

// Cart methods
export async function getCartByUserId(userId) {
  const sql = `
    SELECT ci.productId, ci.variantId, ci.selectedColor, ci.quantity, 
           p.name, p.price, p.image, p.stock, p.description, p.variantData
    FROM cart_items ci
    LEFT JOIN products p ON ci.productId = p.id
    WHERE ci.userId = ?
  `;
  const rows = await query(sql, [userId]);
  const cart = [];
  for (const row of rows) {
    const variants = (() => {
      try {
        const parsed = JSON.parse(row.variantData || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const variant = variants.find(v => v.id === row.variantId) || null;
    const inferredVariantType = (() => {
      if (variant) return variant.variantType || 'color';
      const sizeLabels = ['XS', 'S', 'M', 'L', 'XL', 'Small', 'Medium', 'Large'];
      return sizeLabels.includes(row.selectedColor) ? 'size' : 'color';
    })();
    cart.push({
      productId: row.productId,
      variantId: row.variantId || '',
      selectedColor: row.selectedColor || '',
      quantity: parseInt(row.quantity),
      variant: variant ? {
        ...variant,
        stock: parseInt(variant.stock || 0)
      } : {
        variantType: inferredVariantType,
        color: row.selectedColor || ''
      },
      product: {
        id: row.productId,
        name: row.name || 'Product Unavailable',
        price: row.price ? parseFloat(row.price) : 0,
        image: row.image || '',
        stock: row.stock !== null ? parseInt(row.stock) : 0,
        description: row.description || ''
      }
    });
  }
  return cart;
}

export async function addOrIncrementCartItem(userId, productId, variantId = '', selectedColor = '', quantity = 1, maxStock = 99) {
  const rows = await query(
    'SELECT quantity FROM cart_items WHERE userId = ? AND productId = ? AND variantId = ?',
    [userId, productId, variantId]
  );

  if (rows.length > 0) {
    const newQty = parseInt(rows[0].quantity) + quantity;
    if (newQty > maxStock) {
      throw new Error(`Insufficient stock. Only ${maxStock} items available.`);
    }
    await query(
      'UPDATE cart_items SET quantity = ?, selectedColor = ? WHERE userId = ? AND productId = ? AND variantId = ?',
      [newQty, selectedColor, userId, productId, variantId]
    );
  } else {
    if (quantity > maxStock) {
      throw new Error(`Insufficient stock. Only ${maxStock} items available.`);
    }
    await query(
      'INSERT INTO cart_items (userId, productId, variantId, selectedColor, quantity) VALUES (?, ?, ?, ?, ?)',
      [userId, productId, variantId, selectedColor, quantity]
    );
  }
  return getCartByUserId(userId);
}

export async function updateCartItemQuantity(userId, productId, variantId = '', quantity = 1) {
  await query(
    'UPDATE cart_items SET quantity = ? WHERE userId = ? AND productId = ? AND variantId = ?',
    [quantity, userId, productId, variantId]
  );
  return getCartByUserId(userId);
}

export async function removeCartItem(userId, productId, variantId = '') {
  await query(
    'DELETE FROM cart_items WHERE userId = ? AND productId = ? AND variantId = ?',
    [userId, productId, variantId]
  );
  return getCartByUserId(userId);
}

export async function clearCart(userId) {
  await query('DELETE FROM cart_items WHERE userId = ?', [userId]);
}

// Order methods
export async function createOrder({ id, orderReference, userId, totalAmount, name, email, address, paymentStatus, paymentMethod, createdAt, items }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert order
    await connection.query(
      'INSERT INTO orders (id, orderReference, userId, totalAmount, status, name, email, address, paymentStatus, paymentMethod, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, orderReference, userId, totalAmount, 'Pending', name, email, address, paymentStatus || 'Paid', paymentMethod || 'Mock Card', createdAt]
    );

    // Insert order items and deduct stock
    for (const item of items) {
      const [prodRows] = await connection.query('SELECT stock, name FROM products WHERE id = ? FOR UPDATE', [item.productId]);
      if (prodRows.length === 0) {
        throw new Error(`Product not found: ID ${item.productId}`);
      }
      const product = prodRows[0];
      const selectedSize = (item.selectedColor || '').toString().trim();
      const [sizeRows] = await connection.query('SELECT id, sizeName, stock FROM product_size_inventory WHERE productId = ? FOR UPDATE', [item.productId]);
      const sizeInventory = Array.isArray(sizeRows) ? sizeRows : [];

      if (sizeInventory.length > 0) {
        let matchingSize = sizeInventory.find(entry => (entry.sizeName || '').toLowerCase() === selectedSize.toLowerCase());
        if (!matchingSize) {
          matchingSize = sizeInventory.find(entry => entry.stock >= item.quantity) || sizeInventory[0];
        }
        if (!matchingSize || matchingSize.stock < item.quantity) {
          const sizeInfo = matchingSize ? ` for size '${matchingSize.sizeName}'` : '';
          const avail = matchingSize ? matchingSize.stock : 0;
          throw new Error(`Insufficient stock${sizeInfo} on product '${product.name}'. Only ${avail} left.`);
        }
        await connection.query('UPDATE product_size_inventory SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, matchingSize.id]);
      } else if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product '${product.name}'. Only ${product.stock} left.`);
      }

      await connection.query(
        'INSERT INTO order_items (orderId, productId, name, price, quantity, image, selectedColor) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, item.productId, item.name, item.price, item.quantity, item.image, item.selectedColor || '']
      );

      if (sizeInventory.length > 0) {
        const [remainingRows] = await connection.query('SELECT stock FROM product_size_inventory WHERE productId = ? FOR UPDATE', [item.productId]);
        const remainingStock = (remainingRows || []).reduce((sum, row) => sum + parseInt(row.stock || 0), 0);
        await connection.query('UPDATE products SET stock = ? WHERE id = ?', [remainingStock, item.productId]);
      } else {
        await connection.query(
          'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
          [item.quantity, item.productId]
        );
      }
    }

    // Clear cart
    await connection.query('DELETE FROM cart_items WHERE userId = ?', [userId]);

    await connection.commit();
    return getOrderByIdHelper(connection, id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getOrderByIdHelper(connection, id) {
  const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (orderRows.length === 0) return null;
  const order = orderRows[0];

  const [itemRows] = await connection.query('SELECT * FROM order_items WHERE orderId = ?', [id]);
  order.items = itemRows.map(item => ({
    productId: item.productId,
    name: item.name,
    price: parseFloat(item.price),
    quantity: parseInt(item.quantity),
    image: item.image,
    selectedColor: item.selectedColor || ''
  }));
  order.totalAmount = parseFloat(order.totalAmount);
  return order;
}

export async function getOrderById(id) {
  const rows = await query('SELECT * FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const order = rows[0];

  const items = await query('SELECT * FROM order_items WHERE orderId = ?', [id]);
  order.items = items.map(item => ({
    productId: item.productId,
    name: item.name,
    price: parseFloat(item.price),
    quantity: parseInt(item.quantity),
    image: item.image,
    selectedColor: item.selectedColor || ''
  }));
  order.totalAmount = parseFloat(order.totalAmount);
  return order;
}

export async function getOrders(userId, isAdmin) {
  let sql = 'SELECT * FROM orders';
  const params = [];

  if (!isAdmin) {
    sql += ' WHERE userId = ?';
    params.push(userId);
  }

  sql += ' ORDER BY createdAt DESC';
  const orders = await query(sql, params);

  for (const order of orders) {
    const items = await query('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
    order.items = items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      image: item.image
    }));
    order.totalAmount = parseFloat(order.totalAmount);
  }

  return orders;
}

export async function updateOrderStatus(orderId, status) {
  await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  return getOrderById(orderId);
}

export async function deleteOrder(orderId) {
  await query('DELETE FROM orders WHERE id = ?', [orderId]);
}

// Stats method
export async function getAdminStats() {
  const orders = await getOrders(null, true);
  const products = await query('SELECT * FROM products');
  const catRows = await query('SELECT name FROM categories');

  let totalSales = 0;
  let numOrders = orders.length;

  const categorySales = {};
  const categoryQty = {};
  const dailySales = {};

  catRows.forEach(c => {
    categorySales[c.name] = 0;
    categoryQty[c.name] = 0;
  });

  orders.forEach(order => {
    if (order.status !== 'Cancelled') {
      totalSales += order.totalAmount;
    }

    const dateStr = order.createdAt.split('T')[0];
    if (!dailySales[dateStr]) {
      dailySales[dateStr] = 0;
    }
    if (order.status !== 'Cancelled') {
      dailySales[dateStr] += order.totalAmount;
    }

    order.items.forEach(item => {
      const originalProduct = products.find(p => p.id === item.productId);
      const category = originalProduct ? originalProduct.category : 'Other';

      if (order.status !== 'Cancelled') {
        categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity);
        categoryQty[category] = (categoryQty[category] || 0) + item.quantity;
      }
    });
  });

  let bestSellingCategory = 'N/A';
  let maxQty = -1;
  Object.entries(categoryQty).forEach(([cat, qty]) => {
    if (qty > maxQty && qty > 0) {
      maxQty = qty;
      bestSellingCategory = cat;
    }
  });

  const revenueOverTime = Object.entries(dailySales)
    .map(([date, amount]) => ({ date, amount: parseFloat(amount.toFixed(2)) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const formattedCategorySales = {};
  Object.entries(categorySales).forEach(([cat, amt]) => {
    formattedCategorySales[cat] = parseFloat((amt || 0).toFixed(2));
  });

  return {
    totalSales: parseFloat(totalSales.toFixed(2)),
    numOrders,
    bestSellingCategory,
    categorySales: formattedCategorySales,
    revenueOverTime,
    recentOrders: orders.slice(0, 5) // getOrders returns sorted DESC, we take the top 5
  };
}

// Email Logging helpers
export async function logEmail({ recipient, subject, status, errorMessage }) {
  await query(
    'INSERT INTO email_logs (recipient, subject, status, sentAt, errorMessage) VALUES (?, ?, ?, ?, ?)',
    [recipient.toLowerCase(), subject, status, new Date().toISOString(), errorMessage || null]
  );
}

export async function hasEmailBeenSent(recipient, subject) {
  const rows = await query(
    'SELECT 1 FROM email_logs WHERE LOWER(recipient) = LOWER(?) AND subject = ? AND status = "Success"',
    [recipient, subject]
  );
  return rows.length > 0;
}

// Password Reset helpers
export async function createPasswordReset(email, token, expiresAt) {
  await query(
    'INSERT INTO password_resets (email, token, expiresAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expiresAt = ?',
    [email.toLowerCase(), token, expiresAt.toISOString(), token, expiresAt.toISOString()]
  );
}

export async function getPasswordReset(token) {
  const rows = await query(
    'SELECT * FROM password_resets WHERE token = ?',
    [token]
  );
  return rows[0] || null;
}

export async function deletePasswordReset(email) {
  await query('DELETE FROM password_resets WHERE LOWER(email) = LOWER(?)', [email]);
}

// ─── Activity Log helpers ─────────────────────────────────────────────────────

export async function insertActivityLog({ adminId, adminName, action, module, recordId, oldData, newData, ipAddress }) {
  const oldDataStr = oldData != null ? JSON.stringify(oldData) : null;
  const newDataStr = newData != null ? JSON.stringify(newData) : null;
  await query(
    `INSERT INTO activity_logs (adminId, adminName, action, module, recordId, oldData, newData, ipAddress, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      adminId,
      adminName,
      action,
      module,
      recordId || null,
      oldDataStr,
      newDataStr,
      ipAddress || null,
      new Date().toISOString()
    ]
  );
}

export async function getActivityLogs({ page = 1, limit = 20, search = '', action = '', adminId = '', dateFrom = '', dateTo = '' } = {}) {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(adminName LIKE ? OR action LIKE ? OR module LIKE ? OR recordId LIKE ? OR newData LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (adminId) {
    conditions.push('adminId = ?');
    params.push(adminId);
  }
  if (dateFrom) {
    conditions.push('createdAt >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    // add one day so dateTo is inclusive
    const toDate = new Date(dateTo);
    toDate.setDate(toDate.getDate() + 1);
    conditions.push('createdAt < ?');
    params.push(toDate.toISOString());
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRows = await query(`SELECT COUNT(*) as total FROM activity_logs ${where}`, params);
  const total = countRows[0].total;

  const rows = await query(
    `SELECT * FROM activity_logs ${where} ORDER BY createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`,
    params
  );

  return {
    logs: rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit))
  };
}

export async function getActivityLogsMeta() {
  const actions = await query('SELECT DISTINCT action FROM activity_logs ORDER BY action ASC');
  const admins = await query('SELECT DISTINCT adminId, adminName FROM activity_logs ORDER BY adminName ASC');
  return {
    actions: actions.map(r => r.action),
    admins: admins.map(r => ({ id: r.adminId, name: r.adminName }))
  };
}

// Category Helper Methods
export async function getAllCategories() {
  const sql = `
    SELECT 
      c.id, 
      c.name, 
      c.image,
      c.subtitle,
      c.createdAt, 
      COUNT(p.id) AS productCount
    FROM categories c
    LEFT JOIN products p ON LOWER(c.name) = LOWER(p.category)
    GROUP BY c.id, c.name, c.image, c.subtitle, c.createdAt
    ORDER BY c.name ASC
  `;
  const rows = await query(sql);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    image: r.image || '',
    subtitle: r.subtitle || '',
    createdAt: r.createdAt,
    productCount: parseInt(r.productCount || 0)
  }));
}

export async function findCategoryByName(name) {
  if (!name) return null;
  const rows = await query('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)', [name.trim()]);
  return rows[0] || null;
}

export async function findCategoryById(id) {
  const rows = await query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createCategory({ name, image = '', subtitle = '' }) {
  const trimmed = name.trim();
  const existing = await findCategoryByName(trimmed);
  if (existing) {
    const error = new Error('Category with this name already exists.');
    error.statusCode = 400;
    throw error;
  }

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const cleanImage = (image || '').trim();
  const cleanSubtitle = (subtitle || '').trim();

  await query(
    'INSERT INTO categories (id, name, image, subtitle, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, trimmed, cleanImage, cleanSubtitle, createdAt]
  );

  return { id, name: trimmed, image: cleanImage, subtitle: cleanSubtitle, createdAt, productCount: 0 };
}

export async function updateCategory(id, { name, image, subtitle }) {
  const category = await findCategoryById(id);
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  const newName = name.trim();
  const existing = await findCategoryByName(newName);
  if (existing && existing.id !== id) {
    const error = new Error('Category with this name already exists.');
    error.statusCode = 400;
    throw error;
  }

  const oldName = category.name;
  const cleanImage = image !== undefined ? (image || '').trim() : (category.image || '');
  const cleanSubtitle = subtitle !== undefined ? (subtitle || '').trim() : (category.subtitle || '');

  await query('UPDATE categories SET name = ?, image = ?, subtitle = ? WHERE id = ?', [newName, cleanImage, cleanSubtitle, id]);

  if (oldName !== newName) {
    await query('UPDATE products SET category = ? WHERE LOWER(category) = LOWER(?)', [newName, oldName]);
  }

  const countRows = await query('SELECT COUNT(*) as count FROM products WHERE LOWER(category) = LOWER(?)', [newName]);
  const productCount = countRows[0] ? parseInt(countRows[0].count) : 0;

  return { id, name: newName, image: cleanImage, subtitle: cleanSubtitle, createdAt: category.createdAt, productCount };
}

export async function deleteCategory(id) {
  const category = await findCategoryById(id);
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  const countRows = await query('SELECT COUNT(*) as count FROM products WHERE LOWER(category) = LOWER(?)', [category.name]);
  const productCount = countRows[0] ? parseInt(countRows[0].count) : 0;

  if (productCount > 0) {
    const error = new Error(`Cannot delete category "${category.name}" because it is currently assigned to ${productCount} product(s). Please reassign or delete those products first.`);
    error.statusCode = 400;
    throw error;
  }

  await query('DELETE FROM categories WHERE id = ?', [id]);
  return { success: true, message: `Category "${category.name}" deleted successfully.` };
}

export async function getFeaturedNotificationSetting() {
  const rows = await query('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?)', [
    'notification_enabled',
    'notification_product_id'
  ]);
  
  let enabled = true;
  let productId = '';

  rows.forEach(row => {
    if (row.setting_key === 'notification_enabled') {
      enabled = row.setting_value === 'true';
    }
    if (row.setting_key === 'notification_product_id') {
      productId = row.setting_value || '';
    }
  });

  let product = null;
  if (productId) {
    product = await getProductById(productId);
  }
  
  // If no explicit product found/selected, default to newest product
  if (!product) {
    const newest = await query('SELECT id FROM products ORDER BY createdAt DESC LIMIT 1');
    if (newest && newest[0]) {
      product = await getProductById(newest[0].id);
    }
  }

  return {
    enabled,
    productId,
    product
  };
}

export async function updateFeaturedNotificationSetting(enabled, productId = '') {
  await query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [
    'notification_enabled',
    enabled ? 'true' : 'false',
    enabled ? 'true' : 'false'
  ]);

  await query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [
    'notification_product_id',
    productId || '',
    productId || ''
  ]);

  return getFeaturedNotificationSetting();
}

export async function createSupportQuery({ name, email, category, message }) {
  const result = await query(
    'INSERT INTO support_queries (name, email, category, message, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, category, message, 'Pending']
  );
  return { id: result.insertId, name, email, category, message, status: 'Pending', createdAt: new Date() };
}

export async function getAllSupportQueries() {
  return await query('SELECT * FROM support_queries ORDER BY createdAt DESC');
}

export async function updateSupportQueryStatus(id, status) {
  await query('UPDATE support_queries SET status = ? WHERE id = ?', [status, id]);
  const rows = await query('SELECT * FROM support_queries WHERE id = ?', [id]);
  return rows[0];
}

export async function deleteSupportQuery(id) {
  await query('DELETE FROM support_queries WHERE id = ?', [id]);
}


