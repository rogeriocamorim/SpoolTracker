package com.spooltracker.service;

import com.spooltracker.dto.SettingsDTO;
import com.spooltracker.entity.Settings;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

/**
 * Service for managing application settings with caching.
 * Uses application-scoped singleton to cache settings and avoid repeated database queries.
 */
@ApplicationScoped
public class SettingsService {

    private static final Logger LOG = Logger.getLogger(SettingsService.class);

    /**
     * Get settings from database.
     * Note: This method should be called within a transaction context
     * if Settings.getInstance() might need to create a new record.
     */
    public Settings getSettings() {
        // Always get fresh instance to ensure it's managed in current transaction
        return Settings.getInstance();
    }

    /**
     * Get settings as DTO.
     */
    public SettingsDTO getSettingsDTO() {
        Settings settings = getSettings();
        return new SettingsDTO(
            settings.defaultWeightGrams,
            settings.defaultCurrency,
            settings.lowStockThreshold
        );
    }

    /**
     * Update settings and invalidate cache.
     * Note: This method should be called within a transaction context.
     */
    public SettingsDTO updateSettings(SettingsDTO dto) {
        // Get fresh instance to ensure it's managed in current transaction
        Settings settings = Settings.getInstance();
        
        if (dto.defaultWeightGrams != null) {
            settings.defaultWeightGrams = dto.defaultWeightGrams;
        }
        if (dto.defaultCurrency != null) {
            settings.defaultCurrency = dto.defaultCurrency;
        }
        if (dto.lowStockThreshold != null) {
            settings.lowStockThreshold = dto.lowStockThreshold;
        }
        
        // Entity is already managed, changes will be persisted when transaction commits
        LOG.debug("Settings updated");
        
        return new SettingsDTO(
            settings.defaultWeightGrams,
            settings.defaultCurrency,
            settings.lowStockThreshold
        );
    }

}

