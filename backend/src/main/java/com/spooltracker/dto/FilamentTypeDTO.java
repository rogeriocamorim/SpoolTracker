package com.spooltracker.dto;

import java.util.List;

import com.spooltracker.entity.FilamentType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FilamentTypeDTO(
    Long id,
    @NotBlank(message = "Filament type name is required")
    @Size(max = 100, message = "Filament type name must be less than 100 characters")
    String name,
    @Size(max = 500, message = "Description must be less than 500 characters")
    String description,
    @NotNull(message = "Material ID is required")
    Long materialId,
    String materialName,
    @NotNull(message = "Manufacturer ID is required")
    Long manufacturerId,
    String manufacturerName,
    Integer minNozzleTemp,
    Integer maxNozzleTemp,
    Integer minBedTemp,
    Integer maxBedTemp,
    Double diameterMm,
    Double densityGPerCm3,
    Integer spoolWeightGrams,
    List<FilamentColorDTO> colors
) {
    public static FilamentTypeDTO from(FilamentType entity) {
        return new FilamentTypeDTO(
            entity.id,
            entity.name,
            entity.description,
            entity.material.id,
            entity.material.name,
            entity.manufacturer.id,
            entity.manufacturer.name,
            entity.minNozzleTemp,
            entity.maxNozzleTemp,
            entity.minBedTemp,
            entity.maxBedTemp,
            entity.diameterMm,
            entity.densityGPerCm3,
            entity.spoolWeightGrams,
            entity.colors != null ? entity.colors.stream().map(FilamentColorDTO::from).toList() : List.of()
        );
    }

    public static FilamentTypeDTO fromWithoutColors(FilamentType entity) {
        return new FilamentTypeDTO(
            entity.id,
            entity.name,
            entity.description,
            entity.material.id,
            entity.material.name,
            entity.manufacturer.id,
            entity.manufacturer.name,
            entity.minNozzleTemp,
            entity.maxNozzleTemp,
            entity.minBedTemp,
            entity.maxBedTemp,
            entity.diameterMm,
            entity.densityGPerCm3,
            entity.spoolWeightGrams,
            null
        );
    }
}

