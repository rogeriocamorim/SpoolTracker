package com.spooltracker.dto;

import com.spooltracker.entity.Location;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LocationDTO(
    Long id,
    @NotBlank(message = "Location name is required")
    @Size(max = 100, message = "Location name must be less than 100 characters")
    String name,
    @Size(max = 500, message = "Description must be less than 500 characters")
    String description,
    @Size(max = 50, message = "Location type must be less than 50 characters")
    String locationType,
    Integer capacity,
    String icon,
    String color,
    Integer sortOrder,
    Boolean isActive,
    Long spoolCount,
    String fullPath
) {
    public static LocationDTO from(Location entity) {
        return new LocationDTO(
            entity.id,
            entity.name,
            entity.description,
            entity.locationType,
            entity.capacity,
            entity.icon,
            entity.color,
            entity.sortOrder,
            entity.isActive,
            entity.getSpoolCount(),
            entity.getFullPath()
        );
    }

    public static LocationDTO fromWithChildren(Location entity) {
        return from(entity);
    }
}

