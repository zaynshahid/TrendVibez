import express from 'express';
import { getAdminStats, getAllUsers, findUserById, updateUser, deleteUser, clearCart, getFeaturedNotificationSetting, updateFeaturedNotificationSetting } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { logActivity, getClientIp } from '../services/activityLogger.js';

const router = express.Router();

// GET FEATURED NOTIFICATION SETTING (Public for homepage popup)
router.get('/settings/featured-notification', async (req, res) => {
  try {
    const setting = await getFeaturedNotificationSetting();
    res.json(setting);
  } catch (error) {
    console.error('Get featured notification error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// UPDATE FEATURED NOTIFICATION SETTING (Admin Protected)
router.put('/settings/featured-notification', requireAdmin, async (req, res) => {
  try {
    const { enabled, productId } = req.body;
    const updated = await updateFeaturedNotificationSetting(enabled, productId);

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_FEATURED_NOTIFICATION',
      module: 'settings',
      recordId: productId || 'auto',
      newData: { enabled, productId },
      ipAddress: getClientIp(req)
    });

    res.json({ message: 'Notification settings updated successfully', setting: updated });
  } catch (error) {
    console.error('Update featured notification error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET SALES & ORDERS STATS
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET REGISTERED USERS
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// UPDATE USER ROLE (Promote/Demote)
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Role must be user or admin' });
  }

  // Prevent self-demotion
  if (req.user.id === req.params.id) {
    return res.status(400).json({ message: 'You cannot change your own admin role.' });
  }

  try {
    const user = await findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await updateUser(req.params.id, { role });

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_USER_ROLE',
      module: 'users',
      recordId: user.id,
      oldData: { name: user.name, email: user.email, role: user.role },
      newData: { name: user.name, email: user.email, role },
      ipAddress: getClientIp(req)
    });

    res.json({ message: `User role updated to ${role} successfully`, user: updatedUser });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE USER
router.delete('/users/:id', requireAdmin, async (req, res) => {
  // Prevent self-deletion
  if (req.user.id === req.params.id) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  try {
    const user = await findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await deleteUser(req.params.id);
    await clearCart(req.params.id); // Clean up user's cart

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'DELETE_USER',
      module: 'users',
      recordId: user.id,
      oldData: { name: user.name, email: user.email, role: user.role },
      ipAddress: getClientIp(req)
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
