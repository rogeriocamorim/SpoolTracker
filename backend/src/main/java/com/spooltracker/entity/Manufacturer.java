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
@Table(name = "manufacturer")
public class Manufacturer extends PanacheEntity {

    @NotBlank(message = "Manufacturer name is required")
    @Column(nullable = false, unique = true)
    public String name;

    @Column(length = 500)
    public String description;

    public String website;

    public String logoUrl;

    @OneToMany(mappedBy = "manufacturer")
    public List<FilamentType> filamentTypes = new ArrayList<>();

    @OneToMany(mappedBy = "manufacturer")
    public List<Spool> spools = new ArrayList<>();

    public static Manufacturer findByName(String name) {
        return find("name", name).firstResult();
    }
}

