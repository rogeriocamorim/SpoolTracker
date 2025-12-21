package com.spooltracker.dto;

import com.spooltracker.entity.FilamentColor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record FilamentColorDTO(
    Long id,
    @NotBlank(message = "Color name is required")
    String name,
    @NotBlank(message = "Hex code is required")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Hex code must be in format #RRGGBB")
    String hexCode,
    String productCode,
    @NotNull(message = "Filament type ID is required")
    Long filamentTypeId,
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

