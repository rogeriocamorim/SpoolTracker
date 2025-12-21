package com.spooltracker.dto;

import com.spooltracker.entity.Material;
import jakarta.validation.constraints.NotBlank;

public record MaterialDTO(
    Long id,
    @NotBlank(message = "Material name is required")
    String name,
    String description,
    Integer minNozzleTemp,
    Integer maxNozzleTemp,
    Integer minBedTemp,
    Integer maxBedTemp,
    Boolean requiresEnclosure,
    Boolean requiresDryBox
) {
    public static MaterialDTO from(Material entity) {
        return new MaterialDTO(
            entity.id,
            entity.name,
            entity.description,
            entity.minNozzleTemp,
            entity.maxNozzleTemp,
            entity.minBedTemp,
            entity.maxBedTemp,
            entity.requiresEnclosure,
            entity.requiresDryBox
        );
    }

    public Material toEntity() {
        Material entity = new Material();
        entity.name = this.name;
        entity.description = this.description;
        entity.minNozzleTemp = this.minNozzleTemp;
        entity.maxNozzleTemp = this.maxNozzleTemp;
        entity.minBedTemp = this.minBedTemp;
        entity.maxBedTemp = this.maxBedTemp;
        entity.requiresEnclosure = this.requiresEnclosure;
        entity.requiresDryBox = this.requiresDryBox;
        return entity;
    }

    public void updateEntity(Material entity) {
        entity.name = this.name;
        entity.description = this.description;
        entity.minNozzleTemp = this.minNozzleTemp;
        entity.maxNozzleTemp = this.maxNozzleTemp;
        entity.minBedTemp = this.minBedTemp;
        entity.maxBedTemp = this.maxBedTemp;
        entity.requiresEnclosure = this.requiresEnclosure;
        entity.requiresDryBox = this.requiresDryBox;
    }
}

