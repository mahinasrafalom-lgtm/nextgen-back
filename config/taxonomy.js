// Single source of truth for the product catalogue taxonomy.
// Keeping this controlled prevents the "auto-created" duplicate/duplicated
// categories (e.g. a stray "food care food") that appear when subCategory is free text.

export const PET_TYPES = ['cat', 'dog', 'bird', 'fish'];

export const PRODUCT_CATEGORIES = ['food', 'treats', 'toys', 'medicine', 'grooming', 'accessories', 'litter'];

export const CONSULTATION_PET_TYPES = ['cat', 'dog', 'bird', 'fish'];
export const CONSULTATION_STATUSES = ['pending', 'active', 'completed', 'cancelled'];
export const CHAT_SENDERS = ['user', 'support', 'doctor'];

export const isPetType = (value) => PET_TYPES.includes(value);
export const isProductCategory = (value) => PRODUCT_CATEGORIES.includes(value);
