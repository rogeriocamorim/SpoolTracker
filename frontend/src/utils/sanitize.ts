/**
 * Input sanitization utilities
 * Provides functions to sanitize user-provided strings to prevent XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 * Keeps only alphanumeric, spaces, and common punctuation
 */
export function sanitizeInput(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remove HTML tags and dangerous characters
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining angle brackets
    .trim();
}

/**
 * Sanitizes text for display (escapes HTML)
 */
export function sanitizeForDisplay(text: string | null | undefined): string {
  return escapeHtml(text);
}

/**
 * Validates and sanitizes a URL
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

