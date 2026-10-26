import { GoogleGenAI, Type } from '@google/genai';
import {
  getAllProducts,
  getProductById,
  getAllCategories,
  getOrders,
  getCartByUserId,
  addOrIncrementCartItem,
  removeCartItem,
  clearCart,
  query
} from '../db.js';

// Initialize Google Gen AI client with API key from environment
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

// Function declarations (tools) for Gemini
const chatTools = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Search TrendVibe products catalog with optional filters for category, keyword search, price range, rating, size, and stock availability.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            search: {
              type: Type.STRING,
              description: 'Keyword search query matching product name or description, e.g. "jacket", "dress", "sneakers"'
            },
            category: {
              type: Type.STRING,
              description: 'Filter by category name, e.g. "Men", "Women", "Kids", "Footwear"'
            },
            minPrice: {
              type: Type.NUMBER,
              description: 'Minimum price filter in USD'
            },
            maxPrice: {
              type: Type.NUMBER,
              description: 'Maximum price filter in USD'
            },
            minRating: {
              type: Type.NUMBER,
              description: 'Minimum star rating filter between 1.0 and 5.0'
            },
            inStock: {
              type: Type.BOOLEAN,
              description: 'Set to true to only return products with available stock (> 0)'
            },
            discounted: {
              type: Type.BOOLEAN,
              description: 'Set to true to only return products currently on sale'
            },
            size: {
              type: Type.STRING,
              description: 'Specific size filter, e.g. "S", "M", "L", "XL", "42"'
            },
            sort: {
              type: Type.STRING,
              description: 'Sorting option: "price_asc", "price_desc", "rating", "newest"'
            },
            limit: {
              type: Type.NUMBER,
              description: 'Maximum number of products to return (default 8, max 20)'
            }
          }
        }
      },
      {
        name: 'get_product_details',
        description: 'Get comprehensive details for a specific product including available sizes, stock per size, colors, description, rating, and price.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: {
              type: Type.STRING,
              description: 'The unique ID (UUID) of the product'
            },
            productName: {
              type: Type.STRING,
              description: 'The name or partial name of the product if ID is unknown'
            }
          }
        }
      },
      {
        name: 'add_to_cart',
        description: 'Add a product directly to the customer shopping cart with specified quantity and size or color variant.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: {
              type: Type.STRING,
              description: 'The unique ID (UUID) of the product to add'
            },
            productName: {
              type: Type.STRING,
              description: 'The name of the product if ID is not known'
            },
            quantity: {
              type: Type.NUMBER,
              description: 'Number of units to add (default 1)'
            },
            size: {
              type: Type.STRING,
              description: 'The chosen clothing or shoe size, e.g. "S", "M", "L", "XL", "Small", "42"'
            },
            color: {
              type: Type.STRING,
              description: 'The chosen color variant if applicable'
            }
          }
        }
      },
      {
        name: 'get_cart',
        description: 'Retrieve the current items, quantities, sizes, and subtotal in the customer shopping cart.',
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: 'remove_from_cart',
        description: 'Remove a specific product or variant from the customer shopping cart.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: {
              type: Type.STRING,
              description: 'The ID of the product to remove'
            },
            productName: {
              type: Type.STRING,
              description: 'The name of the product to remove if ID is unknown'
            },
            size: {
              type: Type.STRING,
              description: 'The size or color variant of the item to remove'
            }
          }
        }
      },
      {
        name: 'get_categories',
        description: 'Retrieve all clothing and footwear categories available at TrendVibe with their descriptions and styling themes.',
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: 'get_user_orders',
        description: 'Get the order history, status, delivery details, and items for the currently logged-in customer. Requires an authenticated user session.',
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: 'get_order_details',
        description: 'Get specific order information by order reference or ID for the authenticated customer.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            orderReferenceOrId: {
              type: Type.STRING,
              description: 'The order reference code (e.g. TV-ORD-1234) or order UUID'
            }
          },
          required: ['orderReferenceOrId']
        }
      },
      {
        name: 'get_store_policies',
        description: 'Get TrendVibe store policies regarding shipping, returns, exchanges, sizing, payment methods, and contact information.',
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      }
    ]
  }
];

