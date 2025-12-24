package com.spooltracker.resource;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.jboss.resteasy.reactive.multipart.FileUpload;

import com.spooltracker.dto.FilamentMatchDTO;
import com.spooltracker.dto.FilamentMatchDTO.SpoolMatchDTO;
import com.spooltracker.dto.FilamentUsageDTO;
import com.spooltracker.dto.PrintJobParseResultDTO;
import com.spooltracker.dto.SpoolDTO;
import com.spooltracker.entity.Spool;
import com.spooltracker.service.SpoolHistoryService;
import com.spooltracker.service.ThreeMFParserService;
import com.spooltracker.util.ResponseHelper;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

@Path("/api/print-jobs")
@Produces(MediaType.APPLICATION_JSON)
public class PrintJobResource {

    @Inject
    ThreeMFParserService parserService;

    @Inject
    SpoolHistoryService historyService;

    @Context
    UriInfo uriInfo;

    /**
     * Upload and parse a 3MF file to extract filament usage
     */
    @POST
    @Path("/parse-3mf")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response parse3mf(FileUpload file) {
        if (file == null) {
            return ResponseHelper.badRequest("No file uploaded", uriInfo);
        }

        String fileName = file.fileName();
        if (fileName == null || !fileName.toLowerCase().endsWith(".3mf")) {
            return ResponseHelper.badRequest("File must be a .3mf file", uriInfo);
        }

        try (InputStream is = java.nio.file.Files.newInputStream(file.uploadedFile())) {
            // Parse the 3MF file
            ThreeMFParserService.ParseResult parseResult = parserService.parse(is);

            // Match each filament to available spools
            List<FilamentMatchDTO> filamentMatches = new ArrayList<>();
            for (FilamentUsageDTO usage : parseResult.filaments()) {
                List<SpoolMatchDTO> matchingSpools = findMatchingSpools(usage);
                filamentMatches.add(new FilamentMatchDTO(usage, matchingSpools, null));
            }

            PrintJobParseResultDTO result = new PrintJobParseResultDTO(
                fileName,
                parseResult.printerModel(),
                parseResult.estimatedTimeSeconds(),
                parseResult.totalWeightGrams(),
                parseResult.usesSupport(),
                filamentMatches
            );

            return Response.ok(result).build();
        } catch (IllegalArgumentException e) {
            return ResponseHelper.badRequest(e.getMessage(), uriInfo);
        } catch (Exception e) {
            return ResponseHelper.badRequest("Failed to parse 3MF file: " + e.getMessage(), uriInfo);
        }
    }

    /**
     * Confirm print job and deduct filament from selected spools
     */
    @POST
    @Path("/confirm")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Response confirmPrintJob(List<FilamentDeductionRequest> deductions) {
        if (deductions == null || deductions.isEmpty()) {
            return ResponseHelper.badRequest("No deductions provided", uriInfo);
        }

        List<SpoolDTO> updatedSpools = new ArrayList<>();

        for (FilamentDeductionRequest deduction : deductions) {
            if (deduction.spoolId() == null || deduction.gramsUsed() <= 0) {
                continue;
            }

            Spool spool = Spool.findById(deduction.spoolId());
            if (spool == null) {
                return ResponseHelper.badRequest("Spool not found: " + deduction.spoolId(), uriInfo);
            }

            // Check if spool has enough filament
            double currentWeight = spool.currentWeightGrams != null ? spool.currentWeightGrams : 0;
            double newWeight = Math.max(0, currentWeight - deduction.gramsUsed());

            // Record the weight change
            Double oldWeight = spool.currentWeightGrams;
            spool.currentWeightGrams = newWeight;

            // Auto-mark as empty if weight is very low
            if (newWeight < 50) {
                spool.isEmpty = true;
            }

            // Record in history
            historyService.recordWeightUpdate(spool, oldWeight, newWeight);

            updatedSpools.add(SpoolDTO.from(spool));
        }

        return Response.ok(updatedSpools).build();
    }

    /**
     * Find spools that match the given filament usage by material type and color
     */
    private List<SpoolMatchDTO> findMatchingSpools(FilamentUsageDTO usage) {
        // Get all non-empty spools
        List<Spool> allSpools = Spool.find("isEmpty = false OR isEmpty IS NULL").list();

        List<SpoolMatchDTO> matches = new ArrayList<>();

        for (Spool spool : allSpools) {
            // Skip if no color info
            if (spool.color == null || spool.color.hexCode == null) {
                continue;
            }

            // Check material type match (PLA, PETG, etc.)
            String spoolMaterial = spool.filamentType != null && spool.filamentType.material != null
                ? spool.filamentType.material.name.toUpperCase()
                : "";
            String spoolTypeName = spool.filamentType != null ? spool.filamentType.name.toUpperCase() : "";
            
            boolean materialMatch = spoolMaterial.contains(usage.type().toUpperCase()) 
                || spoolTypeName.contains(usage.type().toUpperCase())
                || usage.type().toUpperCase().contains(spoolMaterial);

            if (!materialMatch) {
                continue;
            }

            // Calculate color match score (0-100)
            int colorScore = calculateColorMatchScore(usage.colorHex(), spool.color.hexCode);

            // Only include if color is reasonably close (score > 50)
            if (colorScore < 50) {
                continue;
            }

            // Check if spool has enough filament
            double currentWeight = spool.currentWeightGrams != null ? spool.currentWeightGrams : 0;
            boolean hasEnough = currentWeight >= usage.usedGrams();

            // Adjust score based on availability
            int finalScore = hasEnough ? colorScore : colorScore / 2;

            matches.add(new SpoolMatchDTO(
                spool.id,
                spool.uid,
                spool.manufacturer != null ? spool.manufacturer.name : "Unknown",
                spool.filamentType != null ? spool.filamentType.name : "Unknown",
                spoolMaterial,
                spool.color.name,
                spool.color.hexCode,
                spool.currentWeightGrams,
                spool.getRemainingPercentage(),
                spool.storageLocation != null ? spool.storageLocation.name : 
                    (spool.legacyLocation != null ? spool.legacyLocation.getDisplayName() : "Unknown"),
                finalScore
            ));
        }

        // Sort by match score (highest first)
        matches.sort(Comparator.comparingInt(SpoolMatchDTO::matchScore).reversed());

        return matches;
    }

    /**
     * Calculate how closely two hex colors match (0-100 score)
     */
    private int calculateColorMatchScore(String hex1, String hex2) {
        try {
            // Parse hex colors
            int r1 = Integer.parseInt(hex1.substring(1, 3), 16);
            int g1 = Integer.parseInt(hex1.substring(3, 5), 16);
            int b1 = Integer.parseInt(hex1.substring(5, 7), 16);

            int r2 = Integer.parseInt(hex2.substring(1, 3), 16);
            int g2 = Integer.parseInt(hex2.substring(3, 5), 16);
            int b2 = Integer.parseInt(hex2.substring(5, 7), 16);

            // Calculate Euclidean distance in RGB space
            double distance = Math.sqrt(
                Math.pow(r1 - r2, 2) + 
                Math.pow(g1 - g2, 2) + 
                Math.pow(b1 - b2, 2)
            );

            // Max possible distance is sqrt(3 * 255^2) ≈ 441.67
            double maxDistance = 441.67;

            // Convert to 0-100 score (100 = exact match)
            int score = (int) ((1 - (distance / maxDistance)) * 100);

            return Math.max(0, Math.min(100, score));
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Request to deduct filament from a spool
     */
    public record FilamentDeductionRequest(
        Long spoolId,
        double gramsUsed,
        String colorHex,  // For reference
        String type       // For reference
    ) {}
}

