package com.spooltracker.dto;

import java.time.LocalDate;

import com.spooltracker.entity.SpoolLocation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateSpoolDTO(
    @NotNull(message = "Filament type ID is required")
    Long filamentTypeId,
    @NotNull(message = "Color ID is required")
    Long colorId,
    @NotNull(message = "Manufacturer ID is required")
    Long manufacturerId,
    // Legacy location (enum) - optional if storageLocationId is provided
    SpoolLocation location,
    // New location system - preferred
    Long storageLocationId,
    String locationDetails,
    @Positive(message = "Initial weight must be positive")
    Double initialWeightGrams,
    @Positive(message = "Current weight must be positive")
    Double currentWeightGrams,
    LocalDate purchaseDate,
    LocalDate openedDate,
    Double purchasePrice,
    String purchaseCurrency,
    String notes,
    String colorNumber
) {}

