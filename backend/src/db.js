import './env.js';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

// Configure public DNS servers to resolve MongoDB SRV records on networks/ISPs that block SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

let cachedClient = null;
let cachedDb = null;

/**
 * Returns cached MongoDB database instance for Node.js & Vercel serverless functions.
 */
export async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db('trendvibz');
  return cachedDb;
}

/**
 * Compatibility query function for existing routes (e.g. orders.js, geminiChatService.js)
 */
export async function query(sql, params = []) {
  const db = await getDb();
  const trimmed = sql.trim().toUpperCase();

  // 1. SELECT email FROM users WHERE role = 'admin'
  if (trimmed.includes('FROM USERS') && trimmed.includes("ROLE = 'ADMIN'")) {
    return await db.collection('users')
      .find({ role: 'admin' }, { projection: { email: 1 } })
      .toArray();
  }

  // 2. SELECT ... FROM products WHERE id = ?
  if (trimmed.includes('FROM PRODUCTS') && trimmed.includes('WHERE ID = ?')) {
    const id = params[0];
    return await db.collection('products')
      .find({ $or: [{ id }, { _id: id }] })
      .toArray();
  }

  // 3. SELECT * FROM orders WHERE (id = ? OR orderReference = ?) AND userId = ?
  if (trimmed.includes('FROM ORDERS') && trimmed.includes('ORDERREFERENCE = ?') && trimmed.includes('USERID = ?')) {
    const idOrRef = params[0];
    const userId = params[2];
    return await db.collection('orders')
      .find({
        $or: [{ id: idOrRef }, { orderReference: idOrRef }],
        userId
      })
      .toArray();
  }

  // 4. SELECT * FROM order_items WHERE orderId = ?
  if (trimmed.includes('FROM ORDER_ITEMS') && trimmed.includes('ORDERID = ?')) {
    const orderId = params[0];
    return await db.collection('order_items')
      .find({ orderId })
      .toArray();
  }

  // 5. SELECT * FROM products
  if (trimmed.includes('FROM PRODUCTS') && !trimmed.includes('WHERE')) {
    return await db.collection('products').find({}).toArray();
  }

  // 6. SELECT name FROM categories
  if (trimmed.includes('FROM CATEGORIES') && !trimmed.includes('WHERE')) {
    return await db.collection('categories').find({}, { projection: { name: 1 } }).toArray();
  }

  throw new Error(`Unsupported SQL query in MongoDB mode: ${sql}`);
}

/**
 * Initializes MongoDB connection and verifies collections
 */
export async function initDb() {
  try {
    const db = await getDb();
    console.log('Connected to MongoDB database: trendvibz');

    // Create indexes if they don't already exist
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('products').createIndex({ id: 1 }, { unique: true });
      await db.collection('categories').createIndex({ name: 1 }, { unique: true });
      await db.collection('orders').createIndex({ id: 1 }, { unique: true });
      await db.collection('orders').createIndex({ orderReference: 1 }, { unique: true });
      await db.collection('order_items').createIndex({ orderId: 1 });
      await db.collection('product_size_inventory').createIndex({ productId: 1, sizeName: 1 });
      await db.collection('cart_items').createIndex({ userId: 1, productId: 1, variantId: 1 });
    } catch (idxErr) {
      // Indexes already exist or created
    }

    // Fallback seeders if fresh instance
    await seedSettings();
    await seedAdmin();
    await seedProducts();
    await seedCategories();
    await seedProductSizeInventory();
    await seedOrdersAndCarts();

  } catch (error) {
    console.error('Failed to initialize MongoDB database:', error);
    process.exit(1);
  }
}

export async function seedSettings() {
  try {
    const db = await getDb();
    await db.collection('site_settings').updateOne(
      { setting_key: 'notification_enabled' },
      { $setOnInsert: { _id: 'notification_enabled', setting_key: 'notification_enabled', setting_value: 'true', updated_at: new Date() } },
      { upsert: true }
    );
    await db.collection('site_settings').updateOne(
      { setting_key: 'notification_product_id' },
      { $setOnInsert: { _id: 'notification_product_id', setting_key: 'notification_product_id', setting_value: '', updated_at: new Date() } },
      { upsert: true }
    );
  } catch (e) {
    console.error('Error seeding site settings:', e);
  }
}

