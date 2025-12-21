package com.spooltracker.entity;

import java.util.ArrayList;
import java.util.List;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "filament_type")
public class FilamentType extends PanacheEntity {

    @NotBlank(message = "Filament type name is required")
    @Column(nullable = false)
    public String name;

    @Column(length = 500)
    public String description;

    @NotNull(message = "Material is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "material_id", nullable = false)
    public Material material;

    @NotNull(message = "Manufacturer is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manufacturer_id", nullable = false)
    public Manufacturer manufacturer;

    @OneToMany(mappedBy = "filamentType", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<FilamentColor> colors = new ArrayList<>();

    @OneToMany(mappedBy = "filamentType")
    public List<Spool> spools = new ArrayList<>();

    // Type-specific temperature overrides
    public Integer minNozzleTemp;
    public Integer maxNozzleTemp;
    public Integer minBedTemp;
    public Integer maxBedTemp;

    // Physical properties
    @Column(name = "diameter_mm")
    public Double diameterMm = 1.75; // Default 1.75mm

    @Column(name = "density_g_per_cm3")
    public Double densityGPerCm3; // Material density in g/cm³

    @Column(name = "spool_weight_grams")
    public Integer spoolWeightGrams = 1000; // Default spool size

    public static List<FilamentType> findByMaterial(Long materialId) {
        return list("material.id", materialId);
    }

    public static List<FilamentType> findByManufacturer(Long manufacturerId) {
        return list("manufacturer.id", manufacturerId);
    }

    public static List<FilamentType> findByMaterialAndManufacturer(Long materialId, Long manufacturerId) {
        return list("material.id = ?1 and manufacturer.id = ?2", materialId, manufacturerId);
    }
}