const SYSTEM_INSTRUCTION = `
You are the luxury AI Fashion Stylist & Shopping Assistant for "TrendVibe", a high-end fashion brand offering curated apparel and footwear for Men, Women, and Kids.

### Core Guidelines & Rules:
1. **Source of Truth**: All information about products, prices, stock levels, sizes, categories, shopping cart, and customer orders MUST come strictly from tool/function calls to the database. NEVER invent or hallucinate product details, prices, stock availability, or fake order numbers.
2. **Background Page Context & Product Referencing**:
   - The system provides context about the background page the customer is viewing.
   - If the customer refers to "this", "this product", "this item", "this one", "add to cart", "buy this", or asks questions about the product they are viewing without explicitly naming it, ALWAYS assume they are referring to the background viewed product provided in System Context.
   - Immediately invoke \`add_to_cart\` with the viewed product's ID (and selected size/variant if provided) when asked to add to cart.
3. **Adding Items to Cart**:
   - When a user asks to add an item to their cart (e.g., "add this jacket to my cart", "add this one to cart", "add 2 large denim shirts", "buy this"), ALWAYS invoke the \`add_to_cart\` tool.
   - If the user specifies a size or if a selected size is provided in the background page context, pass that size to \`add_to_cart\`.
   - If the item has sizes and neither the user nor page context specifies one, check \`get_product_details\` first to see available in-stock sizes, or invoke \`add_to_cart\` with an available size and notify the customer.
  - Always quote \`discountedPrice\` as the current selling price when it differs from \`price\`; use \`price\` only as the original price for comparison.
  - After executing \`add_to_cart\`, confirm the item name, selected size, quantity, and current selling price, and mention that their cart has been updated.
4. **Viewing & Managing Cart**:
   - Use \`get_cart\` when the customer asks what is in their cart.
   - Use \`remove_from_cart\` when the customer asks to take an item out of their cart.
5. **Product Links & References**: Format recommended items clearly with markdown links like [Product Name](/products/<productId>) and prices ($XX.XX).
6. **Authentication & User Privacy**:
   - Orders are strictly private. If an unauthenticated guest asks about their orders, politely explain that they must log in to view order history.
   - For logged-in users, inspect their orders with \`get_user_orders\` or \`get_order_details\`.
7. **Tone & Style**:
   - Sophisticated, warm, attentive, and fashion-forward.
   - Structure responses clearly with bullet points and bold headers for effortless mobile and desktop reading.
`;

/**
 * Execute a tool function safely against the database with parameterized queries.
 */
