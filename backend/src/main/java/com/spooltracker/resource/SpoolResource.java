package com.spooltracker.resource;

import java.time.LocalDate;
import java.util.List;

import com.spooltracker.dto.CreateSpoolDTO;
import com.spooltracker.dto.PagedResponse;
import com.spooltracker.dto.SpoolDTO;
import com.spooltracker.dto.UpdateSpoolDTO;
import com.spooltracker.entity.FilamentColor;
import com.spooltracker.entity.FilamentType;
import com.spooltracker.entity.Location;
import com.spooltracker.entity.Manufacturer;
import com.spooltracker.entity.Spool;
import com.spooltracker.entity.Settings;
import com.spooltracker.entity.SpoolHistory;
import com.spooltracker.entity.SpoolLocation;
import com.spooltracker.entity.SpoolType;
import com.spooltracker.service.SettingsService;
import com.spooltracker.service.SpoolHistoryService;
import com.spooltracker.util.ResponseHelper;
import com.spooltracker.util.Sanitizer;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

@Path("/api/spools")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SpoolResource {

    @Inject
    SpoolHistoryService historyService;

    @Inject
    SettingsService settingsService;

    @Context
    UriInfo uriInfo;

    @GET
    public Response getAll(
        @QueryParam("location") SpoolLocation location,
        @QueryParam("storageLocationId") Long storageLocationId,
        @QueryParam("manufacturerId") Long manufacturerId,
        @QueryParam("filamentTypeId") Long filamentTypeId,
        @QueryParam("colorId") Long colorId,
        @QueryParam("isEmpty") Boolean isEmpty,
        @QueryParam("colorNumber") String colorNumber,
        @QueryParam("search") String search,
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("pageSize") @DefaultValue("50") int pageSize
    ) {
        // Use Panache query with proper parameter binding
        io.quarkus.panache.common.Page panachePage = io.quarkus.panache.common.Page.of(page, pageSize);
        
        // Determine if JOINs are needed first
        boolean needsJoin = search != null && !search.trim().isEmpty() 
            || colorId != null 
            || manufacturerId != null 
            || filamentTypeId != null;
        
        // Build query conditions
        List<String> conditions = new java.util.ArrayList<>();
        List<Object> params = new java.util.ArrayList<>();
        int paramIndex = 1;
        
        if (colorNumber != null && !colorNumber.trim().isEmpty()) {
            conditions.add("s.colorNumber = ?" + paramIndex++);
            params.add(colorNumber.trim());
        }
        if (storageLocationId != null) {
            conditions.add("s.storageLocation.id = ?" + paramIndex++);
            params.add(storageLocationId);
        }
        if (location != null) {
            conditions.add("s.legacyLocation = ?" + paramIndex++);
            params.add(location);
        }
        if (manufacturerId != null) {
            // Use alias if JOIN exists, otherwise use path navigation
            if (needsJoin) {
                conditions.add("manufacturer.id = ?" + paramIndex++);
            } else {
                conditions.add("s.manufacturer.id = ?" + paramIndex++);
            }
            params.add(manufacturerId);
        }
        if (filamentTypeId != null) {
            // Use alias if JOIN exists, otherwise use path navigation
            if (needsJoin) {
                conditions.add("filamentType.id = ?" + paramIndex++);
            } else {
                conditions.add("s.filamentType.id = ?" + paramIndex++);
            }
            params.add(filamentTypeId);
        }
        if (colorId != null) {
            // Use alias if JOIN exists, otherwise use path navigation
            if (needsJoin) {
                conditions.add("color.id = ?" + paramIndex++);
            } else {
                conditions.add("s.color.id = ?" + paramIndex++);
            }
            params.add(colorId);
        }
        if (isEmpty != null) {
            conditions.add("s.isEmpty = ?" + paramIndex++);
            params.add(isEmpty);
        }
        
        // Build query with JOINs for better performance when filtering by related entities
        String baseQuery = "FROM Spool s";
        if (needsJoin) {
            baseQuery += " JOIN s.color color JOIN s.manufacturer manufacturer JOIN s.filamentType filamentType";
        }
        
        // Add search filter - use JOIN for better performance
        // IMPORTANT: This must come AFTER JOINs are determined, as it references joined entity aliases
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = "%" + search.toLowerCase().trim() + "%";
            // Use JOIN syntax for better query performance - aliases must exist from JOIN above
            conditions.add("(LOWER(color.name) LIKE ?" + paramIndex++
                + " OR LOWER(s.colorNumber) LIKE ?" + paramIndex++
                + " OR LOWER(s.notes) LIKE ?" + paramIndex++
                + " OR LOWER(manufacturer.name) LIKE ?" + paramIndex++
                + " OR LOWER(filamentType.name) LIKE ?" + paramIndex++ + ")");
            params.add(searchLower);
            params.add(searchLower);
            params.add(searchLower);
            params.add(searchLower);
            params.add(searchLower);
        }
        
        String whereClause = conditions.isEmpty() ? null : String.join(" AND ", conditions);
        String fullQuery = baseQuery + (whereClause != null ? " WHERE " + whereClause : "");
        
        // Get total count - use optimized count query
        long totalCount;
        if (whereClause != null) {
            String countQuery = "SELECT COUNT(s) " + fullQuery;
            totalCount = Spool.find(countQuery, params.toArray()).count();
        } else {
            totalCount = Spool.count();
        }
        
        // Get paginated results with JOINs for better performance
        // Note: JOIN FETCH with DISTINCT can cause issues with pagination in some JPA implementations
        // Since entities use EAGER fetching, related entities should already be loaded
        // If N+1 issues occur, consider using @EntityGraph or batch fetching
        List<Spool> spools;
        if (whereClause != null) {
            String selectQuery = "SELECT DISTINCT s " + fullQuery;
            spools = Spool.find(selectQuery, params.toArray())
                .page(panachePage)
                .list();
        } else {
            spools = Spool.findAll()
                .page(panachePage)
                .list();
        }
        
        List<SpoolDTO> spoolDTOs = spools.stream()
            .map(SpoolDTO::from)
            .toList();
        
        // Return paginated response if pagination requested, otherwise return list for backward compatibility
        if (pageSize > 0 && pageSize < totalCount) {
            return Response.ok(
                PagedResponse.of(spoolDTOs, page, pageSize, totalCount)
            ).build();
        } else {
            return Response.ok(spoolDTOs).build();
        }
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        Spool spool = Spool.findById(id);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @GET
    @Path("/uid/{uid}")
    public Response getByUid(@PathParam("uid") String uid) {
        Spool spool = Spool.findByUid(uid);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid CreateSpoolDTO dto) {
        FilamentType filamentType = FilamentType.findById(dto.filamentTypeId());
        if (filamentType == null) {
            return ResponseHelper.badRequest("Filament type not found", uriInfo);
        }
        
        FilamentColor color = FilamentColor.findById(dto.colorId());
        if (color == null) {
            return ResponseHelper.badRequest("Color not found", uriInfo);
        }
        
        Manufacturer manufacturer = Manufacturer.findById(dto.manufacturerId());
        if (manufacturer == null) {
            return ResponseHelper.badRequest("Manufacturer not found", uriInfo);
        }
        
        Spool spool = new Spool();
        spool.filamentType = filamentType;
        spool.color = color;
        spool.manufacturer = manufacturer;
        spool.spoolType = dto.spoolType() != null ? dto.spoolType() : SpoolType.PLASTIC;
        
        // Handle location - prefer new system, fallback to legacy
        if (dto.storageLocationId() != null) {
            Location storageLocation = Location.findById(dto.storageLocationId());
            if (storageLocation == null) {
                return ResponseHelper.badRequest("Storage location not found", uriInfo);
            }
            spool.storageLocation = storageLocation;
            spool.legacyLocation = null;
        } else if (dto.location() != null) {
            spool.legacyLocation = dto.location();
            spool.storageLocation = null;
        }
        spool.locationDetails = Sanitizer.sanitize(dto.locationDetails());
        
        // Apply settings defaults if not provided
        Settings settings = settingsService.getSettings();
        spool.initialWeightGrams = dto.initialWeightGrams() != null 
            ? dto.initialWeightGrams() 
            : (settings.defaultWeightGrams != null ? settings.defaultWeightGrams.doubleValue() : null);
        spool.currentWeightGrams = dto.currentWeightGrams() != null 
            ? dto.currentWeightGrams() 
            : spool.initialWeightGrams;
        spool.purchaseDate = dto.purchaseDate();
        spool.openedDate = dto.openedDate();
        spool.purchasePrice = dto.purchasePrice();
        spool.purchaseCurrency = dto.purchaseCurrency() != null && !dto.purchaseCurrency().trim().isEmpty()
            ? dto.purchaseCurrency()
            : settings.defaultCurrency;
        spool.notes = Sanitizer.sanitizeWithLineBreaks(dto.notes());
        spool.colorNumber = Sanitizer.sanitize(dto.colorNumber());
        spool.persist();
        
        // Record creation in history
        historyService.recordSpoolCreated(spool);
        
        return Response.status(Response.Status.CREATED)
            .entity(SpoolDTO.from(spool))
            .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, @Valid UpdateSpoolDTO dto) {
        Spool spool = Spool.findById(id);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }
        
        if (dto.filamentTypeId() != null) {
            FilamentType filamentType = FilamentType.findById(dto.filamentTypeId());
            if (filamentType == null) {
                return ResponseHelper.badRequest("Filament type not found", uriInfo);
            }
            spool.filamentType = filamentType;
        }
        
        if (dto.colorId() != null) {
            FilamentColor color = FilamentColor.findById(dto.colorId());
            if (color == null) {
                return ResponseHelper.badRequest("Color not found", uriInfo);
            }
            spool.color = color;
        }
        
        if (dto.manufacturerId() != null) {
            Manufacturer manufacturer = Manufacturer.findById(dto.manufacturerId());
            if (manufacturer == null) {
                return ResponseHelper.badRequest("Manufacturer not found", uriInfo);
            }
            spool.manufacturer = manufacturer;
        }
        
        // Track location change
        String oldLocation = spool.getLocationName();
        if (dto.storageLocationId() != null) {
            Location storageLocation = Location.findById(dto.storageLocationId());
            if (storageLocation != null) {
                spool.storageLocation = storageLocation;
                spool.legacyLocation = null;
            }
        } else if (dto.location() != null) {
            spool.legacyLocation = dto.location();
            spool.storageLocation = null;
        }
        if (dto.locationDetails() != null) {
            spool.locationDetails = Sanitizer.sanitize(dto.locationDetails());
        }
        String newLocation = spool.getLocationName();
        if (oldLocation != null && newLocation != null && !oldLocation.equals(newLocation)) {
            historyService.recordLocationChange(spool, oldLocation, newLocation);
        }
        
        // Track weight change
        Double oldWeight = spool.currentWeightGrams;
        if (dto.initialWeightGrams() != null) {
            spool.initialWeightGrams = dto.initialWeightGrams();
        }
        if (dto.currentWeightGrams() != null) {
            spool.currentWeightGrams = dto.currentWeightGrams();
        }
        if (oldWeight != null && spool.currentWeightGrams != null && 
            !oldWeight.equals(spool.currentWeightGrams)) {
            historyService.recordWeightUpdate(spool, oldWeight, spool.currentWeightGrams);
        }
        if (dto.purchaseDate() != null) {
            spool.purchaseDate = dto.purchaseDate();
        }
        if (dto.openedDate() != null) {
            spool.openedDate = dto.openedDate();
        }
        if (dto.lastUsedDate() != null) {
            spool.lastUsedDate = dto.lastUsedDate();
        }
        if (dto.purchasePrice() != null) {
            spool.purchasePrice = dto.purchasePrice();
        }
        if (dto.purchaseCurrency() != null) {
            spool.purchaseCurrency = dto.purchaseCurrency();
        }
        if (dto.notes() != null) {
            spool.notes = Sanitizer.sanitizeWithLineBreaks(dto.notes());
        }
        if (dto.isEmpty() != null) {
            spool.isEmpty = dto.isEmpty();
        }
        if (dto.colorNumber() != null) {
            spool.colorNumber = Sanitizer.sanitize(dto.colorNumber());
        }
        
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @PATCH
    @Path("/{id}/location")
    @Transactional
    public Response updateLocation(
        @PathParam("id") Long id,
        @QueryParam("location") SpoolLocation location,
        @QueryParam("storageLocationId") Long storageLocationId,
        @QueryParam("details") String details
    ) {
        Spool spool = Spool.findById(id);
        if (spool == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        // Track old location
        String oldLocation = spool.getLocationName();
        
        // Prefer new location system
        if (storageLocationId != null) {
            Location storageLocation = Location.findById(storageLocationId);
            if (storageLocation == null) {
                return ResponseHelper.badRequest("Storage location not found", uriInfo);
            }
            spool.storageLocation = storageLocation;
            spool.legacyLocation = null;
            spool.locationDetails = null;
        } else if (location != null) {
            spool.legacyLocation = location;
            spool.storageLocation = null;
        }
        
        if (details != null) {
            spool.locationDetails = Sanitizer.sanitize(details);
        }
        
        // Record location change in history
        String newLocation = spool.getLocationName();
        if (oldLocation != null && newLocation != null && !oldLocation.equals(newLocation)) {
            historyService.recordLocationChange(spool, oldLocation, newLocation);
        }
        
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @PATCH
    @Path("/{id}/weight")
    @Transactional
    public Response updateWeight(
        @PathParam("id") Long id,
        @QueryParam("weight") Double weight
    ) {
        Spool spool = Spool.findById(id);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }
        
        if (weight != null && weight > 0) {
            Double oldWeight = spool.currentWeightGrams;
            spool.currentWeightGrams = weight;
            spool.lastUsedDate = LocalDate.now();
            
            // Auto-mark as empty if weight is very low
            if (weight < 50) {
                spool.isEmpty = true;
            }
            
            // Record weight update in history
            historyService.recordWeightUpdate(spool, oldWeight, weight);
        }
        
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @PATCH
    @Path("/{id}/empty")
    @Transactional
    public Response markEmpty(@PathParam("id") Long id) {
        Spool spool = Spool.findById(id);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }
        
        if (spool.isEmpty == null || !spool.isEmpty) {
            spool.isEmpty = true;
            spool.currentWeightGrams = 0.0;
            spool.legacyLocation = SpoolLocation.EMPTY;
            spool.storageLocation = null;
            
            // Record in history
            historyService.recordMarkedEmpty(spool);
        }
        
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Spool spool = Spool.findById(id);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }
        
        // Delete spool history first to avoid foreign key constraint violation
        SpoolHistory.delete("spool.id", id);
        
        spool.delete();
        return Response.noContent().build();
    }

    // Statistics endpoints
    @GET
    @Path("/stats/by-location")
    public Response getStatsByLocation() {
        List<Object[]> stats = Spool.find("SELECT s.legacyLocation, COUNT(s) FROM Spool s WHERE s.isEmpty = false AND s.legacyLocation IS NOT NULL GROUP BY s.legacyLocation")
            .project(Object[].class)
            .list();
        
        return Response.ok(stats.stream()
            .map(row -> new LocationStats((SpoolLocation) row[0], (Long) row[1]))
            .toList()
        ).build();
    }

    @GET
    @Path("/stats/by-material")
    public Response getStatsByMaterial() {
        List<Object[]> stats = Spool.find(
            "SELECT s.filamentType.material.name, COUNT(s) FROM Spool s WHERE s.isEmpty = false AND s.filamentType IS NOT NULL AND s.filamentType.material IS NOT NULL GROUP BY s.filamentType.material.name"
        ).project(Object[].class).list();
        
        return Response.ok(stats.stream()
            .map(row -> new MaterialStats((String) row[0], (Long) row[1]))
            .toList()
        ).build();
    }

    public record LocationStats(SpoolLocation location, Long count) {}
    public record MaterialStats(String material, Long count) {}
}

