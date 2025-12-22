package com.spooltracker.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

/**
 * Location entity - represents a physical location where spools can be stored.
 * Examples: AMS Slot 1, Rack A-3, Storage Box 1, Printer 1, etc.
 */
@Entity
@Table(
    name = "location",
    indexes = {
        @Index(name = "idx_location_parent", columnList = "parent_id"),
        @Index(name = "idx_location_type", columnList = "location_type"),
        @Index(name = "idx_location_name", columnList = "name")
    }
)
public class Location extends PanacheEntity {

    @NotBlank(message = "Location name is required")
    @Column(nullable = false)
    public String name;

    @Column(length = 500)
    public String description;

    // Location type (e.g., AMS, PRINTER, RACK, STORAGE, etc.)
    @Column(name = "location_type")
    public String locationType;

    // Parent location for hierarchical organization (e.g., "Rack A" contains "Slot 1", "Slot 2")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    public Location parent;

    // Child locations
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    public List<Location> children = new ArrayList<>();

    // Spools at this location
    @OneToMany(mappedBy = "storageLocation")
    public List<Spool> spools = new ArrayList<>();

    // Maximum capacity (number of spools this location can hold, null = unlimited)
    public Integer capacity;

    // Icon or color for visual identification
    public String icon;
    public String color;

    // Sort order for display
    @Column(name = "sort_order")
    public Integer sortOrder = 0;

    // Whether this location is active/visible
    @Column(name = "is_active")
    public Boolean isActive = true;

    // Finder methods
    public static List<Location> findByType(String locationType) {
        return list("locationType", locationType);
    }

    public static List<Location> findRootLocations() {
        return list("parent is null and isActive = true order by sortOrder, name");
    }

    public static List<Location> findActive() {
        return list("isActive = true order by sortOrder, name");
    }

    public static Location findByName(String name) {
        return find("name", name).firstResult();
    }

    // Get the full path name (e.g., "Rack A > Slot 1")
    public String getFullPath() {
        if (parent == null) {
            return name;
        }
        return parent.getFullPath() + " > " + name;
    }

    // Get the count of spools at this location
    public long getSpoolCount() {
        return Spool.count("storageLocation.id", this.id);
    }

    // Check if location has available capacity
    public boolean hasCapacity() {
        if (capacity == null) {
            return true; // Unlimited
        }
        return getSpoolCount() < capacity;
    }
}

