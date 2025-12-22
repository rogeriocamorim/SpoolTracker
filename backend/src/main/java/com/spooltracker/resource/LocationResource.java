package com.spooltracker.resource;

import com.spooltracker.dto.LocationDTO;
import com.spooltracker.dto.SpoolDTO;
import com.spooltracker.entity.Location;
import com.spooltracker.entity.Spool;
import com.spooltracker.util.ResponseHelper;
import com.spooltracker.util.Sanitizer;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

import java.util.List;

@Path("/api/locations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LocationResource {

    @Context
    UriInfo uriInfo;

    @GET
    public List<LocationDTO> getAll(
            @QueryParam("type") String locationType,
            @QueryParam("parentId") Long parentId,
            @QueryParam("activeOnly") @DefaultValue("true") boolean activeOnly,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("pageSize") @DefaultValue("100") int pageSize
    ) {
        io.quarkus.panache.common.Page panachePage = io.quarkus.panache.common.Page.of(page, pageSize);
        List<Location> locations;
        
        // Build query with proper parameter binding
        if (parentId != null) {
            String query = "parent.id = ?1";
            if (activeOnly) {
                query += " and isActive = true";
            }
            query += " order by sortOrder, name";
            locations = Location.find(query, parentId)
                .page(panachePage)
                .list();
        } else if (locationType != null) {
            String query = "locationType = ?1";
            if (activeOnly) {
                query += " and isActive = true";
            }
            query += " order by sortOrder, name";
            locations = Location.find(query, locationType)
                .page(panachePage)
                .list();
        } else if (activeOnly) {
            locations = Location.find("isActive = true order by sortOrder, name")
                .page(panachePage)
                .list();
        } else {
            locations = Location.findAll()
                .page(panachePage)
                .list();
        }
        
        return locations.stream().map(LocationDTO::from).toList();
    }

    @GET
    @Path("/tree")
    public List<LocationDTO> getTree() {
        // Get root locations with their children
        List<Location> rootLocations = Location.findRootLocations();
        return rootLocations.stream().map(LocationDTO::fromWithChildren).toList();
    }

    @GET
    @Path("/types")
    public List<String> getLocationTypes() {
        // Return distinct location types
        return Location.find("select distinct locationType from Location where locationType is not null order by locationType")
                .project(String.class)
                .list();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            return ResponseHelper.notFound("Location not found", uriInfo);
        }
        return Response.ok(LocationDTO.fromWithChildren(location)).build();
    }

    @GET
    @Path("/{id}/spools")
    public Response getSpoolsAtLocation(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            return ResponseHelper.notFound("Location not found", uriInfo);
        }
        
        List<Spool> spools = Spool.findByStorageLocation(id);
        return Response.ok(spools.stream().map(SpoolDTO::from).toList()).build();
    }

    @POST
    @Transactional
    public Response create(@Valid LocationDTO dto) {
        Location location = new Location();
        updateLocationFromDTO(location, dto);
        location.persist();
        return Response.status(Response.Status.CREATED)
                .entity(LocationDTO.from(location))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, @Valid LocationDTO dto) {
        Location location = Location.findById(id);
        if (location == null) {
            return ResponseHelper.notFound("Location not found", uriInfo);
        }
        updateLocationFromDTO(location, dto);
        return Response.ok(LocationDTO.from(location)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            return ResponseHelper.notFound("Location not found", uriInfo);
        }
        
        // Check if there are spools at this location
        long spoolCount = location.getSpoolCount();
        if (spoolCount > 0) {
            return ResponseHelper.badRequest("Cannot delete location with " + spoolCount + " spool(s). Move or delete spools first.", uriInfo);
        }
        
        // Check if there are child locations
        if (location.children != null && !location.children.isEmpty()) {
            return ResponseHelper.badRequest("Cannot delete location with child locations. Delete or move children first.", uriInfo);
        }
        
        location.delete();
        return Response.noContent().build();
    }

    @PATCH
    @Path("/{id}/deactivate")
    @Transactional
    public Response deactivate(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            return ResponseHelper.notFound("Location not found", uriInfo);
        }
        location.isActive = false;
        return Response.ok(LocationDTO.from(location)).build();
    }

    @PATCH
    @Path("/{id}/activate")
    @Transactional
    public Response activate(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            return ResponseHelper.notFound("Location not found", uriInfo);
        }
        location.isActive = true;
        return Response.ok(LocationDTO.from(location)).build();
    }

    // Move a spool to this location
    @POST
    @Path("/{id}/spools/{spoolId}")
    @Transactional
    public Response moveSpoolToLocation(
            @PathParam("id") Long locationId,
            @PathParam("spoolId") Long spoolId
    ) {
        Location location = Location.findById(locationId);
        if (location == null) {
            return ResponseHelper.notFound("Location not found", uriInfo);
        }
        
        Spool spool = Spool.findById(spoolId);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }
        
        // Check capacity
        if (!location.hasCapacity()) {
            return ResponseHelper.badRequest("Location is at full capacity (" + location.capacity + " spools)", uriInfo);
        }
        
        spool.storageLocation = location;
        spool.legacyLocation = null; // Clear legacy location
        spool.locationDetails = null; // Clear old details
        
        return Response.ok(SpoolDTO.from(spool)).build();
    }

    private void updateLocationFromDTO(Location location, LocationDTO dto) {
        location.name = Sanitizer.sanitize(dto.name());
        location.description = Sanitizer.sanitizeWithLineBreaks(dto.description());
        location.locationType = dto.locationType();
        
        // Auto-set capacity based on location type
        Integer autoCapacity = getCapacityForType(dto.locationType());
        if (autoCapacity != null) {
            // For AMS types, enforce 4 spots; for single-spot types, enforce 1 spot
            location.capacity = autoCapacity;
        } else {
            // For other types, use provided capacity or null (unlimited)
            location.capacity = dto.capacity();
        }
        
        location.icon = dto.icon();
        location.color = dto.color();
        location.sortOrder = dto.sortOrder() != null ? dto.sortOrder() : 0;
        location.isActive = dto.isActive() != null ? dto.isActive() : true;
        
        if (dto.parentId() != null) {
            Location parent = Location.findById(dto.parentId());
            if (parent == null) {
                throw new jakarta.ws.rs.BadRequestException("Parent location not found");
            }
            location.parent = parent;
        } else {
            location.parent = null;
        }
    }
    
    /**
     * Get capacity based on location type.
     * AMS, AMS 2 Pro, AMS Little: 4 spots
     * Printer Spool, AMS HT: 1 spot
     * Others: null (unlimited)
     */
    private Integer getCapacityForType(String locationType) {
        if (locationType == null) {
            return null;
        }
        
        // AMS types: 4 spots
        if ("AMS".equals(locationType) || 
            "AMS_2_PRO".equals(locationType) || 
            "AMS_LITTLE".equals(locationType)) {
            return 4;
        }
        
        // Single spot types
        if ("PRINTER_SPOOL".equals(locationType) || 
            "AMS_HT".equals(locationType)) {
            return 1;
        }
        
        // Other types: unlimited
        return null;
    }
}

