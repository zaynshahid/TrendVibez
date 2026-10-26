/**
 * services/facebookService.js
 * Meta Facebook Graph API (v21.0) Service
 * Posts product photos to the configured Facebook Page.
 */

const API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Reads Facebook Page credentials from environment variables.
 */
function getCredentials() {
  const pageId = process.env.FB_PAGE_ID;
  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId) {
    throw new Error('FB_PAGE_ID is not configured in backend environment variables.');
  }
  if (!accessToken) {
    throw new Error('FB_PAGE_ACCESS_TOKEN is not configured in backend environment variables.');
  }

  return { pageId, accessToken };
}

/**
 * Parses Meta Graph API error objects into a clear, readable message.
 */
function parseMetaError(data, fallbackMessage = 'Facebook Graph API request failed.') {
  const error = data?.error;
  if (!error) return fallbackMessage;

  let msg = error.message || fallbackMessage;

  if (error.code === 190) {
    msg = 'Facebook Page Access Token has expired or is invalid. Please regenerate your token in the Meta Developer portal.';
  } else if (error.code === 200 || error.code === 10) {
    msg = 'Insufficient permissions. Ensure the Page Access Token has pages_manage_posts and pages_read_engagement permissions.';
  } else if (error.error_user_msg) {
    msg = `${error.error_user_title ? error.error_user_title + ': ' : ''}${error.error_user_msg}`;
  }

  return msg;
}

/**
 * Retrieves the connected Facebook Page details (name, ID, followers).
 */
export async function getFacebookPage() {
  const { pageId, accessToken } = getCredentials();
  const endpoint = `${GRAPH_BASE}/${pageId}?fields=id,name,picture&access_token=${accessToken}`;

  const res = await fetch(endpoint);
  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Could not retrieve Facebook Page details.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return data;
}

/**
 * Publishes a product photo post to the Facebook Page feed.
 * Uses the /photos endpoint to attach an image with a message caption.
 *
 * @param {string} imageUrl - Publicly accessible HTTPS URL of the product image.
 * @param {string} message  - Post message including caption and hashtags.
 * @returns {Promise<{ postId: string }>}
 */
export async function publishProductToFacebook(imageUrl, message) {
  if (!imageUrl) {
    throw new Error('Image URL is required for Facebook publication.');
  }

  const { pageId, accessToken } = getCredentials();
  const endpoint = `${GRAPH_BASE}/${pageId}/photos`;

  const params = new URLSearchParams({
    url: imageUrl,
    message: message || '',
    access_token: accessToken,
  });

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Failed to publish photo post to Facebook Page.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return {
    postId: data.post_id || data.id,
  };
}

/**
 * Uploads an unpublished photo to the Facebook Page for use in a multi-photo post.
 * @param {string} imageUrl - Public image URL.
 * @returns {Promise<string>} Uploaded photo ID (media_fbid).
 */
export async function uploadUnpublishedPhoto(imageUrl) {
  if (!imageUrl) {
    throw new Error('Image URL is required for Facebook upload.');
  }

  const { pageId, accessToken } = getCredentials();
  const endpoint = `${GRAPH_BASE}/${pageId}/photos`;

  const params = new URLSearchParams({
    url: imageUrl,
    published: 'false',
    access_token: accessToken,
  });

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Failed to upload photo for multi-photo post.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return data.id;
}

/**
 * Publishes multiple product photos in a SINGLE Facebook Gallery post.
 * @param {string[]} imageUrls - Array of public image URLs.
 * @param {string} message - Combined caption/message for the single post.
 * @returns {Promise<{ postId: string, photoIds: string[] }>}
 */
export async function publishMultiPhotoToFacebook(imageUrls, message) {
  if (!imageUrls || imageUrls.length < 2) {
    throw new Error('Multi-photo Facebook post requires at least 2 images.');
  }

  const { pageId, accessToken } = getCredentials();

  // 1. Upload all photos as unpublished
  const photoIds = await Promise.all(
    imageUrls.map(url => uploadUnpublishedPhoto(url))
  );

  // 2. Publish a single feed post with all attached photos
  const endpoint = `${GRAPH_BASE}/${pageId}/feed`;
  const attachedMedia = photoIds.map(id => ({ media_fbid: id }));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || '',
      attached_media: attachedMedia,
      access_token: accessToken,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Failed to publish multi-photo post to Facebook Page.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return {
    postId: data.id,
    photoIds,
  };
}

