package com.spooltracker.dto;

public class SettingsDTO {
    public Integer defaultWeightGrams;
    public String defaultCurrency;
    public Integer lowStockThreshold;

    public SettingsDTO() {
    }

    public SettingsDTO(Integer defaultWeightGrams, String defaultCurrency, Integer lowStockThreshold) {
        this.defaultWeightGrams = defaultWeightGrams;
        this.defaultCurrency = defaultCurrency;
        this.lowStockThreshold = lowStockThreshold;
    }
}

