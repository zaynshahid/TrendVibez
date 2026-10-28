import './env.js';
import dns from 'dns';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in environments where setting DNS servers is not allowed
}

async function migrate() {
  console.log('--- Starting Migration from MySQL to MongoDB Atlas ---');

  // 1. MySQL Connection
  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'trendvibe_db'
  });
  console.log('✓ Connected to MySQL (trendvibe_db)');

  // 2. MongoDB Atlas Connection
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment!');
  }
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db('trendvibz');
  console.log('✓ Connected to MongoDB Atlas (trendvibz)');

  // Helper to migrate table
  async function migrateTable(tableName, collectionName, transformFn, idField = 'id') {
    const [rows] = await mysqlConn.query(`SELECT * FROM \`${tableName}\``);
    console.log(`Migrating ${tableName} (${rows.length} rows)...`);
    const col = db.collection(collectionName);
    
    // Clear target collection first to avoid duplicates
    await col.deleteMany({});

    if (rows.length === 0) {
      console.log(`✓ ${tableName}: 0 rows migrated.`);
      return;
    }

    const docs = rows.map(r => {
      const doc = transformFn ? transformFn(r) : { ...r };
      if (!doc._id) {
        doc._id = doc[idField] !== undefined ? doc[idField] : doc.id;
      }
      return doc;
    });

    await col.insertMany(docs);
    const count = await col.countDocuments();
    console.log(`✓ ${tableName} -> ${collectionName}: ${count} documents inserted.`);
  }

  // 1. Categories
  await migrateTable('categories', 'categories', (row) => ({
    id: row.id,
    name: row.name,
    image: row.image || '',
    subtitle: row.subtitle || '',
    createdAt: row.createdAt
  }));

  // 2. Users
  await migrateTable('users', 'users', (row) => ({
    id: row.id,
    name: row.name,
    email: (row.email || '').toLowerCase(),
    password: row.password,
    role: row.role || 'user',
    createdAt: row.createdAt
  }));

  // 3. Products
  await migrateTable('products', 'products', (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    discountPercent: parseFloat(row.discountPercent || 0),
    category: row.category,
    subcategory: row.subcategory || '',
    brand: row.brand || '',
    gender: row.gender || '',
    image: row.image,
    stock: parseInt(row.stock || 0),
    rating: parseFloat(row.rating || 4.5),
    variantData: row.variantData || '[]',
    createdAt: row.createdAt
  }));

  // 4. Product Size Inventory
  await migrateTable('product_size_inventory', 'product_size_inventory', (row) => ({
    id: row.id,
    productId: row.productId,
    sizeName: row.sizeName,
    stock: parseInt(row.stock || 0),
    createdAt: row.createdAt
  }));

  // 5. Cart Items
  await migrateTable('cart_items', 'cart_items', (row) => ({
    _id: `${row.userId}_${row.productId}_${row.variantId || ''}`,
    userId: row.userId,
    productId: row.productId,
    variantId: row.variantId || '',
    selectedColor: row.selectedColor || '',
    quantity: parseInt(row.quantity || 1)
  }));

  // 6. Orders
  await migrateTable('orders', 'orders', (row) => ({
    id: row.id,
    orderReference: row.orderReference,
    userId: row.userId,
    totalAmount: parseFloat(row.totalAmount),
    currencyCode: row.currencyCode || 'USD',
    currencyRate: parseFloat(row.currencyRate || 1),
    status: row.status,
    name: row.name,
    email: row.email,
    address: row.address,
    paymentStatus: row.paymentStatus || 'Pending',
    paymentMethod: row.paymentMethod || 'Mock Card',
    platform: row.platform || 'Direct',
    refundStatus: row.refundStatus || 'None',
    refundAmount: parseFloat(row.refundAmount || 0),
    createdAt: row.createdAt
  }));

  // 7. Order Items
  await migrateTable('order_items', 'order_items', (row) => ({
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    name: row.name,
    price: parseFloat(row.price),
    quantity: parseInt(row.quantity),
    image: row.image,
    selectedColor: row.selectedColor || '',
    selectedSize: row.selectedSize || ''
  }));

  // 8. Email Logs
  await migrateTable('email_logs', 'email_logs', (row) => ({
    id: row.id,
    recipient: (row.recipient || '').toLowerCase(),
    subject: row.subject,
    status: row.status,
    sentAt: row.sentAt,
    errorMessage: row.errorMessage || null
  }));

  // 9. Password Resets
  await migrateTable('password_resets', 'password_resets', (row) => ({
    _id: (row.email || '').toLowerCase(),
    email: (row.email || '').toLowerCase(),
    token: row.token,
    expiresAt: row.expiresAt
  }), 'email');

  // 10. Activity Logs
  await migrateTable('activity_logs', 'activity_logs', (row) => ({
    id: row.id,
    adminId: row.adminId,
    adminName: row.adminName,
    action: row.action,
    module: row.module,
    recordId: row.recordId || null,
    oldData: row.oldData || null,
    newData: row.newData || null,
    ipAddress: row.ipAddress || null,
    createdAt: row.createdAt
  }));

  // 11. Site Settings
  await migrateTable('site_settings', 'site_settings', (row) => ({
    _id: row.setting_key,
    setting_key: row.setting_key,
    setting_value: row.setting_value,
    updated_at: row.updated_at
  }), 'setting_key');

  // 12. Support Queries
  await migrateTable('support_queries', 'support_queries', (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    category: row.category,
    message: row.message,
    status: row.status || 'Pending',
    createdAt: row.createdAt
  }));

  // Create indexes for high performance
  console.log('Creating MongoDB indexes...');
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('products').createIndex({ id: 1 }, { unique: true });
  await db.collection('products').createIndex({ category: 1 });
  await db.collection('categories').createIndex({ name: 1 }, { unique: true });
  await db.collection('categories').createIndex({ id: 1 }, { unique: true });
  await db.collection('orders').createIndex({ id: 1 }, { unique: true });
  await db.collection('orders').createIndex({ orderReference: 1 }, { unique: true });
  await db.collection('orders').createIndex({ userId: 1 });
  await db.collection('order_items').createIndex({ orderId: 1 });
  await db.collection('product_size_inventory').createIndex({ productId: 1, sizeName: 1 });
  await db.collection('cart_items').createIndex({ userId: 1, productId: 1, variantId: 1 });
  await db.collection('activity_logs').createIndex({ createdAt: -1 });

  console.log('✓ All indexes created successfully.');

  await mysqlConn.end();
  await mongoClient.close();
  console.log('🎉 Migration from MySQL to MongoDB Atlas complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
