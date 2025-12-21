package com.spooltracker.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.spooltracker.entity.Spool;
import com.spooltracker.entity.SpoolLocation;
import com.spooltracker.entity.SpoolType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SpoolDTO(
    Long id,
    String uid,
    @NotNull(message = "Filament type ID is required")
    Long filamentTypeId,
    String filamentTypeName,
    String materialName,
    @NotNull(message = "Color ID is required")
    Long colorId,
    String colorName,
    String colorHexCode,
    String colorProductCode,
    @NotNull(message = "Manufacturer ID is required")
    Long manufacturerId,
    String manufacturerName,
    String manufacturerLogoUrl,
    // Legacy location (enum)
    SpoolLocation location,
    String locationDetails,
    // New location system
    Long storageLocationId,
    String storageLocationName,
    String storageLocationType,
    String storageLocationFullPath,
    SpoolType spoolType,
    @Positive(message = "Initial weight must be positive")
    Double initialWeightGrams,
    @Positive(message = "Current weight must be positive")
    Double currentWeightGrams,
    Double remainingPercentage,
    LocalDate purchaseDate,
    LocalDate openedDate,
    LocalDate lastUsedDate,
    Double purchasePrice,
    String purchaseCurrency,
    String notes,
    String colorNumber,
    Boolean isEmpty,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    // Technical details from FilamentType
    Double diameterMm,
    Double densityGPerCm3,
    Integer minNozzleTemp,
    Integer maxNozzleTemp,
    Integer minBedTemp,
    Integer maxBedTemp
) {
    public static SpoolDTO from(Spool entity) {
        return new SpoolDTO(
            entity.id,
            entity.uid,
            entity.filamentType.id,
            entity.filamentType.name,
            entity.filamentType.material.name,
            entity.color.id,
            entity.color.name,
            entity.color.hexCode,
            entity.color.productCode,
            entity.manufacturer.id,
            entity.manufacturer.name,
            entity.manufacturer.logoUrl,
            entity.legacyLocation,
            entity.locationDetails,
            entity.storageLocation != null ? entity.storageLocation.id : null,
            entity.storageLocation != null ? entity.storageLocation.name : null,
            entity.storageLocation != null ? entity.storageLocation.locationType : null,
            entity.storageLocation != null ? entity.storageLocation.getFullPath() : null,
            entity.spoolType,
            entity.initialWeightGrams,
            entity.currentWeightGrams,
            entity.getRemainingPercentage(),
            entity.purchaseDate,
            entity.openedDate,
            entity.lastUsedDate,
            entity.purchasePrice,
            entity.purchaseCurrency,
            entity.notes,
            entity.colorNumber,
            entity.isEmpty,
            entity.createdAt,
            entity.updatedAt,
            entity.filamentType.diameterMm,
            entity.filamentType.densityGPerCm3,
            entity.filamentType.minNozzleTemp,
            entity.filamentType.maxNozzleTemp,
            entity.filamentType.minBedTemp,
            entity.filamentType.maxBedTemp
        );
    }
}

