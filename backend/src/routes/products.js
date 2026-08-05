import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { logActivity, getClientIp } from '../services/activityLogger.js';

const router = express.Router();

// GET ALL PRODUCTS (with filtering, sorting, searching)
router.get('/', async (req, res) => {
  const { category, q, sort, minPrice, maxPrice, minRating, inStock } = req.query;
  try {
    const products = await getAllProducts({ category, q, sort, minPrice, maxPrice, minRating, inStock });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET PRODUCT DETAILS BY ID
router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// CREATE PRODUCT (Admin Only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, description, price, category, image, stock, rating, variants } = req.body;

  if (!name || !description || price === undefined || !category || !image || stock === undefined) {
    return res.status(400).json({ message: 'All product fields are required' });
  }

  const parsedPrice = parseFloat(price);
  const parsedStock = parseInt(stock);

  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: 'Price must be a positive number' });
  }
  if (isNaN(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ message: 'Stock must be a positive integer' });
  }

  try {
    const newProduct = await createProduct({
      id: uuidv4(),
      name,
      description,
      price: parsedPrice,
      category,
      image,
      stock: parsedStock,
      rating: rating !== undefined ? parseFloat(rating) : 4.5,
      variants: Array.isArray(variants) ? variants : [],
      createdAt: new Date().toISOString()
    });

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'CREATE_PRODUCT',
      module: 'products',
      recordId: newProduct.id,
      newData: { name: newProduct.name, price: newProduct.price, category: newProduct.category, stock: newProduct.stock },
      ipAddress: getClientIp(req)
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// UPDATE PRODUCT (Admin Only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, description, price, category, image, stock, rating, variants } = req.body;
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (image !== undefined) updates.image = image;

    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'Price must be a positive number' });
      }
      updates.price = parsedPrice;
    }

    if (stock !== undefined) {
      const parsedStock = parseInt(stock);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ message: 'Stock must be a positive integer' });
      }
      updates.stock = parsedStock;
    }

    if (rating !== undefined) {
      const parsedRating = parseFloat(rating);
      if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
        updates.rating = parsedRating;
      }
    }

    if (variants !== undefined) {
      updates.variants = Array.isArray(variants) ? variants : [];
    }

    const updatedProduct = await updateProduct(req.params.id, updates);

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_PRODUCT',
      module: 'products',
      recordId: product.id,
      oldData: { name: product.name, price: product.price, category: product.category, stock: product.stock, variants: product.variants },
      newData: updates,
      ipAddress: getClientIp(req)
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE PRODUCT (Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await deleteProduct(req.params.id);

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'DELETE_PRODUCT',
      module: 'products',
      recordId: product.id,
      oldData: { name: product.name, price: product.price, category: product.category, stock: product.stock },
      ipAddress: getClientIp(req)
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
