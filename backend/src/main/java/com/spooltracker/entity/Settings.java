package com.spooltracker.entity;

import java.time.LocalDateTime;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Application settings entity.
 * Since this is a single-user application, we use a singleton pattern
 * where there's only one settings record in the database.
 * The getInstance() method ensures only one record exists.
 */
@Entity
@Table(
    name = "settings",
    uniqueConstraints = {
        @jakarta.persistence.UniqueConstraint(columnNames = "id")
    }
)
public class Settings extends PanacheEntity {

    // Default values for new spools
    @Column(name = "default_weight_grams")
    public Integer defaultWeightGrams = 1000;

    @Column(name = "default_currency", length = 10)
    public String defaultCurrency = "USD";

    // Alert thresholds
    @Column(name = "low_stock_threshold")
    public Integer lowStockThreshold = 20;

    // Timestamps
    @Column(nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Column(nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Get or create the singleton settings instance.
     * Since this is a single-user app, we get the first (and only) record,
     * or create one if none exists.
     * Uses synchronized block to prevent race conditions when creating the initial record.
     */
    private static final Object LOCK = new Object();
    
    public static Settings getInstance() {
        Settings settings = findAll().firstResult();
        if (settings == null) {
            synchronized (LOCK) {
                // Double-check pattern to avoid creating duplicates
                settings = findAll().firstResult();
                if (settings == null) {
                    settings = new Settings();
                    settings.persistAndFlush();
                }
            }
        }
        return settings;
    }
}

