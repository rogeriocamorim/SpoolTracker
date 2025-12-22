package com.spooltracker.constants;

/**
 * Standardized error messages used throughout the application.
 * Centralizes error message strings for consistency and easier maintenance.
 */
public final class ErrorMessages {

    private ErrorMessages() {
        // Utility class - prevent instantiation
    }

    // Generic messages
    public static final String RESOURCE_NOT_FOUND = "%s not found";
    public static final String RESOURCE_ALREADY_EXISTS = "%s with this name already exists";
    public static final String INVALID_INPUT = "Invalid input provided";
    public static final String OPERATION_FAILED = "Operation failed";
    public static final String VALIDATION_FAILED = "Validation failed";

    // Spool messages
    public static final String SPOOL_NOT_FOUND = "Spool not found";
    public static final String SPOOL_ALREADY_EXISTS = "Spool with this UID already exists";
    public static final String INVALID_SPOOL_WEIGHT = "Invalid spool weight";

    // Location messages
    public static final String LOCATION_NOT_FOUND = "Location not found";
    public static final String LOCATION_ALREADY_EXISTS = "Location with this name already exists";
    public static final String LOCATION_HAS_CHILDREN = "Cannot delete location with child locations";
    public static final String LOCATION_HAS_SPOOLS = "Cannot delete location that contains spools";

    // Material messages
    public static final String MATERIAL_NOT_FOUND = "Material not found";
    public static final String MATERIAL_ALREADY_EXISTS = "Material with this name already exists";

    // Manufacturer messages
    public static final String MANUFACTURER_NOT_FOUND = "Manufacturer not found";
    public static final String MANUFACTURER_ALREADY_EXISTS = "Manufacturer with this name already exists";

    // Filament Type messages
    public static final String FILAMENT_TYPE_NOT_FOUND = "Filament type not found";
    public static final String FILAMENT_TYPE_ALREADY_EXISTS = "Filament type with this name already exists";
    public static final String COLOR_NOT_FOUND = "Color not found";
    public static final String COLOR_ALREADY_EXISTS = "Color with this name already exists";

    // CSV Import/Export messages
    public static final String CSV_PARSE_ERROR = "Failed to parse CSV: %s";
    public static final String CSV_IMPORT_ERROR = "Failed to import CSV data";
    public static final String CSV_EXPORT_ERROR = "Failed to export CSV data";
    public static final String INVALID_CSV_FORMAT = "Invalid CSV format";

    // Settings messages
    public static final String SETTINGS_NOT_FOUND = "Settings not found";
    public static final String INVALID_SETTINGS = "Invalid settings provided";

    // Validation messages
    public static final String REQUIRED_FIELD = "%s is required";
    public static final String INVALID_FORMAT = "Invalid format for %s";
    public static final String VALUE_OUT_OF_RANGE = "%s value is out of valid range";
    public static final String STRING_TOO_LONG = "%s exceeds maximum length of %d characters";
}

