package com.spooltracker.dto;

import com.spooltracker.entity.Location;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record LocationDTO(
    Long id,
    @NotBlank(message = "Location name is required")
    String name,
    String description,
    String locationType,
    Long parentId,
    String parentName,
    Integer capacity,
    String icon,
    String color,
    Integer sortOrder,
    Boolean isActive,
    Long spoolCount,
    String fullPath,
    List<LocationDTO> children
) {
    public static LocationDTO from(Location entity) {
        return new LocationDTO(
            entity.id,
            entity.name,
            entity.description,
            entity.locationType,
            entity.parent != null ? entity.parent.id : null,
            entity.parent != null ? entity.parent.name : null,
            entity.capacity,
            entity.icon,
            entity.color,
            entity.sortOrder,
            entity.isActive,
            entity.getSpoolCount(),
            entity.getFullPath(),
            null // Don't include children by default to avoid circular references
        );
    }

    public static LocationDTO fromWithChildren(Location entity) {
        return new LocationDTO(
            entity.id,
            entity.name,
            entity.description,
            entity.locationType,
            entity.parent != null ? entity.parent.id : null,
            entity.parent != null ? entity.parent.name : null,
            entity.capacity,
            entity.icon,
            entity.color,
            entity.sortOrder,
            entity.isActive,
            entity.getSpoolCount(),
            entity.getFullPath(),
            entity.children != null ? entity.children.stream().map(LocationDTO::from).toList() : List.of()
        );
    }
}

