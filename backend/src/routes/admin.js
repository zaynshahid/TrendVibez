import express from 'express';
import { getAdminStats, getAllUsers, findUserById, updateUser, deleteUser, clearCart, getFeaturedNotificationSetting, updateFeaturedNotificationSetting } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { logActivity, getClientIp } from '../services/activityLogger.js';
import { publishProductToInstagram, publishCarouselToInstagram, getInstagramAccount } from '../services/instagramService.js';
import { publishProductToFacebook, publishMultiPhotoToFacebook, getFacebookPage } from '../services/facebookService.js';


const router = express.Router();

/**
 * Resolves the frontend base URL dynamically from environment variables.
 */
function getFrontendUrl() {
  const url = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
  return url.replace(/\/+$/, '');
}

/**
 * Appends direct product link to Facebook single post message if not already present.
 * Facebook posts support clickable URLs directly in post captions.
 */
function formatFacebookProductMessage(message = '', productId) {
  if (!productId) return message;
  const frontendUrl = getFrontendUrl();
  const productUrl = `${frontendUrl}/product/${productId}?source=facebook`;
  if (message && message.includes(`/product/${productId}`)) return message;
  const linkSection = `🛒 Shop Now: ${productUrl}`;
  return message ? `${message.trim()}\n\n${linkSection}` : linkSection;
}

/**
 * Appends direct product link to Instagram single post caption if not already present.
 * Respects Instagram's limitations on clickable links by providing a clear URL + bio CTA.
 */
function formatInstagramProductCaption(caption = '', productId) {
  if (!productId) return caption;
  const frontendUrl = getFrontendUrl();
  const productUrl = `${frontendUrl}/product/${productId}?source=instagram`;
  if (caption && caption.includes(`/product/${productId}`)) return caption;
  const linkSection = `🔗 Product Link: ${productUrl}\n(Tap link in bio to shop or copy link above!)`;
  return caption ? `${caption.trim()}\n\n${linkSection}` : linkSection;
}

/**
 * Appends direct links for all carousel products to Instagram Carousel caption if not already present.
 */
function formatInstagramCarouselCaption(caption = '', productIds = [], productNames = []) {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) return caption;
  const frontendUrl = getFrontendUrl();
  const missingLinks = [];
  productIds.forEach((id, idx) => {
    if (id && (!caption || !caption.includes(`/product/${id}`))) {
      const name = productNames && productNames[idx] ? productNames[idx] : `Product ${idx + 1}`;
      missingLinks.push(`${idx + 1}️⃣ ${name}: ${frontendUrl}/product/${id}?source=instagram`);
    }
  });
  if (missingLinks.length === 0) return caption;
  const linksBlock = `🔗 Direct Product Links:\n${missingLinks.join('\n')}\n(Tap link in bio to shop or copy link above!)`;
  return caption ? `${caption.trim()}\n\n${linksBlock}` : linksBlock;
}

/**
 * Appends direct links for all gallery products to Facebook multi-photo post message if not already present.
 */
function formatFacebookMultiMessage(message = '', productIds = [], productNames = []) {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) return message;
  const frontendUrl = getFrontendUrl();
  const missingLinks = [];
  productIds.forEach((id, idx) => {
    if (id && (!message || !message.includes(`/product/${id}`))) {
      const name = productNames && productNames[idx] ? productNames[idx] : `Product ${idx + 1}`;
      missingLinks.push(`🛒 ${name}: ${frontendUrl}/product/${id}?source=facebook`);
    }
  });
  if (missingLinks.length === 0) return message;
  const linksBlock = `🛒 Direct Product Links:\n${missingLinks.join('\n')}`;
  return message ? `${message.trim()}\n\n${linksBlock}` : linksBlock;
}


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

// GET INSTAGRAM ACCOUNT STATUS
router.get('/instagram/status', requireAdmin, async (req, res) => {
  try {
    const account = await getInstagramAccount();
    res.json({
      success: true,
      connected: true,
      account,
    });
  } catch (error) {
    console.error('Instagram status check error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      connected: false,
      message: error.message || 'Unable to connect to Instagram Graph API',
      metaDetails: error.metaError || null,
    });
  }
});

// PUBLISH PRODUCT TO INSTAGRAM FEED
router.post('/publish-to-instagram', requireAdmin, async (req, res) => {
  try {
    const { imageUrl, caption, productId, productName } = req.body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid public imageUrl is required to publish to Instagram.',
      });
    }

    const finalCaption = formatInstagramProductCaption(caption || '', productId);
    const result = await publishProductToInstagram(imageUrl, finalCaption);

    // Log admin activity
    try {
      logActivity({
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin',
        action: 'PUBLISH_INSTAGRAM_POST',
        module: 'products',
        recordId: productId || result.postId,
        newData: {
          productName: productName || 'Unknown Product',
          imageUrl,
          caption: finalCaption,
          productUrl: productId ? `${getFrontendUrl()}/product/${productId}` : null,
          postId: result.postId,
          containerId: result.containerId,
        },
        ipAddress: getClientIp(req),
      });
    } catch (logErr) {
      console.warn('Activity logging failed for Instagram publish:', logErr.message);
    }

    res.json({
      success: true,
      message: 'Product successfully published to your Instagram feed!',
      postId: result.postId,
      containerId: result.containerId,
      productUrl: productId ? `${getFrontendUrl()}/product/${productId}` : null,
    });
  } catch (error) {
    console.error('Instagram publish error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to publish post to Instagram.',
      metaDetails: error.metaError || null,
    });
  }
});

