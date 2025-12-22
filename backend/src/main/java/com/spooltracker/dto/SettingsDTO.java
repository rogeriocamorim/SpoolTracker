package com.spooltracker.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SettingsDTO {
    @Min(value = 1, message = "Default weight must be at least 1 gram")
    @Max(value = 10000, message = "Default weight must not exceed 10000 grams")
    public Integer defaultWeightGrams;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter ISO 4217 code (e.g., USD, EUR, BRL)")
    @Size(min = 3, max = 3, message = "Currency code must be exactly 3 characters")
    public String defaultCurrency;

    @Min(value = 0, message = "Low stock threshold must be at least 0%")
    @Max(value = 100, message = "Low stock threshold must not exceed 100%")
    public Integer lowStockThreshold;

    public SettingsDTO() {
    }

    public SettingsDTO(Integer defaultWeightGrams, String defaultCurrency, Integer lowStockThreshold) {
        this.defaultWeightGrams = defaultWeightGrams;
        this.defaultCurrency = defaultCurrency;
        this.lowStockThreshold = lowStockThreshold;
    }
}

