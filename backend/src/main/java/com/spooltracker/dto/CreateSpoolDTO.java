package com.spooltracker.dto;

import java.time.LocalDate;

import com.spooltracker.entity.SpoolLocation;
import com.spooltracker.entity.SpoolType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

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
    @Size(max = 500, message = "Location details must be less than 500 characters")
    String locationDetails,
    // Spool physical type (Plastic, Refill, Cardboard)
    SpoolType spoolType,
    @Positive(message = "Initial weight must be positive")
    Double initialWeightGrams,
    @Positive(message = "Current weight must be positive")
    Double currentWeightGrams,
    LocalDate purchaseDate,
    LocalDate openedDate,
    Double purchasePrice,
    @Size(max = 10, message = "Currency code must be less than 10 characters")
    String purchaseCurrency,
    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    String notes,
    @Size(max = 50, message = "Color number must be less than 50 characters")
    String colorNumber
) {}

