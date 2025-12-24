package com.spooltracker.dto;

/**
 * DTO representing filament usage extracted from a 3MF file
 */
public record FilamentUsageDTO(
    int id,
    String type,           // e.g., "PLA", "PETG"
    String colorHex,       // e.g., "#FF6A13"
    double usedMeters,     // meters of filament used
    double usedGrams,      // grams of filament used
    String nozzleDiameter  // e.g., "0.40"
) {}

