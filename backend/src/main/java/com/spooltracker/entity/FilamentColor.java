package com.spooltracker.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

@Entity
@Table(
    name = "filament_color",
    indexes = {
        @Index(name = "idx_filament_color_name", columnList = "name")
    }
)
public class FilamentColor extends PanacheEntity {

    @NotBlank(message = "Color name is required")
    @Column(nullable = false)
    public String name;

    @NotBlank(message = "Hex code is required")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Hex code must be in format #RRGGBB")
    @Column(name = "hex_code", nullable = false, length = 7)
    public String hexCode;

    // Manufacturer product code (e.g., Bambu Lab's 10100 for Jade White PLA Basic)
    @Column(name = "product_code", length = 20)
    public String productCode;

    @NotNull(message = "Filament type is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "filament_type_id", nullable = false)
    public FilamentType filamentType;

    @OneToMany(mappedBy = "color")
    public List<Spool> spools;

    public static List<FilamentColor> findByFilamentType(Long filamentTypeId) {
        return list("filamentType.id", filamentTypeId);
    }

    public static FilamentColor findByNameAndType(String name, Long filamentTypeId) {
        return find("name = ?1 and filamentType.id = ?2", name, filamentTypeId).firstResult();
    }
}

