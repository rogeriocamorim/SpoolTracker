package com.spooltracker.constants;

/**
 * Application-wide constants.
 * Centralizes magic numbers and configuration values used throughout the application.
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class - prevent instantiation
    }

    // Pagination defaults
    public static final int DEFAULT_PAGE_SIZE = 50;
    public static final int DEFAULT_PAGE = 0;
    public static final int MAX_PAGE_SIZE = 1000;

    // Settings defaults
    public static final int DEFAULT_WEIGHT_GRAMS = 1000;
    public static final String DEFAULT_CURRENCY = "USD";
    public static final int DEFAULT_LOW_STOCK_THRESHOLD = 20;
    public static final int MIN_WEIGHT_GRAMS = 1;
    public static final int MAX_WEIGHT_GRAMS = 10000;
    public static final int MIN_LOW_STOCK_THRESHOLD = 0;
    public static final int MAX_LOW_STOCK_THRESHOLD = 100;

    // String length limits
    public static final int MAX_UID_LENGTH = 100;
    public static final int MAX_STRING_LENGTH = 500;
    public static final int MAX_COLOR_NUMBER_LENGTH = 50;
    public static final int MAX_NOTES_LENGTH = 1000;
    public static final int MAX_LOCATION_DETAILS_LENGTH = 200;

    // Weight validation
    public static final double MAX_WEIGHT_KG = 100.0; // 100kg max
    public static final double MIN_WEIGHT = 0.0;

    // Currency code length
    public static final int CURRENCY_CODE_LENGTH = 3;

    // CSV import limits
    public static final int MAX_CSV_ROWS = 10000;
}

