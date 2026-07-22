// Single source of truth for the product catalogue taxonomy.
// Keeping this controlled prevents the "auto-created" duplicate/duplicated
// categories (e.g. a stray "food care food") that appear when subCategory is free text.

export const PET_TYPES = ['cat', 'dog', 'bird', 'fish'];

export const PRODUCT_CATEGORIES = ['food', 'medicine', 'toys', 'supplements', 'accessories', 'treats', 'grooming', 'litter'];

// Consultations are intentionally scoped to the animals commonly raised in
// Bangladesh. Product categories remain independent from this list.
export const CONSULTATION_PET_TYPES = ['cow', 'goat', 'duck', 'chicken'];
export const CONSULTATION_STATUSES = ['pending', 'active', 'completed', 'cancelled'];
export const CHAT_SENDERS = ['user', 'support', 'doctor'];

export const isPetType = (value) => PET_TYPES.includes(value);
export const isProductCategory = (value) => PRODUCT_CATEGORIES.includes(value);
