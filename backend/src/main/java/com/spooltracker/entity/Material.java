package com.spooltracker.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "material")
public class Material extends PanacheEntity {

    @NotBlank(message = "Material name is required")
    @Column(nullable = false, unique = true)
    public String name;

    @Column(length = 500)
    public String description;

    // Printing temperature range
    public Integer minNozzleTemp;
    public Integer maxNozzleTemp;
    public Integer minBedTemp;
    public Integer maxBedTemp;

    // Properties
    public Boolean requiresEnclosure;
    public Boolean requiresDryBox;

    @OneToMany(mappedBy = "material")
    public List<FilamentType> filamentTypes = new ArrayList<>();

    public static Material findByName(String name) {
        return find("name", name).firstResult();
    }
}

