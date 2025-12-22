package com.spooltracker.resource;

import com.spooltracker.entity.FilamentColor;
import com.spooltracker.entity.FilamentType;
import com.spooltracker.entity.Location;
import com.spooltracker.entity.Manufacturer;
import com.spooltracker.entity.Spool;
import com.spooltracker.entity.SpoolLocation;
import com.spooltracker.util.ResponseHelper;
import com.spooltracker.util.Sanitizer;
import org.jboss.logging.Logger;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Path("/api/export")
@Produces(MediaType.APPLICATION_JSON)
public class ExportResource {

    private static final Logger LOG = Logger.getLogger(ExportResource.class);
    private static final int MAX_UID_LENGTH = 100;
    private static final int MAX_STRING_LENGTH = 500;
    private static final double MAX_WEIGHT = 100000.0; // 100kg max
    private static final double MIN_WEIGHT = 0.0;

    @Context
    UriInfo uriInfo;

    @GET
    @Path("/spools/csv")
    @Produces("text/csv")
    public Response exportSpoolsToCsv() {
        List<Spool> spools = Spool.listAll();
        
        StringBuilder csv = new StringBuilder();
        // CSV Header
        csv.append("UID,Color Name,Material,Manufacturer,Filament Type,Location,Color Number,")
           .append("Initial Weight (g),Current Weight (g),Remaining %,Purchase Date,Opened Date,")
           .append("Last Used Date,Purchase Price,Currency,Is Empty,Notes\n");
        
        // CSV Data
        for (Spool spool : spools) {
            csv.append(escapeCsv(spool.uid)).append(",")
               .append(escapeCsv(spool.color != null ? spool.color.name : "")).append(",")
               .append(escapeCsv(spool.filamentType != null && spool.filamentType.material != null 
                   ? spool.filamentType.material.name : "")).append(",")
               .append(escapeCsv(spool.manufacturer != null ? spool.manufacturer.name : "")).append(",")
               .append(escapeCsv(spool.filamentType != null ? spool.filamentType.name : "")).append(",")
               .append(escapeCsv(spool.getLocationName())).append(",")
               .append(escapeCsv(spool.colorNumber)).append(",")
               .append(spool.initialWeightGrams != null ? spool.initialWeightGrams : "").append(",")
               .append(spool.currentWeightGrams != null ? spool.currentWeightGrams : "").append(",")
               .append(spool.getRemainingPercentage() != null 
                   ? String.format("%.2f", spool.getRemainingPercentage()) : "").append(",")
               .append(spool.purchaseDate != null ? spool.purchaseDate.toString() : "").append(",")
               .append(spool.openedDate != null ? spool.openedDate.toString() : "").append(",")
               .append(spool.lastUsedDate != null ? spool.lastUsedDate.toString() : "").append(",")
               .append(spool.purchasePrice != null ? spool.purchasePrice : "").append(",")
               .append(escapeCsv(spool.purchaseCurrency)).append(",")
               .append(spool.isEmpty != null && spool.isEmpty ? "Yes" : "No").append(",")
               .append(escapeCsv(spool.notes)).append("\n");
        }
        
        return Response.ok(csv.toString())
            .header("Content-Disposition", "attachment; filename=\"spools_export.csv\"")
            .build();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (value.contains(",") || value.contains("\n") || value.contains("\"")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    @POST
    @Path("/spools/csv")
    @Consumes(MediaType.TEXT_PLAIN)
    @Transactional
    public Response importSpoolsFromCsv(InputStream csvStream) {
        List<String> errors = new ArrayList<>();
        int imported = 0;
        int skipped = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(csvStream))) {
            String line = reader.readLine(); // Skip header
            int lineNumber = 1;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    String[] fields = parseCsvLine(line);
                    if (fields.length < 6) {
                        errors.add(String.format("Line %d: Insufficient fields (expected at least 6, got %d)", lineNumber, fields.length));
                        skipped++;
                        continue;
                    }

                    // Parse and validate CSV fields (assuming same format as export)
                    String uid = fields[0].trim();
                    String colorName = fields[1].trim();
                    // materialName is parsed but not used directly (filament type already has material)
                    String manufacturerName = fields[3].trim();
                    String filamentTypeName = fields[4].trim();
                    String locationStr = fields[5].trim();
                    String colorNumber = fields.length > 6 ? fields[6].trim() : null;
                    
                    // Validate UID
                    if (uid == null || uid.isEmpty()) {
                        errors.add(String.format("Line %d: UID is required", lineNumber));
                        skipped++;
                        continue;
                    }
                    if (uid.length() > MAX_UID_LENGTH) {
                        errors.add(String.format("Line %d: UID exceeds maximum length of %d characters", lineNumber, MAX_UID_LENGTH));
                        skipped++;
                        continue;
                    }
                    
                    // Sanitize string fields
                    uid = Sanitizer.sanitize(uid);
                    colorName = Sanitizer.sanitize(colorName);
                    manufacturerName = Sanitizer.sanitize(manufacturerName);
                    filamentTypeName = Sanitizer.sanitize(filamentTypeName);
                    locationStr = Sanitizer.sanitize(locationStr);
                    if (colorNumber != null && !colorNumber.isEmpty()) {
                        colorNumber = Sanitizer.sanitize(colorNumber);
                        if (colorNumber.length() > 50) {
                            errors.add(String.format("Line %d: Color number exceeds maximum length of 50 characters", lineNumber));
                            skipped++;
                            continue;
                        }
                    }
                    
                    // Validate string lengths
                    if (colorName.length() > MAX_STRING_LENGTH || manufacturerName.length() > MAX_STRING_LENGTH 
                        || filamentTypeName.length() > MAX_STRING_LENGTH || locationStr.length() > MAX_STRING_LENGTH) {
                        errors.add(String.format("Line %d: One or more fields exceed maximum length of %d characters", lineNumber, MAX_STRING_LENGTH));
                        skipped++;
                        continue;
                    }
                    
                    // Parse and validate weights
                    Double initialWeight = null;
                    Double currentWeight = null;
                    if (fields.length > 7 && !fields[7].trim().isEmpty()) {
                        try {
                            initialWeight = Double.parseDouble(fields[7].trim());
                            if (initialWeight < MIN_WEIGHT || initialWeight > MAX_WEIGHT) {
                                errors.add(String.format("Line %d: Initial weight must be between %.1f and %.1f grams", lineNumber, MIN_WEIGHT, MAX_WEIGHT));
                                skipped++;
                                continue;
                            }
                        } catch (NumberFormatException e) {
                            errors.add(String.format("Line %d: Invalid initial weight format: %s", lineNumber, fields[7].trim()));
                            skipped++;
                            continue;
                        }
                    }
                    if (fields.length > 8 && !fields[8].trim().isEmpty()) {
                        try {
                            currentWeight = Double.parseDouble(fields[8].trim());
                            if (currentWeight < MIN_WEIGHT || currentWeight > MAX_WEIGHT) {
                                errors.add(String.format("Line %d: Current weight must be between %.1f and %.1f grams", lineNumber, MIN_WEIGHT, MAX_WEIGHT));
                                skipped++;
                                continue;
                            }
                            // Validate current weight doesn't exceed initial weight
                            if (initialWeight != null && currentWeight > initialWeight) {
                                errors.add(String.format("Line %d: Current weight (%.1f) cannot exceed initial weight (%.1f)", lineNumber, currentWeight, initialWeight));
                                skipped++;
                                continue;
                            }
                        } catch (NumberFormatException e) {
                            errors.add(String.format("Line %d: Invalid current weight format: %s", lineNumber, fields[8].trim()));
                            skipped++;
                            continue;
                        }
                    }

                    // Find or create manufacturer
                    Manufacturer manufacturer = Manufacturer.find("name", manufacturerName).firstResult();
                    if (manufacturer == null) {
                        errors.add(String.format("Line %d: Manufacturer '%s' not found", lineNumber, manufacturerName));
                        skipped++;
                        continue;
                    }

                    // Find filament type
                    FilamentType filamentType = FilamentType.find("name", filamentTypeName).firstResult();
                    if (filamentType == null) {
                        errors.add(String.format("Line %d: Filament type '%s' not found", lineNumber, filamentTypeName));
                        skipped++;
                        continue;
                    }

                    // Find color
                    FilamentColor color = FilamentColor.find("name", colorName).firstResult();
                    if (color == null) {
                        errors.add(String.format("Line %d: Color '%s' not found", lineNumber, colorName));
                        skipped++;
                        continue;
                    }

                    // Check if spool already exists
                    if (Spool.findByUid(uid) != null) {
                        skipped++;
                        continue;
                    }

                    // Create spool
                    Spool spool = new Spool();
                    spool.uid = uid;
                    spool.filamentType = filamentType;
                    spool.color = color;
                    spool.manufacturer = manufacturer;
                    spool.colorNumber = colorNumber;
                    spool.initialWeightGrams = initialWeight;
                    spool.currentWeightGrams = currentWeight != null ? currentWeight : initialWeight;
                    
                    // Parse location
                    if (!locationStr.isEmpty()) {
                        try {
                            spool.legacyLocation = SpoolLocation.valueOf(locationStr.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            // Try to find location by name
                            Location location = Location.findByName(locationStr);
                            if (location != null) {
                                spool.storageLocation = location;
                            }
                        }
                    }

                    spool.persist();
                    imported++;

                } catch (NumberFormatException e) {
                    errors.add(String.format("Line %d: Number format error - %s", lineNumber, e.getMessage()));
                    skipped++;
                } catch (IllegalArgumentException e) {
                    errors.add(String.format("Line %d: Invalid value - %s", lineNumber, e.getMessage()));
                    skipped++;
                } catch (Exception e) {
                    LOG.errorf(e, "Error processing line %d", lineNumber);
                    errors.add(String.format("Line %d: %s", lineNumber, e.getMessage()));
                    skipped++;
                }
            }

            StringBuilder response = new StringBuilder();
            response.append(String.format("Import completed: %d imported, %d skipped", imported, skipped));
            if (!errors.isEmpty()) {
                response.append("\n\nErrors:\n");
                errors.forEach(error -> response.append(error).append("\n"));
            }

            return Response.ok(response.toString()).build();

        } catch (Exception e) {
            return ResponseHelper.badRequest("Failed to parse CSV: " + e.getMessage(), uriInfo);
        }
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentField = new StringBuilder();

        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(currentField.toString());
                currentField = new StringBuilder();
            } else {
                currentField.append(c);
            }
        }
        fields.add(currentField.toString());
        return fields.toArray(new String[0]);
    }
}

