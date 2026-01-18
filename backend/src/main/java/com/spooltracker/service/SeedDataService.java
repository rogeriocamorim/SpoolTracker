package com.spooltracker.service;

import com.spooltracker.entity.FilamentColor;
import com.spooltracker.entity.FilamentType;
import com.spooltracker.entity.Manufacturer;
import com.spooltracker.entity.Material;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * Service for seeding default data (manufacturers, materials, filament types, and colors).
 */
@ApplicationScoped
public class SeedDataService {

    @Inject
    EntityManager em;

    public record SeedStatus(
        boolean manufacturersSeeded,
        boolean materialsSeeded,
        boolean filamentTypesSeeded,
        boolean colorsSeeded,
        int manufacturerCount,
        int materialCount,
        int filamentTypeCount,
        int colorCount
    ) {}

    /**
     * Check if seed data already exists.
     */
    public SeedStatus checkSeedStatus() {
        long manufacturerCount = Manufacturer.count();
        long materialCount = Material.count();
        long filamentTypeCount = FilamentType.count();
        long colorCount = FilamentColor.count();
        
        return new SeedStatus(
            manufacturerCount > 0,
            materialCount > 0,
            filamentTypeCount > 0,
            colorCount > 0,
            (int) manufacturerCount,
            (int) materialCount,
            (int) filamentTypeCount,
            (int) colorCount
        );
    }

    /**
     * Seed all default data (manufacturers, materials, filament types, colors).
     * Only seeds data that doesn't already exist.
     */
    @Transactional
    public SeedResult seedDefaultData() {
        SeedResult result = new SeedResult();
        
        // Seed manufacturers
        if (Manufacturer.count() == 0) {
            seedManufacturers();
            result.manufacturersSeeded = true;
        }
        
        // Seed materials
        if (Material.count() == 0) {
            seedMaterials();
            result.materialsSeeded = true;
        }
        
        // Seed filament types and colors
        if (FilamentType.count() == 0) {
            seedFilamentTypesAndColors();
            result.filamentTypesSeeded = true;
            result.colorsSeeded = true;
        } else if (FilamentColor.count() == 0) {
            // Types exist but no colors - seed colors for existing types
            seedColorsForExistingTypes();
            result.colorsSeeded = true;
        }
        
        // Update sequences
        updateSequences();
        
        return result;
    }

    private void seedManufacturers() {
        createManufacturer("Bambu Lab", "High-quality 3D printing filaments designed for Bambu Lab printers", "https://bambulab.com");
        createManufacturer("Polymaker", "Premium 3D printing materials for professionals and enthusiasts", "https://polymaker.com");
        createManufacturer("Hatchbox", "Reliable and affordable 3D printing filaments", "https://hatchbox3d.com");
        createManufacturer("eSUN", "Wide variety of 3D printing materials", "https://esun3d.com");
        createManufacturer("Prusament", "Precision-made filaments by Prusa Research", "https://prusament.com");
    }

    private void seedMaterials() {
        createMaterial("PLA", "Polylactic Acid - Easy to print, biodegradable", 190, 230, 45, 60, false, false);
        createMaterial("PETG", "Polyethylene Terephthalate Glycol - Strong and flexible", 220, 250, 70, 85, false, true);
        createMaterial("ASA/ABS", "Acrylonitrile Styrene Acrylate / Acrylonitrile Butadiene Styrene - UV resistant, durable", 240, 270, 90, 110, true, true);
        createMaterial("TPU", "Thermoplastic Polyurethane - Flexible and elastic", 210, 240, 40, 60, false, true);
        createMaterial("PC", "Polycarbonate - High strength and temperature resistance", 260, 300, 100, 120, true, true);
        createMaterial("PA/PET", "Polyamide/Nylon - Strong and wear resistant", 250, 280, 70, 90, true, true);
        createMaterial("PPS", "Polyphenylene Sulfide - High temperature and chemical resistance", 290, 330, 120, 150, true, true);
        createMaterial("Support", "Support materials for multi-material printing", 190, 230, 45, 60, false, false);
        createMaterial("Fiber Reinforced", "Carbon fiber or glass fiber reinforced materials", 240, 280, 80, 100, true, true);
    }

    private void seedFilamentTypesAndColors() {
        Manufacturer bambuLab = Manufacturer.find("name", "Bambu Lab").firstResult();
        Material pla = Material.find("name", "PLA").firstResult();
        Material petg = Material.find("name", "PETG").firstResult();
        
        if (bambuLab == null || pla == null || petg == null) {
            return;
        }

        // PLA Basic
        FilamentType plaBasic = createFilamentType("PLA Basic", "Bambu Lab standard PLA filament", pla, bambuLab, 190, 220, 45, 55);
        seedPlaBasicColors(plaBasic);

        // PLA Matte
        FilamentType plaMatte = createFilamentType("PLA Matte", "Bambu Lab matte finish PLA filament", pla, bambuLab, 190, 220, 45, 55);
        seedPlaMatteColors(plaMatte);

        // PETG HF
        FilamentType petgHf = createFilamentType("PETG HF", "Bambu Lab high flow PETG filament", petg, bambuLab, 230, 250, 70, 80);
        seedPetgHfColors(petgHf);

        // PETG Translucent
        FilamentType petgTranslucent = createFilamentType("PETG Translucent", "Bambu Lab translucent PETG filament", petg, bambuLab, 230, 250, 70, 80);
        seedPetgTranslucentColors(petgTranslucent);
    }

