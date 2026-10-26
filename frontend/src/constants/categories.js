/**
 * TrendVibe Category & Subcategory Definitions
 */

export const CATEGORY_DEFINITIONS = [
  {
    name: 'Men',
    subtitle: 'T-Shirts, Shirts, Jeans, Hoodies & Shoes',
    subcategories: ['T-Shirts', 'Shirts', 'Jeans', 'Hoodies', 'Shoes']
  },
  {
    name: 'Women',
    subtitle: 'Dresses, Tops, Jeans, Abayas & Shoes',
    subcategories: ['Dresses', 'Tops', 'Jeans', 'Abayas', 'Shoes']
  },
  {
    name: 'Kids',
    subtitle: 'T-Shirts, Dresses, Jeans, Hoodies & Shoes',
    subcategories: ['T-Shirts', 'Dresses', 'Jeans', 'Hoodies', 'Shoes']
  },
  {
    name: 'Watches',
    subtitle: "Men's, Women's, Smart & Sports Watches",
    subcategories: ["Men's Watches", "Women's Watches", 'Smart Watches', 'Sports Watches', 'Casual Watches']
  }
];

export const CATEGORY_SUBCATEGORIES_MAP = {
  Men: ['T-Shirts', 'Shirts', 'Jeans', 'Hoodies', 'Shoes'],
  Women: ['Dresses', 'Tops', 'Jeans', 'Abayas', 'Shoes'],
  Kids: ['T-Shirts', 'Dresses', 'Jeans', 'Hoodies', 'Shoes'],
  Watches: ["Men's Watches", "Women's Watches", 'Smart Watches', 'Sports Watches', 'Casual Watches']
};

/**
 * Returns all subcategories for a given category name (case-insensitive)
 */
export function getSubcategoriesForCategory(categoryName) {
  if (!categoryName) return [];
  const normalized = categoryName.trim();
  for (const [cat, subcats] of Object.entries(CATEGORY_SUBCATEGORIES_MAP)) {
    if (cat.toLowerCase() === normalized.toLowerCase()) {
      return subcats;
    }
  }
  if (normalized.toLowerCase().includes('watch')) {
    return CATEGORY_SUBCATEGORIES_MAP['Watches'];
  }
  return [];
}

/**
 * Returns all unique subcategories across all defined categories
 */
export function getAllDefinedSubcategories() {
  const all = new Set();
  Object.values(CATEGORY_SUBCATEGORIES_MAP).forEach(list => {
    list.forEach(sub => all.add(sub));
  });
  return Array.from(all);
}
