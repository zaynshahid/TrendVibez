import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductSizeOptions, getProductRecommendations, bulkUpdateProductDiscounts } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { logActivity, getClientIp } from '../services/activityLogger.js';

const router = express.Router();

// GET ALL PRODUCTS (with filtering, sorting, searching, discounted)
router.get('/', async (req, res) => {
  const { category, subcategory, q, sort, minPrice, maxPrice, minRating, inStock, size, discounted } = req.query;
  try {
    const products = await getAllProducts({ category, subcategory, q, sort, minPrice, maxPrice, minRating, inStock, size, discounted });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET SIZE OPTIONS (derived from product size variants, optionally by category)
router.get('/meta/sizes', async (req, res) => {
  const { category } = req.query;
  try {
    const sizes = await getProductSizeOptions({ category });
    res.json(sizes);
  } catch (error) {
    console.error('Get product size options error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// BULK UPDATE PRODUCT DISCOUNTS (Admin Only)
router.put('/bulk-discount', requireAdmin, async (req, res) => {
  const { productIds, discountPercent } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ message: 'Product IDs array is required' });
  }
  const parsedDiscount = parseFloat(discountPercent);
  if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
    return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
  }
  try {
    await bulkUpdateProductDiscounts(productIds, parsedDiscount);
    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'BULK_DISCOUNT_PRODUCTS',
      module: 'products',
      recordId: 'bulk',
      newData: { count: productIds.length, discountPercent: parsedDiscount, productIds },
      ipAddress: getClientIp(req)
    });
    res.json({ message: `Discount updated to ${parsedDiscount}% for ${productIds.length} item(s).`, updatedCount: productIds.length });
  } catch (error) {
    console.error('Bulk discount error:', error);
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

// GET PRODUCT RECOMMENDATIONS
router.get('/:id/recommendations', async (req, res) => {
  try {
    const recommendations = await getProductRecommendations(req.params.id);
    res.json(recommendations);
  } catch (error) {
    console.error('Get product recommendations error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// CREATE PRODUCT (Admin Only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, description, price, discountPercent, category, subcategory, brand, gender, image, stock, rating, variants } = req.body;

  if (!name || !description || price === undefined || !category || !image || stock === undefined) {
    return res.status(400).json({ message: 'All product fields are required' });
  }

  const parsedPrice = parseFloat(price);
  const parsedStock = parseInt(stock);
  const parsedDiscount = discountPercent !== undefined ? parseFloat(discountPercent) : 0;

  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: 'Price must be a positive number' });
  }
  if (isNaN(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ message: 'Stock must be a positive integer' });
  }
  if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
    return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
  }

  try {
    const newProduct = await createProduct({
      id: uuidv4(),
      name,
      description,
      price: parsedPrice,
      discountPercent: parsedDiscount,
      category,
      subcategory: subcategory || '',
      brand: brand || '',
      gender: gender || '',
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
      newData: { name: newProduct.name, price: newProduct.price, discountPercent: newProduct.discountPercent, category: newProduct.category, stock: newProduct.stock },
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
  const { name, description, price, discountPercent, category, subcategory, brand, gender, image, stock, rating, variants } = req.body;
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (subcategory !== undefined) updates.subcategory = subcategory;
    if (brand !== undefined) updates.brand = brand;
    if (gender !== undefined) updates.gender = gender;
    if (image !== undefined) updates.image = image;

    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'Price must be a positive number' });
      }
      updates.price = parsedPrice;
    }

    if (discountPercent !== undefined) {
      const parsedDiscount = parseFloat(discountPercent);
      if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
        return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
      }
      updates.discountPercent = parsedDiscount;
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
      oldData: { name: product.name, price: product.price, discountPercent: product.discountPercent, category: product.category, stock: product.stock, variants: product.variants },
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
