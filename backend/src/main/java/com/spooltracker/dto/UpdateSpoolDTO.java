package com.spooltracker.dto;

import java.time.LocalDate;

import com.spooltracker.entity.SpoolLocation;

import jakarta.validation.constraints.Positive;

public record UpdateSpoolDTO(
    Long filamentTypeId,
    Long colorId,
    Long manufacturerId,
    // Legacy location (enum)
    SpoolLocation location,
    // New location system
    Long storageLocationId,
    String locationDetails,
    @Positive(message = "Initial weight must be positive")
    Double initialWeightGrams,
    @Positive(message = "Current weight must be positive")
    Double currentWeightGrams,
    LocalDate purchaseDate,
    LocalDate openedDate,
    LocalDate lastUsedDate,
    Double purchasePrice,
    String purchaseCurrency,
    String notes,
    Boolean isEmpty,
    String colorNumber
) {}

