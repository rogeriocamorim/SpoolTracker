/**
 * Application-wide constants.
 * Centralizes magic numbers and configuration values used throughout the frontend.
 */

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_PAGE = 0;
export const MAX_PAGE_SIZE = 1000;

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAY = 300;
export const SEARCH_DEBOUNCE_DELAY = 500;

// Weight thresholds
export const LOW_STOCK_THRESHOLD = 20; // percentage
export const DEFAULT_WEIGHT_GRAMS = 1000;
export const MIN_WEIGHT_GRAMS = 1;
export const MAX_WEIGHT_GRAMS = 10000;

// Currency
export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_CODE_LENGTH = 3;

// String length limits
export const MAX_UID_LENGTH = 100;
export const MAX_STRING_LENGTH = 500;
export const MAX_COLOR_NUMBER_LENGTH = 50;
export const MAX_NOTES_LENGTH = 1000;
export const MAX_LOCATION_DETAILS_LENGTH = 200;

// Retry configuration
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 1000;

// Chart configuration
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

// Animation durations (in milliseconds)
export const ANIMATION_DURATION_FAST = 150;
export const ANIMATION_DURATION_NORMAL = 300;
export const ANIMATION_DURATION_SLOW = 500;

// Modal configuration
export const MODAL_BACKDROP_OPACITY = 0.5;
export const MODAL_Z_INDEX = 1000;

// Toast configuration
export const TOAST_DURATION = 3000; // 3 seconds
export const TOAST_DURATION_LONG = 5000; // 5 seconds

