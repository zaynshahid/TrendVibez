import express from 'express';
import { getCartByUserId, addOrIncrementCartItem, updateCartItemQuantity, removeCartItem, getProductById } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET CART FOR LOGGED IN USER
router.get('/', requireAuth, async (req, res) => {
  try {
    const hydratedCart = await getCartByUserId(req.user.id);
    res.json(hydratedCart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ADD ITEM TO CART (OR INCREMENT IF EXISTS)
router.post('/', requireAuth, async (req, res) => {
  const { productId, variantId, selectedColor, quantity } = req.body;
  const qty = parseInt(quantity) || 1;
  const sColor = selectedColor || '';
  const vId = variantId || '';

  if (!productId || qty <= 0) {
    return res.status(400).json({ message: 'Valid Product ID and positive quantity are required' });
  }

  try {
    // Verify product exists
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let maxStock = product.stock;
    if (sColor && Array.isArray(product.sizeInventory) && product.sizeInventory.length > 0) {
      const matchingSize = product.sizeInventory.find(entry => (entry.sizeName || '').toLowerCase() === sColor.toLowerCase());
      if (matchingSize) {
        maxStock = parseInt(matchingSize.stock || 0);
      }
    } else if (vId && Array.isArray(product.variants)) {
      const variant = product.variants.find(v => v.id === vId);
      if (variant) {
        maxStock = parseInt(variant.stock || 0);
      }
    }

    const hydratedCart = await addOrIncrementCartItem(req.user.id, productId, vId, sColor, qty, maxStock);
    res.json(hydratedCart);
  } catch (error) {
    console.error('Add to cart error:', error);
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// UPDATE ITEM QUANTITY IN CART
router.put('/', requireAuth, async (req, res) => {
  const { productId, variantId, selectedColor, quantity } = req.body;
  const qty = parseInt(quantity);
  const vId = variantId || '';
  const sColor = selectedColor || '';

  if (!productId || qty === undefined || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Valid Product ID and positive quantity are required' });
  }

  try {
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let maxStock = product.stock;
    if (Array.isArray(product.sizeInventory) && product.sizeInventory.length > 0) {
      const matchingSize = product.sizeInventory.find(entry => (entry.sizeName || '').toLowerCase() === (sColor || '').toLowerCase());
      if (matchingSize) {
        maxStock = parseInt(matchingSize.stock || 0);
      }
    } else if (vId && Array.isArray(product.variants)) {
      const variant = product.variants.find(v => v.id === vId);
      if (variant) {
        maxStock = parseInt(variant.stock || 0);
      }
    }

    if (qty > maxStock) {
      return res.status(400).json({ message: `Insufficient stock. Only ${maxStock} items available.` });
    }

    const hydratedCart = await updateCartItemQuantity(req.user.id, productId, vId, qty);
    res.json(hydratedCart);
  } catch (error) {
    console.error('Update cart item quantity error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// REMOVE ITEM FROM CART
router.delete('/:productId', requireAuth, async (req, res) => {
  const { productId } = req.params;
  const variantId = req.query.variantId || '';
  try {
    const cart = await getCartByUserId(req.user.id);
    const itemExists = cart.some(item => item.productId === productId && (item.variantId || '') === variantId);
    if (!itemExists) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const hydratedCart = await removeCartItem(req.user.id, productId, variantId);
    res.json(hydratedCart);
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
