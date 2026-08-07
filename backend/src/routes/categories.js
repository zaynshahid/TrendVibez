import express from 'express';
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  findCategoryById
} from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { logActivity, getClientIp } from '../services/activityLogger.js';

const router = express.Router();

// GET ALL CATEGORIES (Public)
router.get('/', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// CREATE CATEGORY (Admin Only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, image, subtitle } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  try {
    const newCategory = await createCategory({ name, image, subtitle });

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'CREATE_CATEGORY',
      module: 'categories',
      recordId: newCategory.id,
      newData: { name: newCategory.name },
      ipAddress: getClientIp(req)
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message || 'Internal Server Error' });
  }
});

// UPDATE CATEGORY (Admin Only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, image, subtitle } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  try {
    const existingCategory = await findCategoryById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const updatedCategory = await updateCategory(req.params.id, { name, image, subtitle });

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_CATEGORY',
      module: 'categories',
      recordId: updatedCategory.id,
      oldData: { name: existingCategory.name },
      newData: { name: updatedCategory.name },
      ipAddress: getClientIp(req)
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message || 'Internal Server Error' });
  }
});

// DELETE CATEGORY (Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const existingCategory = await findCategoryById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const result = await deleteCategory(req.params.id);

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'DELETE_CATEGORY',
      module: 'categories',
      recordId: existingCategory.id,
      oldData: { name: existingCategory.name },
      ipAddress: getClientIp(req)
    });

    res.json(result);
  } catch (error) {
    console.error('Delete category error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message || 'Internal Server Error' });
  }
});

export default router;