async function seedAdmin() {
  const db = await getDb();
  const count = await db.collection('users').countDocuments();
  if (count > 0) return;

  const usersJsonPath = path.join(DATA_DIR, 'users.json');
  let users = [];
  if (fs.existsSync(usersJsonPath)) {
    try {
      users = JSON.parse(fs.readFileSync(usersJsonPath, 'utf-8'));
    } catch (e) {
      console.error('Error parsing users.json:', e);
    }
  }

  if (users.length === 0) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      console.warn('Skipping admin seed: configure ADMIN_EMAIL and ADMIN_PASSWORD to create the initial admin account.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminPassword.length < 16) {
      throw new Error('ADMIN_EMAIL must be valid and ADMIN_PASSWORD must contain at least 16 characters.');
    }

    users = [
      {
        id: uuidv4(),
        name: 'TrendVibe Admin',
        email: adminEmail,
        password: bcrypt.hashSync(adminPassword, bcrypt.genSaltSync(10)),
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
  }

  for (const user of users) {
    await db.collection('users').updateOne(
      { email: user.email.toLowerCase() },
      {
        $setOnInsert: {
          _id: user.id || uuidv4(),
          id: user.id || uuidv4(),
          name: user.name,
          email: user.email.toLowerCase(),
          password: user.password,
          role: user.role,
          createdAt: user.createdAt || new Date().toISOString()
        }
      },
      { upsert: true }
    );
  }
  console.log('Seeded users collection.');
}

async function seedProducts() {
  const db = await getDb();
  const count = await db.collection('products').countDocuments();
  if (count > 0) return;

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
    const prodId = product.id || uuidv4();
    await db.collection('products').updateOne(
      { id: prodId },
      {
        $setOnInsert: {
          _id: prodId,
          id: prodId,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          discountPercent: parseFloat(product.discountPercent || 0),
          category: product.category,
          subcategory: product.subcategory || '',
          brand: product.brand || '',
          gender: product.gender || '',
          image: product.image,
          stock: parseInt(product.stock),
          rating: parseFloat(product.rating || 4.5),
          variantData: typeof product.variants === 'string' ? product.variants : JSON.stringify(product.variants || []),
          createdAt: product.createdAt || new Date().toISOString()
        }
      },
      { upsert: true }
    );
  }
  console.log('Seeded products collection.');
}

