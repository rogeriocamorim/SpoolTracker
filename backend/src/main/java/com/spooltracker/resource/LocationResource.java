package com.spooltracker.resource;

import com.spooltracker.dto.LocationDTO;
import com.spooltracker.dto.SpoolDTO;
import com.spooltracker.entity.Location;
import com.spooltracker.entity.Spool;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/locations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LocationResource {

    @GET
    public List<LocationDTO> getAll(
            @QueryParam("type") String locationType,
            @QueryParam("parentId") Long parentId,
            @QueryParam("activeOnly") @DefaultValue("true") boolean activeOnly
    ) {
        List<Location> locations;
        
        if (parentId != null) {
            locations = Location.list("parent.id = ?1" + (activeOnly ? " and isActive = true" : "") + " order by sortOrder, name", parentId);
        } else if (locationType != null) {
            locations = Location.list("locationType = ?1" + (activeOnly ? " and isActive = true" : "") + " order by sortOrder, name", locationType);
        } else if (activeOnly) {
            locations = Location.findActive();
        } else {
            locations = Location.listAll();
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
    public LocationDTO getById(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            throw new NotFoundException("Location not found");
        }
        return LocationDTO.fromWithChildren(location);
    }

    @GET
    @Path("/{id}/spools")
    public List<SpoolDTO> getSpoolsAtLocation(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            throw new NotFoundException("Location not found");
        }
        
        List<Spool> spools = Spool.findByStorageLocation(id);
        return spools.stream().map(SpoolDTO::from).toList();
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
    public LocationDTO update(@PathParam("id") Long id, @Valid LocationDTO dto) {
        Location location = Location.findById(id);
        if (location == null) {
            throw new NotFoundException("Location not found");
        }
        updateLocationFromDTO(location, dto);
        return LocationDTO.from(location);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            throw new NotFoundException("Location not found");
        }
        
        // Check if there are spools at this location
        long spoolCount = location.getSpoolCount();
        if (spoolCount > 0) {
            throw new BadRequestException("Cannot delete location with " + spoolCount + " spool(s). Move or delete spools first.");
        }
        
        // Check if there are child locations
        if (location.children != null && !location.children.isEmpty()) {
            throw new BadRequestException("Cannot delete location with child locations. Delete or move children first.");
        }
        
        location.delete();
        return Response.noContent().build();
    }

    @PATCH
    @Path("/{id}/deactivate")
    @Transactional
    public LocationDTO deactivate(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            throw new NotFoundException("Location not found");
        }
        location.isActive = false;
        return LocationDTO.from(location);
    }

    @PATCH
    @Path("/{id}/activate")
    @Transactional
    public LocationDTO activate(@PathParam("id") Long id) {
        Location location = Location.findById(id);
        if (location == null) {
            throw new NotFoundException("Location not found");
        }
        location.isActive = true;
        return LocationDTO.from(location);
    }

    // Move a spool to this location
    @POST
    @Path("/{id}/spools/{spoolId}")
    @Transactional
    public SpoolDTO moveSpoolToLocation(
            @PathParam("id") Long locationId,
            @PathParam("spoolId") Long spoolId
    ) {
        Location location = Location.findById(locationId);
        if (location == null) {
            throw new NotFoundException("Location not found");
        }
        
        Spool spool = Spool.findById(spoolId);
        if (spool == null) {
            throw new NotFoundException("Spool not found");
        }
        
        // Check capacity
        if (!location.hasCapacity()) {
            throw new BadRequestException("Location is at full capacity (" + location.capacity + " spools)");
        }
        
        spool.storageLocation = location;
        spool.legacyLocation = null; // Clear legacy location
        spool.locationDetails = null; // Clear old details
        
        return SpoolDTO.from(spool);
    }

    private void updateLocationFromDTO(Location location, LocationDTO dto) {
        location.name = dto.name();
        location.description = dto.description();
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
                throw new BadRequestException("Parent location not found");
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