    private void seedColorsForExistingTypes() {
        FilamentType plaBasic = FilamentType.find("name", "PLA Basic").firstResult();
        FilamentType plaMatte = FilamentType.find("name", "PLA Matte").firstResult();
        FilamentType petgHf = FilamentType.find("name", "PETG HF").firstResult();
        FilamentType petgTranslucent = FilamentType.find("name", "PETG Translucent").firstResult();

        if (plaBasic != null && plaBasic.colors.isEmpty()) seedPlaBasicColors(plaBasic);
        if (plaMatte != null && plaMatte.colors.isEmpty()) seedPlaMatteColors(plaMatte);
        if (petgHf != null && petgHf.colors.isEmpty()) seedPetgHfColors(petgHf);
        if (petgTranslucent != null && petgTranslucent.colors.isEmpty()) seedPetgTranslucentColors(petgTranslucent);
    }

    private void seedPlaBasicColors(FilamentType type) {
        createColor(type, "Jade White", "#FFFFFF", "10100");
        createColor(type, "Magenta", "#EC008C", "10101");
        createColor(type, "Gold", "#E4BD68", "10102");
        createColor(type, "Mistletoe Green", "#3F8E43", "10103");
        createColor(type, "Red", "#C12E1F", "10104");
        createColor(type, "Purple", "#5E43B7", "10105");
        createColor(type, "Beige", "#F7E6DE", "10106");
        createColor(type, "Pink", "#F55A74", "10107");
        createColor(type, "Sunflower Yellow", "#FEC600", "10108");
        createColor(type, "Bronze", "#847D48", "10109");
        createColor(type, "Turquoise", "#00B1B7", "10110");
        createColor(type, "Indigo Purple", "#482960", "10111");
        createColor(type, "Light Gray", "#D1D3D5", "10112");
        createColor(type, "Hot Pink", "#F5547C", "10113");
        createColor(type, "Yellow", "#F4EE2A", "10114");
        createColor(type, "Cocoa Brown", "#6F5034", "10115");
        createColor(type, "Cyan", "#0086D6", "10116");
        createColor(type, "Blue Grey", "#5B6579", "10117");
        createColor(type, "Silver", "#A6A9AA", "10118");
        createColor(type, "Orange", "#FF6A13", "10119");
        createColor(type, "Bright Green", "#BECF00", "10120");
        createColor(type, "Brown", "#9D432C", "10121");
        createColor(type, "Blue", "#0A2989", "10122");
        createColor(type, "Dark Gray", "#545454", "10123");
        createColor(type, "Gray", "#8E9089", "10124");
        createColor(type, "Pumpkin Orange", "#FF9016", "10125");
        createColor(type, "Bambu Green", "#00AE42", "10126");
        createColor(type, "Maroon Red", "#9D2235", "10127");
        createColor(type, "Cobalt Blue", "#0056B8", "10128");
        createColor(type, "Black", "#000000", "10129");
    }

    private void seedPlaMatteColors(FilamentType type) {
        createColor(type, "Ivory White", "#FFFFFF", "10200");
        createColor(type, "Bone White", "#CBC6B8", "10201");
        createColor(type, "Desert Tan", "#E8DBB7", "10202");
        createColor(type, "Latte Brown", "#D3B7A7", "10203");
        createColor(type, "Caramel", "#AE835B", "10204");
        createColor(type, "Terracotta", "#B15533", "10205");
        createColor(type, "Dark Brown", "#7D6556", "10206");
        createColor(type, "Dark Chocolate", "#4D3324", "10207");
        createColor(type, "Lilac Purple", "#AE96D4", "10208");
        createColor(type, "Sakura Pink", "#E8AFCF", "10209");
        createColor(type, "Mandarin Orange", "#F99963", "10210");
        createColor(type, "Lemon Yellow", "#F7D959", "10211");
        createColor(type, "Plum", "#950051", "10212");
        createColor(type, "Scarlet Red", "#DE4343", "10213");
        createColor(type, "Dark Red", "#BB3D43", "10214");
        createColor(type, "Dark Green", "#68724D", "10215");
        createColor(type, "Grass Green", "#61C680", "10216");
        createColor(type, "Apple Green", "#C2E189", "10217");
        createColor(type, "Ice Blue", "#A3D8E1", "10218");
        createColor(type, "Sky Blue", "#56B7E6", "10219");
        createColor(type, "Marine Blue", "#0078BF", "10220");
        createColor(type, "Dark Blue", "#042F56", "10221");
        createColor(type, "Ash Gray", "#9B9EA0", "10222");
        createColor(type, "Nardo Gray", "#757575", "10223");
        createColor(type, "Charcoal", "#000000", "10224");
    }