async function seedCategories() {
  const db = await getDb();
  const count = await db.collection('categories').countDocuments();
  if (count > 0) return;

  const defaultCategories = [
    { name: 'Men', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&auto=format&fit=crop&q=80', subtitle: 'Tailoring & Denim' },
    { name: 'Women', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80', subtitle: 'Dresses & Trousers' },
    { name: 'Kids', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=700&auto=format&fit=crop&q=80', subtitle: 'Fleece & Dungarees' },
    { name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', subtitle: 'Sneakers & Loafers' },
  ];

  const now = new Date().toISOString();
  for (const cat of defaultCategories) {
    const catId = uuidv4();
    await db.collection('categories').updateOne(
      { name: cat.name },
      {
        $setOnInsert: {
          _id: catId,
          id: catId,
          name: cat.name,
          image: cat.image,
          subtitle: cat.subtitle,
          createdAt: now
        }
      },
      { upsert: true }
    );
  }
  console.log('Seeded categories collection.');
}

async function seedProductSizeInventory() {
  const db = await getDb();
  const count = await db.collection('product_size_inventory').countDocuments();
  if (count > 0) return;

  const products = await db.collection('products').find({}).toArray();
  for (const product of products) {
    const variants = (() => {
      try {
        const parsed = JSON.parse(product.variantData || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    await syncProductSizeInventory(product.id, variants);
  }
}

async function seedOrdersAndCarts() {
  const db = await getDb();
  const count = await db.collection('orders').countDocuments();
  if (count > 0) return;

  const ordersJsonPath = path.join(DATA_DIR, 'orders.json');
  if (fs.existsSync(ordersJsonPath)) {
    try {
      const orders = JSON.parse(fs.readFileSync(ordersJsonPath, 'utf-8'));
      for (const order of orders) {
        await db.collection('orders').updateOne(
          { id: order.id },
          {
            $setOnInsert: {
              _id: order.id,
              id: order.id,
              orderReference: order.orderReference,
              userId: order.userId,
              totalAmount: parseFloat(order.totalAmount),
              currencyCode: 'USD',
              currencyRate: 1,
              status: order.status,
              name: order.name,
              email: order.email,
              address: order.address,
              paymentStatus: order.paymentStatus || 'Pending',
              paymentMethod: order.paymentMethod || 'Mock Card',
              platform: 'Direct',
              refundStatus: 'None',
              refundAmount: 0,
              createdAt: order.createdAt
            }
          },
          { upsert: true }
        );

        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            await db.collection('order_items').insertOne({
              id: uuidv4(),
              orderId: order.id,
              productId: item.productId,
              name: item.name,
              price: parseFloat(item.price),
              quantity: parseInt(item.quantity),
              image: item.image,
              selectedColor: item.selectedColor || ''
            });
          }
        }
      }
      console.log('Seeded orders collection.');
    } catch (e) {
      console.error('Error seeding orders:', e);
    }
  }
}

// ==========================================
// User methods
// ==========================================

export async function findUserByEmail(email) {
  if (!email) return null;
  const db = await getDb();
  return await db.collection('users').findOne({ email: email.toLowerCase() });
}

export async function findUserById(id) {
  if (!id) return null;
  const db = await getDb();
  return await db.collection('users').findOne({ $or: [{ id }, { _id: id }] });
}

export async function createUser({ id, name, email, password, role, createdAt }) {
  const db = await getDb();
  const userId = id || uuidv4();
  const created = createdAt || new Date().toISOString();
  const user = {
    _id: userId,
    id: userId,
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'user',
    createdAt: created
  };
  await db.collection('users').insertOne(user);
  return { id: userId, name, email: email.toLowerCase(), role: user.role, createdAt: created };
}

export async function updateUser(id, updates) {
  const db = await getDb();
  const sanitized = { ...updates };
  delete sanitized._id;
  delete sanitized.id;

  if (sanitized.email) {
    sanitized.email = sanitized.email.toLowerCase();
  }

  await db.collection('users').updateOne(
    { $or: [{ id }, { _id: id }] },
    { $set: sanitized }
  );
  return findUserById(id);
}

export async function getAllUsers() {
  const db = await getDb();
  return await db.collection('users')
    .find({}, { projection: { id: 1, name: 1, email: 1, role: 1, createdAt: 1 } })
    .toArray();
}

export async function deleteUser(id) {
  const db = await getDb();
  await db.collection('users').deleteOne({ $or: [{ id }, { _id: id }] });
}

// ==========================================
// Product Size Inventory methods
// ==========================================

export async function getProductSizeInventory(productId) {
  const db = await getDb();
  const rows = await db.collection('product_size_inventory')
    .find({ productId })
    .sort({ sizeName: 1 })
    .toArray();
  return rows.map(row => ({
    id: row.id,
    productId: row.productId,
    sizeName: row.sizeName,
    stock: parseInt(row.stock || 0),
    createdAt: row.createdAt
  }));
}

async function syncProductSizeInventory(productId, variants = []) {
  const db = await getDb();
  await db.collection('product_size_inventory').deleteMany({ productId });

  const sizeVariants = (Array.isArray(variants) ? variants : [])
    .filter(variant => (variant?.variantType || 'color') === 'size' && (variant?.color || '').toString().trim() !== '')
    .map(variant => ({
      sizeName: variant.color.toString().trim(),
      stock: parseInt(variant.stock || 0)
    }));

  if (sizeVariants.length === 0) return;

  const docs = sizeVariants.map(variant => ({
    id: uuidv4(),
    productId,
    sizeName: variant.sizeName,
    stock: variant.stock,
    createdAt: new Date().toISOString()
  }));

  await db.collection('product_size_inventory').insertMany(docs);
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
  const db = await getDb();
  let productIds = null;
  if (category) {
    const products = await db.collection('products')
      .find({ category: { $regex: new RegExp(`^${category}$`, 'i') } }, { projection: { id: 1 } })
      .toArray();
    productIds = products.map(p => p.id);
  }

  const queryObj = { sizeName: { $ne: '' } };
  if (productIds) {
    queryObj.productId = { $in: productIds };
  }

  const sizes = await db.collection('product_size_inventory').distinct('sizeName', queryObj);
  return sortSizeNames(sizes.filter(Boolean));
}

// ==========================================
// Product Catalog methods
// ==========================================

export async function getAllProducts({ category, subcategory, q, sort, minPrice, maxPrice, minRating, inStock, size, discounted } = {}) {
  const db = await getDb();
  const filter = {};

  if (category) {
    filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (subcategory && subcategory !== 'All') {
    filter.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
  }

  if (discounted === 'true' || discounted === true) {
    filter.discountPercent = { $gt: 0 };
  }

  if (q) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ name: regex }, { description: regex }];
  }

  if (minPrice !== undefined && minPrice !== '') {
    filter.price = { ...(filter.price || {}), $gte: parseFloat(minPrice) };
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    filter.price = { ...(filter.price || {}), $lte: parseFloat(maxPrice) };
  }

  if (minRating !== undefined && minRating !== '') {
    filter.rating = { $gte: parseFloat(minRating) };
  }

  if (inStock === 'true' || inStock === true) {
    filter.stock = { $gt: 0 };
  }

  if (size !== undefined && size !== '') {
    const sizeQuery = {
      sizeName: { $regex: new RegExp(`^${size.trim()}$`, 'i') }
    };
    if (inStock === 'true' || inStock === true) {
      sizeQuery.stock = { $gt: 0 };
    }
    const matchingSizes = await db.collection('product_size_inventory').find(sizeQuery, { projection: { productId: 1 } }).toArray();
    const allowedIds = matchingSizes.map(s => s.productId);
    filter.id = { $in: allowedIds };
  }

  let sortObj = { createdAt: -1 };
  if (sort === 'price_asc') {
    sortObj = { price: 1 };
  } else if (sort === 'price_desc') {
    sortObj = { price: -1 };
  } else if (sort === 'rating') {
    sortObj = { rating: -1 };
  } else if (sort === 'newest') {
    sortObj = { createdAt: -1 };
  }

  const rows = await db.collection('products').find(filter).sort(sortObj).toArray();

  const productIds = rows.map(r => r.id);
  const allSizes = await db.collection('product_size_inventory')
    .find({ productId: { $in: productIds } })
    .sort({ sizeName: 1 })
    .toArray();

  const sizesByProduct = {};
  for (const s of allSizes) {
    if (!sizesByProduct[s.productId]) sizesByProduct[s.productId] = [];
    sizesByProduct[s.productId].push({
      id: s.id,
      productId: s.productId,
      sizeName: s.sizeName,
      stock: parseInt(s.stock || 0),
      createdAt: s.createdAt
    });
  }

  const products = [];
  for (const r of rows) {
    const sizeInventory = sizesByProduct[r.id] || [];
    const price = parseFloat(r.price);
    const discountPercent = parseFloat(r.discountPercent || 0);
    const discountedPrice = discountPercent > 0 ? parseFloat((price * (1 - discountPercent / 100)).toFixed(2)) : price;

    products.push({
      ...r,
      price,
      discountPercent,
      discountedPrice,
      rating: parseFloat(r.rating || 4.5),
      stock: parseInt(r.stock || 0),
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
  if (!id) return null;
  const db = await getDb();
  const row = await db.collection('products').findOne({ $or: [{ id }, { _id: id }] });
  if (!row) return null;

  const sizeInventory = await getProductSizeInventory(row.id);
  const price = parseFloat(row.price);
  const discountPercent = parseFloat(row.discountPercent || 0);
  const discountedPrice = discountPercent > 0 ? parseFloat((price * (1 - discountPercent / 100)).toFixed(2)) : price;

  return {
    ...row,
    price,
    discountPercent,
    discountedPrice,
    rating: parseFloat(row.rating || 4.5),
    stock: parseInt(row.stock || 0),
    variants: (() => {
      try {
        const parsed = JSON.parse(row.variantData || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    sizeInventory
  };
}

export async function createProduct({ id, name, description, price, discountPercent = 0, category, subcategory = '', brand = '', gender = '', image, stock, rating, createdAt, variants, variantData }) {
  const db = await getDb();
  const prodId = id || uuidv4();
  const created = createdAt || new Date().toISOString();
  const rat = rating !== undefined ? parseFloat(rating) : 4.5;
  const disc = parseFloat(discountPercent || 0);
  const data = variantData !== undefined ? variantData : variants;
  const variantDataStr = JSON.stringify(Array.isArray(data) ? data : []);

  const newProduct = {
    _id: prodId,
    id: prodId,
    name,
    description,
    price: parseFloat(price),
    discountPercent: disc,
    category,
    subcategory: subcategory || '',
    brand: brand || '',
    gender: gender || '',
    image,
    stock: parseInt(stock || 0),
    rating: rat,
    variantData: variantDataStr,
    createdAt: created
  };

  await db.collection('products').insertOne(newProduct);
  await syncProductSizeInventory(prodId, Array.isArray(data) ? data : []);
  return getProductById(prodId);
}

export async function updateProduct(id, updates) {
  const db = await getDb();
  const { variants, variantData, ...productUpdates } = updates;

  if (productUpdates.price !== undefined) productUpdates.price = parseFloat(productUpdates.price);
  if (productUpdates.stock !== undefined) productUpdates.stock = parseInt(productUpdates.stock);
  if (productUpdates.rating !== undefined) productUpdates.rating = parseFloat(productUpdates.rating);
  if (productUpdates.discountPercent !== undefined) productUpdates.discountPercent = parseFloat(productUpdates.discountPercent);

  delete productUpdates._id;
  delete productUpdates.id;

  if (variants !== undefined || variantData !== undefined) {
    const data = variantData !== undefined ? variantData : variants;
    productUpdates.variantData = JSON.stringify(Array.isArray(data) ? data : []);
    await syncProductSizeInventory(id, Array.isArray(data) ? data : []);
  }

  if (Object.keys(productUpdates).length > 0) {
    await db.collection('products').updateOne(
      { $or: [{ id }, { _id: id }] },
      { $set: productUpdates }
    );
  }

  return getProductById(id);
}

export async function bulkUpdateProductDiscounts(productIds, discountPercent) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const db = await getDb();
  const percent = Math.max(0, Math.min(100, parseFloat(discountPercent) || 0));

  await db.collection('products').updateMany(
    { id: { $in: productIds } },
    { $set: { discountPercent: percent } }
  );

  return await db.collection('products').find({ id: { $in: productIds } }).toArray();
}

export async function deleteProduct(id) {
  const db = await getDb();
  await db.collection('products').deleteOne({ $or: [{ id }, { _id: id }] });
  await db.collection('product_size_inventory').deleteMany({ productId: id });
}

// ==========================================
// Cart methods
// ==========================================

export async function getCartByUserId(userId) {
  const db = await getDb();
  const cartRows = await db.collection('cart_items').find({ userId }).toArray();
  const cart = [];

  for (const row of cartRows) {
    const product = await getProductById(row.productId);
    const variants = product?.variants || [];
    const variant = variants.find(v => v.id === row.variantId) || null;
    const inferredVariantType = (() => {
      if (variant) return variant.variantType || 'color';
      const sizeLabels = ['XS', 'S', 'M', 'L', 'XL', 'Small', 'Medium', 'Large'];
      return sizeLabels.includes(row.selectedColor) ? 'size' : 'color';
    })();
    const price = product?.price || 0;
    const discountPercent = product?.discountPercent || 0;
    const discountedPrice = product?.discountedPrice || price;

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
        name: product?.name || 'Product Unavailable',
        price,
        discountPercent,
        discountedPrice,
        image: product?.image || '',
        stock: product?.stock !== undefined ? parseInt(product.stock) : 0,
        description: product?.description || ''
      }
    });
  }
  return cart;
}

export async function addOrIncrementCartItem(userId, productId, variantId = '', selectedColor = '', quantity = 1, maxStock = 99) {
  const db = await getDb();
  const existing = await db.collection('cart_items').findOne({ userId, productId, variantId });

  if (existing) {
    const newQty = parseInt(existing.quantity) + quantity;
    if (newQty > maxStock) {
      throw new Error(`Insufficient stock. Only ${maxStock} items available.`);
    }
    await db.collection('cart_items').updateOne(
      { _id: existing._id },
      { $set: { quantity: newQty, selectedColor } }
    );
  } else {
    if (quantity > maxStock) {
      throw new Error(`Insufficient stock. Only ${maxStock} items available.`);
    }
    await db.collection('cart_items').insertOne({
      _id: `${userId}_${productId}_${variantId}`,
      userId,
      productId,
      variantId,
      selectedColor,
      quantity
    });
  }
  return getCartByUserId(userId);
}

export async function updateCartItemQuantity(userId, productId, variantId = '', quantity = 1) {
  const db = await getDb();
  await db.collection('cart_items').updateOne(
    { userId, productId, variantId },
    { $set: { quantity } }
  );
  return getCartByUserId(userId);
}

export async function removeCartItem(userId, productId, variantId = '') {
  const db = await getDb();
  await db.collection('cart_items').deleteOne({ userId, productId, variantId });
  return getCartByUserId(userId);
}

export async function clearCart(userId) {
  const db = await getDb();
  await db.collection('cart_items').deleteMany({ userId });
}

// ==========================================
// Order methods
// ==========================================

export async function createOrder({ id, orderReference, userId, totalAmount, currencyCode, currencyRate, name, email, address, paymentMethod, platform = 'Direct', createdAt, items }) {
  const db = await getDb();
  const orderId = id || uuidv4();
  const created = createdAt || new Date().toISOString();
  const session = cachedClient.startSession();

  try {
    await session.withTransaction(async () => {
      for (const item of items) {
        const product = await db.collection('products').findOne(
          { id: item.productId },
          { session }
        );
        if (!product) {
          throw new Error(`Product not found: ID ${item.productId}`);
        }

        const selectedSize = (item.selectedColor || '').toString().trim();
        const sizeRows = await db.collection('product_size_inventory')
          .find({ productId: item.productId }, { session })
          .toArray();

        if (sizeRows.length > 0) {
          const matchingSize = sizeRows.find(entry => (entry.sizeName || '').toLowerCase() === selectedSize.toLowerCase());
          if (!matchingSize) {
            throw new Error(`Selected size '${selectedSize || 'unknown'}' is unavailable for product '${product.name}'.`);
          }

          const decrementResult = await db.collection('product_size_inventory').updateOne(
            { id: matchingSize.id, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session }
          );
          if (decrementResult.modifiedCount !== 1) {
            throw new Error(`Insufficient stock for size '${matchingSize.sizeName}' on product '${product.name}'.`);
          }

          const remainingRows = await db.collection('product_size_inventory')
            .find({ productId: item.productId }, { session })
            .toArray();
          const remainingStock = remainingRows.reduce((sum, row) => sum + parseInt(row.stock || 0), 0);
          await db.collection('products').updateOne(
            { id: item.productId },
            { $set: { stock: Math.max(0, remainingStock) } },
            { session }
          );
        } else {
          const decrementResult = await db.collection('products').updateOne(
            { id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session }
          );
          if (decrementResult.modifiedCount !== 1) {
            throw new Error(`Insufficient stock for product '${product.name}'.`);
          }
        }

        await db.collection('order_items').insertOne({
          id: uuidv4(),
          orderId,
          productId: item.productId,
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity),
          image: item.image,
          selectedColor: item.selectedColor || '',
          selectedSize: item.selectedSize || ''
        }, { session });
      }

      await db.collection('orders').insertOne({
        _id: orderId,
        id: orderId,
        orderReference,
        userId,
        totalAmount: parseFloat(totalAmount),
        currencyCode: currencyCode || 'USD',
        currencyRate: parseFloat(currencyRate || 1),
        status: 'Pending',
        name,
        email,
        address,
        paymentStatus: 'Pending',
        paymentMethod: paymentMethod || 'Cash on Delivery',
        platform: platform || 'Direct',
        refundStatus: 'None',
        refundAmount: 0.00,
        createdAt: created
      }, { session });

      await db.collection('cart_items').deleteMany({ userId }, { session });
    });
  } finally {
    await session.endSession();
  }

  return await getOrderById(orderId);
}

export async function getOrderById(id) {
  if (!id) return null;
  const db = await getDb();
  const order = await db.collection('orders').findOne({ $or: [{ id }, { _id: id }] });
  if (!order) return null;

  const items = await db.collection('order_items').find({ orderId: order.id }).toArray();
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
  const db = await getDb();
  const filter = {};
  if (!isAdmin && userId) {
    filter.userId = userId;
  }

  const orders = await db.collection('orders').find(filter).sort({ createdAt: -1 }).toArray();
  const orderIds = orders.map(o => o.id);

  const allItems = await db.collection('order_items').find({ orderId: { $in: orderIds } }).toArray();
  const itemsByOrder = {};
  for (const item of allItems) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push({
      productId: item.productId,
      name: item.name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      image: item.image,
      selectedColor: item.selectedColor || ''
    });
  }

  for (const order of orders) {
    order.items = itemsByOrder[order.id] || [];
    order.totalAmount = parseFloat(order.totalAmount);
  }

  return orders;
}

export async function updateOrderStatus(orderId, status) {
  const db = await getDb();
  await db.collection('orders').updateOne(
    { $or: [{ id: orderId }, { _id: orderId }] },
    { $set: { status } }
  );
  return getOrderById(orderId);
}

export async function approveRefund(orderId, refundAmount) {
  const db = await getDb();
  await db.collection('orders').updateOne(
    { $or: [{ id: orderId }, { _id: orderId }] },
    { $set: { refundStatus: 'Approved', refundAmount: parseFloat(refundAmount) } }
  );
  return getOrderById(orderId);
}

export async function deleteOrder(orderId) {
  const db = await getDb();
  await db.collection('orders').deleteOne({ $or: [{ id: orderId }, { _id: orderId }] });
  await db.collection('order_items').deleteMany({ orderId });
}

// ==========================================
// Admin Statistics
// ==========================================

export async function getAdminStats() {
  const db = await getDb();
  const orders = await getOrders(null, true);
  const products = await db.collection('products').find({}).toArray();
  const catRows = await db.collection('categories').find({}, { projection: { name: 1 } }).toArray();

  let totalSales = 0;
  let numOrders = orders.length;

  const categorySales = {};
  const categoryQty = {};
  const dailySales = {};
  const dailyProducts = {};
  const dailyOrdersCount = {};

  catRows.forEach(c => {
    categorySales[c.name] = 0;
    categoryQty[c.name] = 0;
  });

  const platformSales = { Instagram: 0, Facebook: 0, Direct: 0 };
  const platformOrders = { Instagram: 0, Facebook: 0, Direct: 0 };

  orders.forEach(order => {
    const rawPlat = order.platform || 'Direct';
    let platKey = 'Direct';
    if (typeof rawPlat === 'string') {
      const pLow = rawPlat.toLowerCase();
      if (pLow.includes('insta')) platKey = 'Instagram';
      else if (pLow.includes('fb') || pLow.includes('face')) platKey = 'Facebook';
      else if (pLow.trim()) platKey = rawPlat.trim();
    }

    if (!platformSales[platKey]) platformSales[platKey] = 0;
    if (!platformOrders[platKey]) platformOrders[platKey] = 0;

    platformOrders[platKey] += 1;
    if (order.status !== 'Cancelled') {
      platformSales[platKey] += parseFloat(order.totalAmount || 0);
      totalSales += order.totalAmount;
    }

    const dateStr = order.createdAt ? order.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
    if (!dailySales[dateStr]) {
      dailySales[dateStr] = 0;
      dailyProducts[dateStr] = {};
      dailyOrdersCount[dateStr] = 0;
    }
    if (order.status !== 'Cancelled') {
      dailySales[dateStr] += order.totalAmount;
      dailyOrdersCount[dateStr] += 1;
    }

    if (Array.isArray(order.items)) {
      order.items.forEach(item => {
        const originalProduct = products.find(p => p.id === item.productId);
        const category = originalProduct ? originalProduct.category : (item.category || 'Other');
        const prodName = item.name || originalProduct?.name || 'Product';
        const prodImage = item.image || originalProduct?.image || '';

        if (order.status !== 'Cancelled') {
          categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity);
          categoryQty[category] = (categoryQty[category] || 0) + item.quantity;

          const pKey = item.productId || prodName;
          if (!dailyProducts[dateStr][pKey]) {
            dailyProducts[dateStr][pKey] = {
              productId: item.productId,
              name: prodName,
              image: prodImage,
              category: category,
              price: item.price,
              quantity: 0,
              revenue: 0
            };
          }
          dailyProducts[dateStr][pKey].quantity += item.quantity;
          dailyProducts[dateStr][pKey].revenue += (item.price * item.quantity);
        }
      });
    }
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
    .map(([date, amount]) => {
      const prodsList = Object.values(dailyProducts[date] || {}).map(p => ({
        ...p,
        revenue: parseFloat((p.revenue || 0).toFixed(2))
      })).sort((a, b) => b.revenue - a.revenue);

      return {
        date,
        amount: parseFloat(amount.toFixed(2)),
        ordersCount: dailyOrdersCount[date] || 0,
        products: prodsList,
        topProduct: prodsList[0] || null
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const formattedCategorySales = {};
  Object.entries(categorySales).forEach(([cat, amt]) => {
    formattedCategorySales[cat] = parseFloat((amt || 0).toFixed(2));
  });

  const formattedPlatformSales = {};
  Object.entries(platformSales).forEach(([plat, amt]) => {
    formattedPlatformSales[plat] = parseFloat((amt || 0).toFixed(2));
  });

  return {
    totalSales: parseFloat(totalSales.toFixed(2)),
    numOrders,
    bestSellingCategory,
    categorySales: formattedCategorySales,
    platformSales: formattedPlatformSales,
    platformOrders,
    revenueOverTime,
    recentOrders: orders.slice(0, 5)
  };
}

// ==========================================
// Email Logging helpers
// ==========================================

export async function logEmail({ recipient, subject, status, errorMessage }) {
  const db = await getDb();
  await db.collection('email_logs').insertOne({
    id: uuidv4(),
    recipient: (recipient || '').toLowerCase(),
    subject,
    status,
    sentAt: new Date().toISOString(),
    errorMessage: errorMessage || null
  });
}

export async function hasEmailBeenSent(recipient, subject) {
  const db = await getDb();
  const existing = await db.collection('email_logs').findOne({
    recipient: (recipient || '').toLowerCase(),
    subject,
    status: 'Success'
  });
  return !!existing;
}

// ==========================================
// Password Reset helpers
// ==========================================

export async function createPasswordReset(email, token, expiresAt) {
  const db = await getDb();
  const normEmail = (email || '').toLowerCase();
  await db.collection('password_resets').updateOne(
    { email: normEmail },
    {
      $set: {
        _id: normEmail,
        email: normEmail,
        token,
        expiresAt: expiresAt.toISOString()
      }
    },
    { upsert: true }
  );
}

export async function getPasswordReset(token) {
  const db = await getDb();
  return await db.collection('password_resets').findOne({ token });
}

export async function deletePasswordReset(email) {
  const db = await getDb();
  await db.collection('password_resets').deleteOne({ email: (email || '').toLowerCase() });
}

// ==========================================
// Activity Log helpers
// ==========================================

export async function insertActivityLog({ adminId, adminName, action, module, recordId, oldData, newData, ipAddress }) {
  const db = await getDb();
  const oldDataStr = oldData != null ? JSON.stringify(oldData) : null;
  const newDataStr = newData != null ? JSON.stringify(newData) : null;

  await db.collection('activity_logs').insertOne({
    id: uuidv4(),
    adminId,
    adminName,
    action,
    module,
    recordId: recordId || null,
    oldData: oldDataStr,
    newData: newDataStr,
    ipAddress: ipAddress || null,
    createdAt: new Date().toISOString()
  });
}

export async function getActivityLogs({ page = 1, limit = 20, search = '', action = '', adminId = '', dateFrom = '', dateTo = '' } = {}) {
  const db = await getDb();
  const p = parseInt(page);
  const l = parseInt(limit);
  const skip = (p - 1) * l;
  const filter = {};

  if (search) {
    const sRegex = new RegExp(search, 'i');
    filter.$or = [
      { adminName: sRegex },
      { action: sRegex },
      { module: sRegex },
      { recordId: sRegex },
      { newData: sRegex }
    ];
  }

  if (action) {
    filter.action = action;
  }

  if (adminId) {
    filter.adminId = adminId;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      filter.createdAt.$lt = toDate.toISOString();
    }
  }

  const total = await db.collection('activity_logs').countDocuments(filter);
  const rows = await db.collection('activity_logs')
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l)
    .toArray();

  return {
    logs: rows,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l)
  };
}

export async function getActivityLogsMeta() {
  const db = await getDb();
  const actions = await db.collection('activity_logs').distinct('action');
  actions.sort();

  const adminAgg = await db.collection('activity_logs').aggregate([
    { $group: { _id: '$adminId', name: { $first: '$adminName' } } },
    { $sort: { name: 1 } }
  ]).toArray();

  return {
    actions,
    admins: adminAgg.map(r => ({ id: r._id, name: r.name }))
  };
}

// ==========================================
// Category methods
// ==========================================

export async function getAllCategories() {
  const db = await getDb();
  const categories = await db.collection('categories').find({}).sort({ name: 1 }).toArray();
  const result = [];

  for (const c of categories) {
    const count = await db.collection('products').countDocuments({
      category: { $regex: new RegExp(`^${c.name}$`, 'i') }
    });
    result.push({
      id: c.id,
      name: c.name,
      image: c.image || '',
      subtitle: c.subtitle || '',
      createdAt: c.createdAt,
      productCount: count
    });
  }

  return result;
}

export async function findCategoryByName(name) {
  if (!name) return null;
  const db = await getDb();
  return await db.collection('categories').findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });
}

export async function findCategoryById(id) {
  if (!id) return null;
  const db = await getDb();
  return await db.collection('categories').findOne({ $or: [{ id }, { _id: id }] });
}

export async function createCategory({ name, image = '', subtitle = '' }) {
  const trimmed = name.trim();
  const existing = await findCategoryByName(trimmed);
  if (existing) {
    const error = new Error('Category with this name already exists.');
    error.statusCode = 400;
    throw error;
  }

  const db = await getDb();
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const cleanImage = (image || '').trim();
  const cleanSubtitle = (subtitle || '').trim();

  const newCat = {
    _id: id,
    id,
    name: trimmed,
    image: cleanImage,
    subtitle: cleanSubtitle,
    createdAt
  };

  await db.collection('categories').insertOne(newCat);
  return { id, name: trimmed, image: cleanImage, subtitle: cleanSubtitle, createdAt, productCount: 0 };
}

export async function updateCategory(id, { name, image, subtitle }) {
  const db = await getDb();
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

  await db.collection('categories').updateOne(
    { $or: [{ id }, { _id: id }] },
    { $set: { name: newName, image: cleanImage, subtitle: cleanSubtitle } }
  );

  if (oldName.toLowerCase() !== newName.toLowerCase()) {
    await db.collection('products').updateMany(
      { category: { $regex: new RegExp(`^${oldName}$`, 'i') } },
      { $set: { category: newName } }
    );
  }

  const productCount = await db.collection('products').countDocuments({
    category: { $regex: new RegExp(`^${newName}$`, 'i') }
  });

  return { id, name: newName, image: cleanImage, subtitle: cleanSubtitle, createdAt: category.createdAt, productCount };
}

export async function deleteCategory(id) {
  const db = await getDb();
  const category = await findCategoryById(id);
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  const productCount = await db.collection('products').countDocuments({
    category: { $regex: new RegExp(`^${category.name}$`, 'i') }
  });

  if (productCount > 0) {
    const error = new Error(`Cannot delete category "${category.name}" because it is currently assigned to ${productCount} product(s). Please reassign or delete those products first.`);
    error.statusCode = 400;
    throw error;
  }

  await db.collection('categories').deleteOne({ $or: [{ id }, { _id: id }] });
  return { success: true, message: `Category "${category.name}" deleted successfully.` };
}

// ==========================================
// Site Settings
// ==========================================

export async function getFeaturedNotificationSetting() {
  const db = await getDb();
  const rows = await db.collection('site_settings').find({
    setting_key: { $in: ['notification_enabled', 'notification_product_id'] }
  }).toArray();

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

  if (!product) {
    const newest = await db.collection('products').find({}).sort({ createdAt: -1 }).limit(1).toArray();
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
  const db = await getDb();
  await db.collection('site_settings').updateOne(
    { setting_key: 'notification_enabled' },
    {
      $set: {
        _id: 'notification_enabled',
        setting_key: 'notification_enabled',
        setting_value: enabled ? 'true' : 'false',
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  await db.collection('site_settings').updateOne(
    { setting_key: 'notification_product_id' },
    {
      $set: {
        _id: 'notification_product_id',
        setting_key: 'notification_product_id',
        setting_value: productId || '',
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  return getFeaturedNotificationSetting();
}

// ==========================================
// Support Queries
// ==========================================

export async function createSupportQuery({ name, email, category, message }) {
  const db = await getDb();
  const doc = {
    id: uuidv4(),
    name,
    email,
    category,
    message,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  await db.collection('support_queries').insertOne(doc);
  return doc;
}

export async function getAllSupportQueries() {
  const db = await getDb();
  return await db.collection('support_queries').find({}).sort({ createdAt: -1 }).toArray();
}

export async function updateSupportQueryStatus(id, status) {
  const db = await getDb();
  await db.collection('support_queries').updateOne(
    { $or: [{ id }, { _id: id }] },
    { $set: { status } }
  );
  return await db.collection('support_queries').findOne({ $or: [{ id }, { _id: id }] });
}

export async function deleteSupportQuery(id) {
  const db = await getDb();
  await db.collection('support_queries').deleteOne({ $or: [{ id }, { _id: id }] });
}

// ==========================================
// Product Recommendations Engine
// ==========================================

const PRODUCT_TYPES = [
  'shirt', 'jeans', 'denim', 'sweater', 'coat', 'tee', 't-shirt', 'set',
  'dress', 'blazer', 'trousers', 'crop top', 'top', 'dungarees',
  'windbreaker', 'sweatshirt', 'pyjama', 'sneakers', 'loafers', 'boots',
  'sandals', 'slides', 'heels'
];

const PRODUCT_ATTRIBUTES = [
  'cotton', 'denim', 'wool', 'linen', 'cashmere', 'leather', 'crepe',
  'georgette', 'fleece', 'jersey', 'slim fit', 'oversized', 'striped',
  'button-down', 'high-waisted', 'crease-resistant', 'water-repellent',
  'floral', 'ribbed', 'knit', 'hooded', 'unisex', 'breathable',
  'lightweight', 'cozy', 'water-resistant', 'premium', 'organic'
];

function extractProductType(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  for (const type of PRODUCT_TYPES) {
    if (text.includes(type)) {
      return type;
    }
  }
  return null;
}

function getProductAttributes(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  return PRODUCT_ATTRIBUTES.filter(attr => text.includes(attr));
}

export async function getProductRecommendations(productId) {
  const target = await getProductById(productId);
  if (!target) {
    throw new Error('Product not found');
  }

  const allProducts = await getAllProducts();
  const candidates = allProducts.filter(p => p.id !== target.id);

  const targetType = extractProductType(target.name, target.description);
  const targetAttrs = getProductAttributes(target.name, target.description);

  const scoredCandidates = candidates.map(candidate => {
    let score = 0;

    // 1. Category Match
    if (target.category.toLowerCase() === candidate.category.toLowerCase()) {
      score += 10;
    }

    // 2. Type Match
    const candidateType = extractProductType(candidate.name, candidate.description);
    if (targetType && candidateType && targetType === candidateType) {
      score += 8;
    }

    // 3. Price Similarity Match
    if (target.price > 0) {
      const priceDiffPercent = Math.abs(target.price - candidate.price) / target.price;
      if (priceDiffPercent <= 0.1) {
        score += 5;
      } else if (priceDiffPercent <= 0.2) {
        score += 3;
      } else if (priceDiffPercent <= 0.3) {
        score += 1;
      }
    }

    // 4. Attributes Match
    const candidateAttrs = getProductAttributes(candidate.name, candidate.description);
    const sharedAttrs = targetAttrs.filter(attr => candidateAttrs.includes(attr));
    score += sharedAttrs.length * 2;

    return {
      ...candidate,
      similarityScore: score
    };
  });

  const isTargetOutOfStock = target.stock <= 0;
  scoredCandidates.sort((a, b) => {
    if (isTargetOutOfStock) {
      const aInStock = a.stock > 0 ? 1 : 0;
      const bInStock = b.stock > 0 ? 1 : 0;
      if (aInStock !== bInStock) {
        return bInStock - aInStock;
      }
    }
    if (b.similarityScore !== a.similarityScore) {
      return b.similarityScore - a.similarityScore;
    }
    return b.rating - a.rating;
  });

  return scoredCandidates.slice(0, 4);
}
