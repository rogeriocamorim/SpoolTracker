package com.spooltracker.dto;

import com.spooltracker.entity.Manufacturer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManufacturerDTO(
    Long id,
    @NotBlank(message = "Manufacturer name is required")
    @Size(max = 100, message = "Manufacturer name must be less than 100 characters")
    String name,
    @Size(max = 500, message = "Description must be less than 500 characters")
    String description,
    @Size(max = 500, message = "Website URL must be less than 500 characters")
    String website,
    @Size(max = 500, message = "Logo URL must be less than 500 characters")
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