// GET FACEBOOK PAGE STATUS
router.get('/facebook/status', requireAdmin, async (req, res) => {
  try {
    const page = await getFacebookPage();
    res.json({
      success: true,
      connected: true,
      page,
    });
  } catch (error) {
    console.error('Facebook status check error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      connected: false,
      message: error.message || 'Unable to connect to Facebook Graph API',
      metaDetails: error.metaError || null,
    });
  }
});

// PUBLISH PRODUCT TO FACEBOOK PAGE
router.post('/publish-to-facebook', requireAdmin, async (req, res) => {
  try {
    const { imageUrl, message, productId, productName } = req.body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid public imageUrl is required to publish to Facebook.',
      });
    }

    const finalMessage = formatFacebookProductMessage(message || '', productId);
    const result = await publishProductToFacebook(imageUrl, finalMessage);

    // Log admin activity
    try {
      logActivity({
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin',
        action: 'PUBLISH_FACEBOOK_POST',
        module: 'products',
        recordId: productId || result.postId,
        newData: {
          productName: productName || 'Unknown Product',
          imageUrl,
          message: finalMessage,
          productUrl: productId ? `${getFrontendUrl()}/product/${productId}` : null,
          postId: result.postId,
        },
        ipAddress: getClientIp(req),
      });
    } catch (logErr) {
      console.warn('Activity logging failed for Facebook publish:', logErr.message);
    }

    res.json({
      success: true,
      message: 'Product successfully published to your Facebook Page!',
      postId: result.postId,
      productUrl: productId ? `${getFrontendUrl()}/product/${productId}` : null,
    });
  } catch (error) {
    console.error('Facebook publish error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to publish post to Facebook.',
      metaDetails: error.metaError || null,
    });
  }
});

// PUBLISH MULTIPLE PRODUCTS AS A SINGLE INSTAGRAM CAROUSEL POST
router.post('/publish-carousel-to-instagram', requireAdmin, async (req, res) => {
  try {
    const { imageUrls, caption, productIds, productNames } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 valid image URLs are required to publish an Instagram Carousel.',
      });
    }

    if (imageUrls.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Instagram Carousel supports a maximum of 10 images per post.',
      });
    }

    const finalCaption = formatInstagramCarouselCaption(caption || '', productIds, productNames);
    const result = await publishCarouselToInstagram(imageUrls, finalCaption);

    const productUrls = Array.isArray(productIds) ? productIds.map(id => `${getFrontendUrl()}/product/${id}`) : [];

    // Log admin activity
    try {
      logActivity({
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin',
        action: 'PUBLISH_INSTAGRAM_CAROUSEL',
        module: 'products',
        recordId: (productIds && productIds[0]) || result.postId,
        newData: {
          productCount: imageUrls.length,
          productNames: productNames || [],
          imageUrls,
          caption: finalCaption,
          productUrls,
          postId: result.postId,
          carouselContainerId: result.carouselContainerId,
        },
        ipAddress: getClientIp(req),
      });
    } catch (logErr) {
      console.warn('Activity logging failed for Instagram Carousel publish:', logErr.message);
    }

    res.json({
      success: true,
      message: `Successfully published ${imageUrls.length} products in a single Instagram Carousel post!`,
      postId: result.postId,
      carouselContainerId: result.carouselContainerId,
      productUrls,
    });
  } catch (error) {
    console.error('Instagram Carousel publish error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to publish Carousel post to Instagram.',
      metaDetails: error.metaError || null,
    });
  }
});

// PUBLISH MULTIPLE PRODUCTS AS A SINGLE FACEBOOK MULTI-PHOTO GALLERY POST
router.post('/publish-multi-to-facebook', requireAdmin, async (req, res) => {
  try {
    const { imageUrls, message, productIds, productNames } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 valid image URLs are required to publish a multi-photo Facebook post.',
      });
    }

    const finalMessage = formatFacebookMultiMessage(message || '', productIds, productNames);
    const result = await publishMultiPhotoToFacebook(imageUrls, finalMessage);

    const productUrls = Array.isArray(productIds) ? productIds.map(id => `${getFrontendUrl()}/product/${id}`) : [];

    // Log admin activity
    try {
      logActivity({
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin',
        action: 'PUBLISH_FACEBOOK_MULTI',
        module: 'products',
        recordId: (productIds && productIds[0]) || result.postId,
        newData: {
          productCount: imageUrls.length,
          productNames: productNames || [],
          imageUrls,
          message: finalMessage,
          productUrls,
          postId: result.postId,
        },
        ipAddress: getClientIp(req),
      });
    } catch (logErr) {
      console.warn('Activity logging failed for Facebook multi-photo publish:', logErr.message);
    }

    res.json({
      success: true,
      message: `Successfully published ${imageUrls.length} products in a single Facebook Gallery post!`,
      postId: result.postId,
      productUrls,
    });
  } catch (error) {
    console.error('Facebook multi-photo publish error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to publish multi-photo post to Facebook.',
      metaDetails: error.metaError || null,
    });
  }
});

export default router;

