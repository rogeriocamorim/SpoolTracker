package com.spooltracker.dto;

import com.spooltracker.entity.Manufacturer;
import jakarta.validation.constraints.NotBlank;

public record ManufacturerDTO(
    Long id,
    @NotBlank(message = "Manufacturer name is required")
    String name,
    String description,
    String website,
    String logoUrl
) {
    public static ManufacturerDTO from(Manufacturer entity) {
        return new ManufacturerDTO(
            entity.id,
            entity.name,
            entity.description,
            entity.website,
            entity.logoUrl
        );
    }

    public Manufacturer toEntity() {
        Manufacturer entity = new Manufacturer();
        entity.name = this.name;
        entity.description = this.description;
        entity.website = this.website;
        entity.logoUrl = this.logoUrl;
        return entity;
    }

    public void updateEntity(Manufacturer entity) {
        entity.name = this.name;
        entity.description = this.description;
        entity.website = this.website;
        entity.logoUrl = this.logoUrl;
    }
}

