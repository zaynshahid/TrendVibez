/**
 * services/instagramService.js
 * Comprehensive Meta Instagram Graph API (v21.0) Service
 */

const API_VERSION = 'v21.0';

/**
 * Resolves the primary Graph API base URL for Instagram tokens.
 * Instagram User tokens (IGAA...) use https://graph.instagram.com.
 * Facebook Graph tokens (EAAP... / EAA...) use https://graph.facebook.com.
 */
function getGraphBase() {
  const token = process.env.IG_ACCESS_TOKEN || '';
  if (token.startsWith('IGAA') || token.startsWith('IGA')) {
    return 'https://graph.instagram.com/' + API_VERSION;
  }
  return 'https://graph.facebook.com/' + API_VERSION;
}

/**
 * Resolves the Instagram user ID and access token from environment variables.
 */
function getCredentials() {
  const userId = process.env.IG_USER_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('IG_ACCESS_TOKEN is not configured in backend environment variables.');
  }

  return { userId, accessToken };
}

/**
 * Parses Meta API error objects into clear, actionable error messages.
 */
function parseMetaError(data, fallbackMessage = 'Instagram Graph API request failed.') {
  const error = data?.error;
  if (!error) return fallbackMessage;

  let msg = error.message || fallbackMessage;

  // Specific common codes & subcodes
  if (error.code === 200 || error.message?.toLowerCase().includes('api access blocked')) {
    msg = 'Meta API access is blocked (Error 200). Common causes: 1) Your Meta App is in Development mode and your Instagram account hasn\'t accepted the Tester invite in Instagram Settings -> Website permissions -> Apps and Websites -> Tester Invites. 2) The Instagram account is personal instead of Professional/Creator/Business. 3) Missing "instagram_content_publish" permission on your token.';
  } else if (error.error_subcode === 2207009) {
    msg = 'Image aspect ratio is invalid. Instagram requires aspect ratio between 4:5 (0.80) and 1.91:1.';
  } else if (error.error_subcode === 2207001) {
    msg = 'Invalid image format or image could not be fetched from the URL. Ensure the URL is public and in JPG/PNG format.';
  } else if (error.code === 190) {
    msg = 'Instagram access token has expired or is invalid. Please regenerate your token in the Meta Developer portal (Graph API Explorer).';
  } else if (error.error_user_msg) {
    msg = `${error.error_user_title ? error.error_user_title + ': ' : ''}${error.error_user_msg}`;
  }

  return msg;
}

/**
 * Retrieves profile information for the connected Instagram Business account.
 */
export async function getInstagramAccount() {
  const { accessToken, userId } = getCredentials();
  const endpoint = `${getGraphBase()}/${userId || 'me'}?fields=id,username,name,profile_picture_url,account_type&access_token=${accessToken}`;

  const res = await fetch(endpoint);
  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Could not retrieve Instagram account details.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return data;
}

/**
 * STEP 1: Create a media container on Instagram.
 * @param {string} imageUrl - Publicly accessible URL of the product image (JPG/PNG).
 * @param {string} caption - Post caption including text & hashtags.
 * @returns {Promise<string>} The creation ID / container ID.
 */
export async function createMediaContainer(imageUrl, caption = '') {
  const { userId, accessToken } = getCredentials();
  const targetId = userId || 'me';

  const endpoint = `${getGraphBase()}/${targetId}/media`;
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption: caption,
    access_token: accessToken,
  });

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Failed to create Instagram media container.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return data.id;
}

/**
 * STEP 2: Publish the media container to the live Instagram Feed.
 * @param {string} containerId - The container ID returned by createMediaContainer.
 * @returns {Promise<string>} The live Instagram Post ID.
 */
export async function publishMediaContainer(containerId) {
  const { userId, accessToken } = getCredentials();
  const targetId = userId || 'me';

  const endpoint = `${getGraphBase()}/${targetId}/media_publish`;
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Failed to publish media container to Instagram.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return data.id;
}

/**
 * STEP 1B: Create an Instagram Carousel Item container for a single image.
 * @param {string} imageUrl - Publicly accessible URL of the product image.
 * @returns {Promise<string>} Child container creation ID.
 */
export async function createCarouselItemContainer(imageUrl) {
  const { userId, accessToken } = getCredentials();
  const targetId = userId || 'me';

  const endpoint = `${getGraphBase()}/${targetId}/media`;
  const params = new URLSearchParams({
    image_url: imageUrl,
    is_carousel_item: 'true',
    access_token: accessToken,
  });

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Failed to create Instagram carousel item.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return data.id;
}

/**
 * STEP 2B: Create an Instagram parent Carousel container linking all child containers.
 * @param {string[]} childrenIds - Array of child container IDs (between 2 and 10).
 * @param {string} caption - Post caption for the whole carousel.
 * @returns {Promise<string>} Parent Carousel container ID.
 */
export async function createCarouselContainer(childrenIds, caption = '') {
  if (!childrenIds || childrenIds.length < 2) {
    throw new Error('Instagram Carousel requires at least 2 items.');
  }
  if (childrenIds.length > 10) {
    throw new Error('Instagram Carousel supports a maximum of 10 items.');
  }

  const { userId, accessToken } = getCredentials();
  const targetId = userId || 'me';

  const endpoint = `${getGraphBase()}/${targetId}/media`;
  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: accessToken,
  });

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = parseMetaError(data, 'Failed to create Instagram parent carousel container.');
    const err = new Error(errorMsg);
    err.metaError = data.error;
    err.statusCode = res.status;
    throw err;
  }

  return data.id;
}

/**
 * High-level orchestration function to publish a single product directly to Instagram.
 * @param {string} imageUrl - Remote public image URL.
 * @param {string} caption - Post caption.
 */
export async function publishProductToInstagram(imageUrl, caption) {
  if (!imageUrl) {
    throw new Error('Image URL is required for Instagram publication.');
  }

  // 1. Create Media Container
  const containerId = await createMediaContainer(imageUrl, caption);

  // 2. Publish Container to Feed
  const postId = await publishMediaContainer(containerId);

  return {
    containerId,
    postId,
  };
}

/**
 * High-level orchestration function to publish multiple products in a SINGLE Instagram Carousel post.
 * @param {string[]} imageUrls - Array of public image URLs (2 to 10 images).
 * @param {string} caption - Single combined caption for the carousel post.
 */
export async function publishCarouselToInstagram(imageUrls, caption) {
  if (!imageUrls || imageUrls.length < 2) {
    throw new Error('Instagram Carousel post requires at least 2 images.');
  }
  if (imageUrls.length > 10) {
    throw new Error('Instagram Carousel post supports a maximum of 10 images.');
  }

  // 1. Create individual carousel child containers in parallel
  const childContainerIds = await Promise.all(
    imageUrls.map(url => createCarouselItemContainer(url))
  );

  // 2. Create the master carousel container
  const carouselContainerId = await createCarouselContainer(childContainerIds, caption);

  // 3. Publish the carousel container to the live Instagram feed
  const postId = await publishMediaContainer(carouselContainerId);

  return {
    carouselContainerId,
    childContainerIds,
    postId,
  };
}