async function executeToolCall(toolCall, userContext, cartActionsCollector) {
  const { name, args } = toolCall;
  const safeArgs = args || {};

  try {
    switch (name) {
      case 'search_products': {
        const {
          search,
          category,
          minPrice,
          maxPrice,
          minRating,
          inStock,
          size,
          discounted,
          sort,
          limit = 8
        } = safeArgs;

        const products = await getAllProducts({
          q: search,
          category,
          minPrice,
          maxPrice,
          minRating,
          inStock,
          size,
          discounted,
          sort
        });

        const capped = products.slice(0, Math.min(limit || 8, 20));
        const formatted = capped.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          discountPercent: p.discountPercent,
          discountedPrice: p.discountedPrice,
          category: p.category,
          rating: p.rating,
          stock: p.stock,
          image: p.image,
          sizes: (p.sizeInventory || []).map(s => `${s.sizeName} (${s.stock} in stock)`),
          variants: p.variants || []
        }));

        return {
          totalFound: products.length,
          returnedCount: formatted.length,
          products: formatted
        };
      }

      case 'get_product_details': {
        const { productId, productName } = safeArgs;
        let product = null;

        if (productId) {
          product = await getProductById(productId);
        } else if (productName) {
          const matches = await getAllProducts({ q: productName });
          if (matches.length > 0) {
            product = matches[0];
          }
        }

        if (!product) {
          return { error: `Product not found with identifier "${productId || productName}".` };
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPercent: product.discountPercent,
          discountedPrice: product.discountedPrice,
          category: product.category,
          rating: product.rating,
          stock: product.stock,
          image: product.image,
          sizes: (product.sizeInventory || []).map(s => ({
            size: s.sizeName,
            stock: s.stock
          })),
          variants: product.variants || []
        };
      }

      case 'add_to_cart': {
        const { productId, productName, quantity = 1, size = '', color = '' } = safeArgs;
        let product = null;

        if (productId) {
          product = await getProductById(productId);
        } else if (productName) {
          const matches = await getAllProducts({ q: productName });
          if (matches.length > 0) {
            product = matches[0];
          }
        }

        if (!product) {
          return { error: `Cannot add to cart: Product "${productName || productId}" could not be found in our catalog.` };
        }

        const qty = Math.max(1, parseInt(quantity) || 1);
        let selectedOption = (size || color || '').trim();
        let maxStock = product.stock;
        let variantId = '';

        // Check size inventory
        if (Array.isArray(product.sizeInventory) && product.sizeInventory.length > 0) {
          if (selectedOption) {
            const matchingSize = product.sizeInventory.find(
              s => s.sizeName.toLowerCase() === selectedOption.toLowerCase() ||
                   (s.sizeName.toLowerCase().startsWith('s') && selectedOption.toLowerCase() === 'small') ||
                   (s.sizeName.toLowerCase().startsWith('m') && selectedOption.toLowerCase() === 'medium') ||
                   (s.sizeName.toLowerCase().startsWith('l') && selectedOption.toLowerCase() === 'large')
            );

            if (matchingSize) {
              selectedOption = matchingSize.sizeName;
              maxStock = parseInt(matchingSize.stock || 0);
            } else {
              const availableSizes = product.sizeInventory.filter(s => s.stock > 0).map(s => s.sizeName).join(', ');
              return {
                error: `Size "${selectedOption}" is not available for ${product.name}. Available in-stock sizes: ${availableSizes || 'None'}.`
              };
            }
          } else {
            // Default to first in-stock size if size not specified
            const firstInStock = product.sizeInventory.find(s => s.stock > 0) || product.sizeInventory[0];
            if (firstInStock) {
              selectedOption = firstInStock.sizeName;
              maxStock = parseInt(firstInStock.stock || 0);
            }
          }
        } else if (Array.isArray(product.variants) && product.variants.length > 0) {
          const matchingVar = product.variants.find(
            v => (v.color && v.color.toLowerCase() === selectedOption.toLowerCase()) ||
                 (v.size && v.size.toLowerCase() === selectedOption.toLowerCase())
          ) || product.variants[0];

          if (matchingVar) {
            variantId = matchingVar.id || '';
            selectedOption = matchingVar.color || matchingVar.size || selectedOption;
            maxStock = parseInt(matchingVar.stock || 0);
          }
        }

        if (maxStock <= 0) {
          return { error: `Sorry, ${product.name} (Size: ${selectedOption || 'Standard'}) is currently out of stock.` };
        }

        if (qty > maxStock) {
          return { error: `Only ${maxStock} items available in stock for ${product.name} (Size: ${selectedOption || 'Standard'}).` };
        }

        // If user is authenticated, persist directly into database
        if (userContext && userContext.id) {
          await addOrIncrementCartItem(userContext.id, product.id, variantId, selectedOption, qty, maxStock);
        }

        // Record cart action so frontend CartContext updates instantly
        if (cartActionsCollector) {
          cartActionsCollector.push({
            action: 'add',
            productId: product.id,
            variantId: variantId,
            selectedColor: selectedOption,
            quantity: qty,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              discountPercent: product.discountPercent,
              discountedPrice: product.discountedPrice,
              image: product.image,
              stock: maxStock
            }
          });
        }

        return {
          success: true,
          message: `Successfully added ${qty}x "${product.name}" (${selectedOption ? `Size: ${selectedOption}` : 'Standard'}) to your shopping cart.`,
          addedItem: {
            id: product.id,
            name: product.name,
            price: product.price,
            discountPercent: product.discountPercent,
            discountedPrice: product.discountedPrice,
            size: selectedOption,
            quantity: qty,
            image: product.image
          }
        };
      }

      case 'get_cart': {
        if (!userContext || !userContext.id) {
          return {
            isGuest: true,
            message: 'Your shopping cart is saved locally on your browser. You can view all cart items by clicking the shopping bag icon in the top header.'
          };
        }

        const cart = await getCartByUserId(userContext.id);
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + (item.product.discountedPrice * item.quantity), 0);

        return {
          totalItems,
          subtotal: parseFloat(subtotal.toFixed(2)),
          items: cart.map(i => ({
            productId: i.productId,
            name: i.product.name,
            size: i.selectedColor || 'Standard',
            quantity: i.quantity,
            price: i.product.price,
            discountPercent: i.product.discountPercent,
            discountedPrice: i.product.discountedPrice,
            itemTotal: parseFloat((i.product.discountedPrice * i.quantity).toFixed(2)),
            image: i.product.image
          }))
        };
      }

      case 'remove_from_cart': {
        const { productId, productName, size } = safeArgs;
        let pId = productId;

        if (!pId && productName) {
          const matches = await getAllProducts({ q: productName });
          if (matches.length > 0) pId = matches[0].id;
        }

        if (!pId) {
          return { error: 'Please specify the product you would like to remove from your cart.' };
        }

        if (userContext && userContext.id) {
          await removeCartItem(userContext.id, pId, '');
        }

        if (cartActionsCollector) {
          cartActionsCollector.push({
            action: 'remove',
            productId: pId,
            variantId: ''
          });
        }

        return {
          success: true,
          message: 'Item has been removed from your shopping cart.'
        };
      }

      case 'get_categories': {
        const categories = await getAllCategories();
        return {
          categories: categories.map(c => ({
            id: c.id,
            name: c.name,
            subtitle: c.subtitle,
            productCount: c.productCount || 0
          }))
        };
      }

      case 'get_user_orders': {
        if (!userContext || !userContext.id) {
          return {
            error: 'User is not authenticated. Please ask the customer to log in to view their orders.'
          };
        }

        const orders = await getOrders(userContext.id, false);
        return {
          customerName: userContext.name,
          customerEmail: userContext.email,
          totalOrders: orders.length,
          orders: orders.map(o => ({
            id: o.id,
            orderReference: o.orderReference,
            createdAt: o.createdAt,
            status: o.status,
            totalAmount: o.totalAmount,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            items: (o.items || []).map(item => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              selectedColor: item.selectedColor || ''
            }))
          }))
        };
      }

      case 'get_order_details': {
        if (!userContext || !userContext.id) {
          return {
            error: 'User is not authenticated. Please ask the customer to log in to view order details.'
          };
        }

        const { orderReferenceOrId } = safeArgs;
        if (!orderReferenceOrId) {
          return { error: 'Order reference or ID is required.' };
        }

        const rows = await query(
          'SELECT * FROM orders WHERE (id = ? OR orderReference = ?) AND userId = ?',
          [orderReferenceOrId, orderReferenceOrId, userContext.id]
        );

        if (rows.length === 0) {
          return {
            error: `No order found with reference "${orderReferenceOrId}" associated with your account.`
          };
        }

        const order = rows[0];
        const items = await query('SELECT * FROM order_items WHERE orderId = ?', [order.id]);

        return {
          id: order.id,
          orderReference: order.orderReference,
          status: order.status,
          totalAmount: parseFloat(order.totalAmount),
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          address: order.address,
          name: order.name,
          email: order.email,
          createdAt: order.createdAt,
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity),
            selectedColor: item.selectedColor || ''
          }))
        };
      }

      case 'get_store_policies': {
        return {
          shipping: {
            standard: '3-5 business days ($5.00, FREE on orders over $100)',
            express: '1-2 business days ($15.00)',
            tracking: 'Tracking number provided via email upon shipment.'
          },
          returnsAndExchanges: {
            policy: '30-day hassle-free returns and size exchanges on all unworn items with original tags.',
            refundTime: 'Refunds are processed within 3-5 business days after inspection.'
          },
          paymentMethods: ['Credit/Debit Cards (Visa, Mastercard, AMEX)', 'Google Pay', 'Mock Card (Development)'],
          customerSupport: {
            email: 'support@trendvibe.com',
            hours: 'Monday - Friday: 9 AM - 8 PM EST, Saturday - Sunday: 10 AM - 6 PM EST'
          }
        };
      }

      default:
        return { error: `Unknown tool function: ${name}` };
    }
  } catch (err) {
    console.error(`Error executing tool ${name}:`, err);
    return { error: `Failed to execute ${name}: ${err.message}` };
  }
}