    private void seedPetgHfColors(FilamentType type) {
        createColor(type, "Yellow", "#FFD00B", "33100");
        createColor(type, "Orange", "#F75403", "33101");
        createColor(type, "Green", "#00AE42", "33102");
        createColor(type, "Red", "#EB3A3A", "33103");
        createColor(type, "Blue", "#002E96", "33104");
        createColor(type, "Black", "#000000", "33105");
        createColor(type, "White", "#FFFFFF", "33106");
        createColor(type, "Cream", "#F9DFB9", "33107");
        createColor(type, "Lime Green", "#6EE53C", "33108");
        createColor(type, "Forest Green", "#39541A", "33109");
        createColor(type, "Lake Blue", "#1F79E5", "33110");
        createColor(type, "Peanut Brown", "#875718", "33111");
        createColor(type, "Gray", "#ADB1B2", "33112");
        createColor(type, "Dark Gray", "#515151", "33113");
    }

    private void seedPetgTranslucentColors(FilamentType type) {
        createColor(type, "Translucent Gray", "#8E8E8E", "33200");
        createColor(type, "Translucent Light Blue", "#61B0FF", "33201");
        createColor(type, "Translucent Olive", "#748C45", "33202");
        createColor(type, "Translucent Brown", "#C9A381", "33203");
        createColor(type, "Translucent Teal", "#77EDD7", "33204");
        createColor(type, "Translucent Orange", "#FF911A", "33205");
        createColor(type, "Translucent Purple", "#D6ABFF", "33206");
        createColor(type, "Translucent Pink", "#F9C1BD", "33207");
    }

    private Manufacturer createManufacturer(String name, String description, String website) {
        Manufacturer m = new Manufacturer();
        m.name = name;
        m.description = description;
        m.website = website;
        m.persist();
        return m;
    }

    private Material createMaterial(String name, String description, int minNozzle, int maxNozzle, 
                                     int minBed, int maxBed, boolean enclosure, boolean dryBox) {
        Material m = new Material();
        m.name = name;
        m.description = description;
        m.minNozzleTemp = minNozzle;
        m.maxNozzleTemp = maxNozzle;
        m.minBedTemp = minBed;
        m.maxBedTemp = maxBed;
        m.requiresEnclosure = enclosure;
        m.requiresDryBox = dryBox;
        m.persist();
        return m;
    }

    private FilamentType createFilamentType(String name, String description, Material material, 
                                             Manufacturer manufacturer, int minNozzle, int maxNozzle, 
                                             int minBed, int maxBed) {
        FilamentType ft = new FilamentType();
        ft.name = name;
        ft.description = description;
        ft.material = material;
        ft.manufacturer = manufacturer;
        ft.minNozzleTemp = minNozzle;
        ft.maxNozzleTemp = maxNozzle;
        ft.minBedTemp = minBed;
        ft.maxBedTemp = maxBed;
        ft.persist();
        return ft;
    }

    private FilamentColor createColor(FilamentType type, String name, String hexCode, String productCode) {
        FilamentColor c = new FilamentColor();
        c.name = name;
        c.hexCode = hexCode;
        c.productCode = productCode;
        c.filamentType = type;
        c.persist();
        return c;
    }

    private void updateSequences() {
        try {
            // Update all sequences to be after max IDs
            em.createNativeQuery("ALTER SEQUENCE manufacturer_seq RESTART WITH " + (getMaxId("manufacturer") + 1)).executeUpdate();
            em.createNativeQuery("ALTER SEQUENCE material_seq RESTART WITH " + (getMaxId("material") + 1)).executeUpdate();
            em.createNativeQuery("ALTER SEQUENCE filament_type_seq RESTART WITH " + (getMaxId("filament_type") + 1)).executeUpdate();
            em.createNativeQuery("ALTER SEQUENCE filament_color_seq RESTART WITH " + (getMaxId("filament_color") + 1)).executeUpdate();
        } catch (Exception e) {
            // Sequences might not exist or different DB, ignore
        }
    }

    private long getMaxId(String tableName) {
        try {
            Object result = em.createNativeQuery("SELECT COALESCE(MAX(id), 0) FROM " + tableName).getSingleResult();
            if (result instanceof Number) {
                return ((Number) result).longValue();
            }
        } catch (Exception e) {
            // Table might not exist
        }
        return 0;
    }

    public static class SeedResult {
        public boolean manufacturersSeeded = false;
        public boolean materialsSeeded = false;
        public boolean filamentTypesSeeded = false;
        public boolean colorsSeeded = false;
        public String message = "Seed operation completed";
    }
}
