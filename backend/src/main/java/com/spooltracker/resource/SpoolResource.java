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
import com.spooltracker.entity.SpoolLocation;
import com.spooltracker.service.SpoolHistoryService;

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
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/spools")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SpoolResource {

    @Inject
    SpoolHistoryService historyService;

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
        
        // Build query conditions
        List<String> conditions = new java.util.ArrayList<>();
        List<Object> params = new java.util.ArrayList<>();
        int paramIndex = 1;
        
        if (colorNumber != null && !colorNumber.trim().isEmpty()) {
            conditions.add("colorNumber = ?" + paramIndex++);
            params.add(colorNumber.trim());
        }
        if (storageLocationId != null) {
            conditions.add("storageLocation.id = ?" + paramIndex++);
            params.add(storageLocationId);
        }
        if (location != null) {
            conditions.add("legacyLocation = ?" + paramIndex++);
            params.add(location);
        }
        if (manufacturerId != null) {
            conditions.add("manufacturer.id = ?" + paramIndex++);
            params.add(manufacturerId);
        }
        if (filamentTypeId != null) {
            conditions.add("filamentType.id = ?" + paramIndex++);
            params.add(filamentTypeId);
        }
        if (colorId != null) {
            conditions.add("color.id = ?" + paramIndex++);
            params.add(colorId);
        }
        if (isEmpty != null) {
            conditions.add("isEmpty = ?" + paramIndex++);
            params.add(isEmpty);
        }
        
        // Add search filter
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = "%" + search.toLowerCase().trim() + "%";
            conditions.add("(LOWER(color.name) LIKE ?" + paramIndex++
                + " OR LOWER(colorNumber) LIKE ?" + paramIndex++
                + " OR LOWER(notes) LIKE ?" + paramIndex++
                + " OR LOWER(manufacturer.name) LIKE ?" + paramIndex++
                + " OR LOWER(filamentType.name) LIKE ?" + paramIndex++ + ")");
            params.add(searchLower);
            params.add(searchLower);
            params.add(searchLower);
            params.add(searchLower);
            params.add(searchLower);
        }
        
        String whereClause = conditions.isEmpty() ? null : String.join(" AND ", conditions);
        
        // Get total count
        long totalCount = whereClause != null 
            ? Spool.count(whereClause, params.toArray())
            : Spool.count();
        
        // Get paginated results
        List<Spool> spools;
        if (whereClause != null) {
            spools = Spool.find(whereClause, params.toArray())
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
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @GET
    @Path("/uid/{uid}")
    public Response getByUid(@PathParam("uid") String uid) {
        Spool spool = Spool.findByUid(uid);
        if (spool == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid CreateSpoolDTO dto) {
        FilamentType filamentType = FilamentType.findById(dto.filamentTypeId());
        if (filamentType == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Filament type not found")
                .build();
        }
        
        FilamentColor color = FilamentColor.findById(dto.colorId());
        if (color == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Color not found")
                .build();
        }
        
        Manufacturer manufacturer = Manufacturer.findById(dto.manufacturerId());
        if (manufacturer == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Manufacturer not found")
                .build();
        }
        
        Spool spool = new Spool();
        spool.filamentType = filamentType;
        spool.color = color;
        spool.manufacturer = manufacturer;
        
        // Handle location - prefer new system, fallback to legacy
        if (dto.storageLocationId() != null) {
            Location storageLocation = Location.findById(dto.storageLocationId());
            if (storageLocation == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Storage location not found")
                    .build();
            }
            spool.storageLocation = storageLocation;
            spool.legacyLocation = null;
        } else if (dto.location() != null) {
            spool.legacyLocation = dto.location();
            spool.storageLocation = null;
        }
        spool.locationDetails = dto.locationDetails();
        spool.initialWeightGrams = dto.initialWeightGrams();
        spool.currentWeightGrams = dto.currentWeightGrams() != null 
            ? dto.currentWeightGrams() 
            : dto.initialWeightGrams();
        spool.purchaseDate = dto.purchaseDate();
        spool.openedDate = dto.openedDate();
        spool.purchasePrice = dto.purchasePrice();
        spool.purchaseCurrency = dto.purchaseCurrency();
        spool.notes = dto.notes();
        spool.colorNumber = dto.colorNumber();
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
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        if (dto.filamentTypeId() != null) {
            FilamentType filamentType = FilamentType.findById(dto.filamentTypeId());
            if (filamentType == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Filament type not found")
                    .build();
            }
            spool.filamentType = filamentType;
        }
        
        if (dto.colorId() != null) {
            FilamentColor color = FilamentColor.findById(dto.colorId());
            if (color == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Color not found")
                    .build();
            }
            spool.color = color;
        }
        
        if (dto.manufacturerId() != null) {
            Manufacturer manufacturer = Manufacturer.findById(dto.manufacturerId());
            if (manufacturer == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Manufacturer not found")
                    .build();
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
            spool.locationDetails = dto.locationDetails();
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
            spool.notes = dto.notes();
        }
        if (dto.isEmpty() != null) {
            spool.isEmpty = dto.isEmpty();
        }
        if (dto.colorNumber() != null) {
            spool.colorNumber = dto.colorNumber();
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
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Storage location not found")
                    .build();
            }
            spool.storageLocation = storageLocation;
            spool.legacyLocation = null;
            spool.locationDetails = null;
        } else if (location != null) {
            spool.legacyLocation = location;
            spool.storageLocation = null;
        }
        
        if (details != null) {
            spool.locationDetails = details;
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
            return Response.status(Response.Status.NOT_FOUND).build();
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
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        if (!spool.isEmpty) {
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
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
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
            "SELECT s.filamentType.material.name, COUNT(s) FROM Spool s WHERE s.isEmpty = false GROUP BY s.filamentType.material.name"
        ).project(Object[].class).list();
        
        return Response.ok(stats.stream()
            .map(row -> new MaterialStats((String) row[0], (Long) row[1]))
            .toList()
        ).build();
    }

    public record LocationStats(SpoolLocation location, Long count) {}
    public record MaterialStats(String material, Long count) {}
}