/**
 * Extract mentioned product IDs / objects from tool execution results.
 */
function extractProductsFromToolResults(toolResults) {
  const productsMap = new Map();

  for (const res of toolResults) {
    if (res.products && Array.isArray(res.products)) {
      for (const p of res.products) {
        if (p.id && !productsMap.has(p.id)) {
          productsMap.set(p.id, {
            id: p.id,
            name: p.name,
            price: p.price,
            discountPercent: p.discountPercent,
            discountedPrice: p.discountedPrice,
            image: p.image,
            category: p.category,
            rating: p.rating,
            stock: p.stock
          });
        }
      }
    } else if (res.id && res.name && res.price !== undefined) {
      if (!productsMap.has(res.id)) {
        productsMap.set(res.id, {
          id: res.id,
          name: res.name,
          price: res.price,
          discountPercent: res.discountPercent,
          discountedPrice: res.discountedPrice,
          image: res.image,
          category: res.category,
          rating: res.rating,
          stock: res.stock
        });
      }
    } else if (res.addedItem && res.addedItem.id) {
      const item = res.addedItem;
      if (!productsMap.has(item.id)) {
        productsMap.set(item.id, {
          id: item.id,
          name: item.name,
          price: item.price,
          discountPercent: item.discountPercent,
          discountedPrice: item.discountedPrice,
          image: item.image,
          rating: 4.8,
          stock: 99
        });
      }
    }
  }

  return Array.from(productsMap.values()).slice(0, 4);
}

