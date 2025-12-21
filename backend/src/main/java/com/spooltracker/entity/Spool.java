package com.spooltracker.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "spool")
public class Spool extends PanacheEntity {

    @Column(nullable = false, unique = true, updatable = false)
    public String uid;

    // Spool physical type (Plastic, Refill, Cardboard)
    @Enumerated(EnumType.STRING)
    @Column(name = "spool_type")
    public SpoolType spoolType = SpoolType.PLASTIC;

    @NotNull(message = "Filament type is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "filament_type_id", nullable = false)
    public FilamentType filamentType;

    @NotNull(message = "Color is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "color_id", nullable = false)
    public FilamentColor color;

    @NotNull(message = "Manufacturer is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manufacturer_id", nullable = false)
    public Manufacturer manufacturer;

    // Legacy location enum (kept for backward compatibility during migration)
    @Enumerated(EnumType.STRING)
    @Column(name = "location")
    public SpoolLocation legacyLocation;

    // New location reference
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "storage_location_id")
    public Location storageLocation;

    // Location details (e.g., "AMS Slot 1", "Rack A-3", "Printer 1")
    public String locationDetails;

    // Helper method to get location name (works with both old and new system)
    public String getLocationName() {
        if (storageLocation != null) {
            return storageLocation.name;
        }
        return legacyLocation != null ? legacyLocation.getDisplayName() : null;
    }

    // Helper method to get location type
    public String getLocationType() {
        if (storageLocation != null) {
            return storageLocation.locationType;
        }
        return legacyLocation != null ? legacyLocation.name() : null;
    }

    // Weight tracking
    @Positive(message = "Initial weight must be positive")
    public Double initialWeightGrams;

    @Positive(message = "Current weight must be positive")
    public Double currentWeightGrams;

    // Spool metadata
    public LocalDate purchaseDate;
    public LocalDate openedDate;
    public LocalDate lastUsedDate;

    // Price tracking
    public Double purchasePrice;
    public String purchaseCurrency;

    // Notes
    @Column(length = 1000)
    public String notes;

    // Custom color number for customer ordering (e.g., "5" for "item number 5")
    @Column(name = "color_number")
    public String colorNumber;

    // Timestamps
    @Column(nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Column(nullable = false)
    public LocalDateTime updatedAt;

    // Whether this spool is empty/finished
    public Boolean isEmpty = false;

    @PrePersist
    public void prePersist() {
        if (uid == null) {
            uid = UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public static Spool findByUid(String uid) {
        return find("uid", uid).firstResult();
    }

    public static List<Spool> findByLegacyLocation(SpoolLocation location) {
        return list("legacyLocation", location);
    }

    public static List<Spool> findByStorageLocation(Long locationId) {
        return list("storageLocation.id", locationId);
    }

    public static List<Spool> findByFilamentType(Long filamentTypeId) {
        return list("filamentType.id", filamentTypeId);
    }

    public static List<Spool> findByManufacturer(Long manufacturerId) {
        return list("manufacturer.id", manufacturerId);
    }

    public static List<Spool> findByColor(Long colorId) {
        return list("color.id", colorId);
    }

    public static List<Spool> findActive() {
        return list("isEmpty", false);
    }

    public static List<Spool> findEmpty() {
        return list("isEmpty", true);
    }

    public static List<Spool> findByColorNumber(String colorNumber) {
        return list("colorNumber", colorNumber);
    }

    public Double getRemainingPercentage() {
        if (initialWeightGrams == null || initialWeightGrams == 0 || currentWeightGrams == null) {
            return null;
        }
        return (currentWeightGrams / initialWeightGrams) * 100;
    }
}

