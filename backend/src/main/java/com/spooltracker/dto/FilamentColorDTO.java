package com.spooltracker.dto;

import com.spooltracker.entity.FilamentColor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record FilamentColorDTO(
    Long id,
    @NotBlank(message = "Color name is required")
    String name,
    @NotBlank(message = "Hex code is required")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Hex code must be in format #RRGGBB")
    String hexCode,
    String productCode,
    Long filamentTypeId,  // Optional in request body - provided via URL path when adding colors
    String filamentTypeName
) {
    public static FilamentColorDTO from(FilamentColor entity) {
        return new FilamentColorDTO(
            entity.id,
            entity.name,
            entity.hexCode,
            entity.productCode,
            entity.filamentType.id,
            entity.filamentType.name
        );
    }
}