/**
 * Extract clean textual response from model response object.
 */
function extractTextFromResponse(response) {
  if (response.text && typeof response.text === 'string' && response.text.trim()) {
    return response.text.trim();
  }

  if (response.candidates && response.candidates[0] && response.candidates[0].content) {
    const parts = response.candidates[0].content.parts || [];
    const textParts = parts.filter(p => p.text && !p.thought).map(p => p.text);
    if (textParts.length > 0) {
      return textParts.join('\n').trim();
    }
  }

  return '';
}

/**
 * Process a chat message with Google Gemini and multi-turn tool calling.
 * Supports model fallbacks in case of transient quota/rate limits.
 */
export async function processChatMessage({ message, history = [], user = null, pageContext = null }) {
  const ai = getGeminiClient();

  // Model fallback candidate list (prioritizing fast low-latency models)
  const availableModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-2.5-flash'
  ];

  // Construct initial contents array from history
  const baseContents = [];

  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
  for (const turn of recentHistory) {
    if (turn.role === 'user' && turn.text) {
      baseContents.push({
        role: 'user',
        parts: [{ text: turn.text }]
      });
    } else if (turn.role === 'model' && turn.text) {
      baseContents.push({
        role: 'model',
        parts: [{ text: turn.text }]
      });
    }
  }

  // Inject authentication context into prompt
  const userContextNote = user
    ? `[System Context: Customer is logged in as "${user.name}" (Email: "${user.email}", UserID: "${user.id}")]\n`
    : `[System Context: Customer is currently browsing as an unauthenticated guest]\n`;

  // Process background page context
  let pageContextNote = '';
  if (pageContext && pageContext.isProductPage && pageContext.productId) {
    let viewedProduct = null;
    try {
      viewedProduct = await getProductById(pageContext.productId);
    } catch (e) {
      console.warn('Failed to fetch background product for context:', e.message);
    }

    if (viewedProduct) {
      const selectedSize = pageContext.productDetails?.selectedSize || '';
      const selectedVariantId = pageContext.productDetails?.selectedVariantId || '';
      const priceContext = viewedProduct.discountedPrice < viewedProduct.price
        ? `Current Price: $${viewedProduct.discountedPrice} (Original Price: $${viewedProduct.price}, ${viewedProduct.discountPercent}% off)`
        : `Price: $${viewedProduct.price}`;
      pageContextNote = `[System Context: Customer is currently viewing Product Detail page for "${viewedProduct.name}" (ID: "${viewedProduct.id}", ${priceContext}, Category: "${viewedProduct.category}", Stock: ${viewedProduct.stock}${selectedSize ? `, User Selected Size/Color on page: "${selectedSize}"` : ''}${selectedVariantId ? `, Variant ID: "${selectedVariantId}"` : ''}). If user says "add this to cart", "add this one", "buy this", "add to cart", or asks about "this product", they mean "${viewedProduct.name}" (ID: "${viewedProduct.id}").]\n`;
    } else {
      pageContextNote = `[System Context: Customer is currently on Product page with ID "${pageContext.productId}"].\n`;
    }
  } else if (pageContext && pageContext.pathname) {
    pageContextNote = `[System Context: Customer is currently browsing on page "${pageContext.pathname}"].\n`;
  }

  baseContents.push({
    role: 'user',
    parts: [{ text: `${userContextNote}${pageContextNote}${message}` }]
  });

  let lastError = null;

  for (const modelName of availableModels) {
    try {
      const contents = JSON.parse(JSON.stringify(baseContents));
      const toolExecutionResults = [];
      const cartActions = [];
      let iterations = 0;
      let finalReply = '';

      while (iterations < 4) {
        iterations++;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: chatTools,
            temperature: 0.7,
            thinkingConfig: { thinkingBudget: 0 }
          }
        });

        const functionCalls = response.functionCalls;

        if (!functionCalls || functionCalls.length === 0) {
          finalReply = extractTextFromResponse(response);
          if (!finalReply) {
            finalReply = "I'm delighted to assist you with TrendVibe's collection! What kind of style or outfit are you looking for today?";
          }
          break;
        }

        // Add candidate to contents history
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
          contents.push(response.candidates[0].content);
        }

        // Execute function calls
        for (const call of functionCalls) {
          const result = await executeToolCall(call, user, cartActions);
          toolExecutionResults.push(result);

          contents.push({
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: call.name,
                  response: result
                }
              }
            ]
          });
        }
      }

      const productsMentioned = extractProductsFromToolResults(toolExecutionResults);

      return {
        reply: finalReply,
        productsMentioned,
        cartActions
      };
    } catch (err) {
      console.warn(`Attempt with model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  // If all models encountered an issue, throw last error to let route handle fallback
  throw lastError || new Error('All Gemini model candidates failed.');
}
