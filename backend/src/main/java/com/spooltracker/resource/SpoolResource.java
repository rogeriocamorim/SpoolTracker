package com.spooltracker.resource;

import java.time.LocalDate;
import java.util.List;

import com.spooltracker.dto.CreateSpoolDTO;
import com.spooltracker.dto.SpoolDTO;
import com.spooltracker.dto.UpdateSpoolDTO;
import com.spooltracker.entity.FilamentColor;
import com.spooltracker.entity.FilamentType;
import com.spooltracker.entity.Location;
import com.spooltracker.entity.Manufacturer;
import com.spooltracker.entity.Spool;
import com.spooltracker.entity.SpoolLocation;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
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

    @GET
    public List<SpoolDTO> getAll(
        @QueryParam("location") SpoolLocation location,
        @QueryParam("storageLocationId") Long storageLocationId,
        @QueryParam("manufacturerId") Long manufacturerId,
        @QueryParam("filamentTypeId") Long filamentTypeId,
        @QueryParam("colorId") Long colorId,
        @QueryParam("isEmpty") Boolean isEmpty,
        @QueryParam("colorNumber") String colorNumber
    ) {
        List<Spool> spools;
        
        if (colorNumber != null && !colorNumber.trim().isEmpty()) {
            spools = Spool.findByColorNumber(colorNumber.trim());
        } else if (storageLocationId != null) {
            spools = Spool.findByStorageLocation(storageLocationId);
        } else if (location != null) {
            spools = Spool.findByLegacyLocation(location);
        } else if (manufacturerId != null) {
            spools = Spool.findByManufacturer(manufacturerId);
        } else if (filamentTypeId != null) {
            spools = Spool.findByFilamentType(filamentTypeId);
        } else if (colorId != null) {
            spools = Spool.findByColor(colorId);
        } else if (isEmpty != null) {
            spools = isEmpty ? Spool.findEmpty() : Spool.findActive();
        } else {
            spools = Spool.listAll();
        }
        
        return spools.stream()
            .map(SpoolDTO::from)
            .toList();
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
        if (dto.initialWeightGrams() != null) {
            spool.initialWeightGrams = dto.initialWeightGrams();
        }
        if (dto.currentWeightGrams() != null) {
            spool.currentWeightGrams = dto.currentWeightGrams();
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
            spool.currentWeightGrams = weight;
            spool.lastUsedDate = LocalDate.now();
            
            // Auto-mark as empty if weight is very low
            if (weight < 50) {
                spool.isEmpty = true;
            }
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
        
        spool.isEmpty = true;
        spool.currentWeightGrams = 0.0;
        spool.legacyLocation = SpoolLocation.EMPTY;
        spool.storageLocation = null;
        
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
        List<Object[]> stats = Spool.find("SELECT s.location, COUNT(s) FROM Spool s WHERE s.isEmpty = false GROUP BY s.location")
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

