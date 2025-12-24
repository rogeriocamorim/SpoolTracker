package com.spooltracker.dto;

import java.util.List;

/**
 * DTO representing a filament usage matched to potential spools
 */
public record FilamentMatchDTO(
    FilamentUsageDTO usage,
    List<SpoolMatchDTO> matchingSpools,
    Long selectedSpoolId  // User-selected spool ID (null initially)
) {
    
    /**
     * Represents a spool that matches the filament usage criteria
     */
    public record SpoolMatchDTO(
        Long id,
        String uid,
        String manufacturerName,
        String filamentTypeName,
        String materialName,
        String colorName,
        String colorHexCode,
        Double currentWeightGrams,
        Double remainingPercentage,
        String storageLocationName,
        int matchScore  // Higher = better match (100 = exact color match)
    ) {}
}

