package com.spooltracker.util;

import java.util.regex.Pattern;

/**
 * Utility class for sanitizing user input to prevent XSS attacks and ensure data integrity.
 */
public class Sanitizer {

    // Pattern to match potentially dangerous HTML/script tags
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern SCRIPT_PATTERN = Pattern.compile("(?i)<script[^>]*>.*?</script>", Pattern.DOTALL);
    private static final Pattern JAVASCRIPT_PATTERN = Pattern.compile("(?i)javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern ON_EVENT_PATTERN = Pattern.compile("(?i)on\\w+\\s*=", Pattern.CASE_INSENSITIVE);

    /**
     * Sanitizes a string by removing HTML tags and dangerous patterns.
     * This is a basic sanitization - for production, consider using a library like OWASP Java HTML Sanitizer.
     * 
     * @param input The input string to sanitize
     * @return Sanitized string, or null if input is null
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        
        String sanitized = input.trim();
        
        // Remove script tags
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove javascript: protocol
        sanitized = JAVASCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove event handlers (onclick, onerror, etc.)
        sanitized = ON_EVENT_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove HTML tags (basic - for production use a proper HTML sanitizer)
        sanitized = HTML_TAG_PATTERN.matcher(sanitized).replaceAll("");
        
        return sanitized.trim();
    }

    /**
     * Sanitizes a string but allows basic formatting (preserves line breaks).
     * Use this for fields like notes or descriptions where users might want formatting.
     * 
     * @param input The input string to sanitize
     * @return Sanitized string with line breaks preserved, or null if input is null
     */
    public static String sanitizeWithLineBreaks(String input) {
        if (input == null) {
            return null;
        }
        
        String sanitized = sanitize(input);
        
        // Preserve line breaks by converting them to spaces (or keep them if you want)
        // For now, we'll keep them as they are after basic sanitization
        return sanitized;
    }

    /**
     * Escapes HTML special characters for safe display.
     * Use this when displaying user content in HTML.
     * 
     * @param input The input string to escape
     * @return HTML-escaped string, or null if input is null
     */
    public static String escapeHtml(String input) {
        if (input == null) {
            return null;
        }
        
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#039;");
    }

    /**
     * Validates and sanitizes a URL.
     * 
     * @param url The URL to validate and sanitize
     * @return Sanitized URL, or null if invalid
     */
    public static String sanitizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        
        String sanitized = url.trim();
        
        // Only allow http and https protocols
        if (!sanitized.startsWith("http://") && !sanitized.startsWith("https://")) {
            return null;
        }
        
        // Remove dangerous patterns
        sanitized = JAVASCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = ON_EVENT_PATTERN.matcher(sanitized).replaceAll("");
        
        return sanitized;
    }
}

