package com.spooltracker.resource;

import com.spooltracker.dto.FilamentColorDTO;
import com.spooltracker.dto.FilamentTypeDTO;
import com.spooltracker.entity.FilamentColor;
import com.spooltracker.entity.FilamentType;
import com.spooltracker.entity.Manufacturer;
import com.spooltracker.entity.Material;
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

@Path("/api/filament-types")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FilamentTypeResource {

    @Context
    UriInfo uriInfo;

    @GET
    public List<FilamentTypeDTO> getAll(
        @QueryParam("materialId") Long materialId,
        @QueryParam("manufacturerId") Long manufacturerId,
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("pageSize") @DefaultValue("100") int pageSize
    ) {
        io.quarkus.panache.common.Page panachePage = io.quarkus.panache.common.Page.of(page, pageSize);
        List<FilamentType> types;
        
        if (materialId != null && manufacturerId != null) {
            // Use find with pagination
            types = FilamentType.find("material.id = ?1 and manufacturer.id = ?2", materialId, manufacturerId)
                .page(panachePage)
                .list();
        } else if (materialId != null) {
            types = FilamentType.find("material.id = ?1", materialId)
                .page(panachePage)
                .list();
        } else if (manufacturerId != null) {
            types = FilamentType.find("manufacturer.id = ?1", manufacturerId)
                .page(panachePage)
                .list();
        } else {
            types = FilamentType.findAll()
                .page(panachePage)
                .list();
        }
        
        return types.stream()
            .map(FilamentTypeDTO::fromWithoutColors)
            .toList();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        FilamentType type = FilamentType.findById(id);
        if (type == null) {
            return ResponseHelper.notFound("Filament type not found", uriInfo);
        }
        return Response.ok(FilamentTypeDTO.from(type)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid FilamentTypeDTO dto) {
        Material material = Material.findById(dto.materialId());
        if (material == null) {
            return ResponseHelper.badRequest("Material not found", uriInfo);
        }
        
        Manufacturer manufacturer = Manufacturer.findById(dto.manufacturerId());
        if (manufacturer == null) {
            return ResponseHelper.badRequest("Manufacturer not found", uriInfo);
        }
        
        FilamentType type = new FilamentType();
        type.name = Sanitizer.sanitize(dto.name());
        type.description = Sanitizer.sanitizeWithLineBreaks(dto.description());
        type.material = material;
        type.manufacturer = manufacturer;
        type.minNozzleTemp = dto.minNozzleTemp();
        type.maxNozzleTemp = dto.maxNozzleTemp();
        type.minBedTemp = dto.minBedTemp();
        type.maxBedTemp = dto.maxBedTemp();
        type.persist();
        
        return Response.status(Response.Status.CREATED)
            .entity(FilamentTypeDTO.from(type))
            .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, @Valid FilamentTypeDTO dto) {
        FilamentType type = FilamentType.findById(id);
        if (type == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        if (dto.materialId() != null) {
            Material material = Material.findById(dto.materialId());
            if (material == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Material not found")
                    .build();
            }
            type.material = material;
        }
        
        if (dto.manufacturerId() != null) {
            Manufacturer manufacturer = Manufacturer.findById(dto.manufacturerId());
            if (manufacturer == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Manufacturer not found")
                    .build();
            }
            type.manufacturer = manufacturer;
        }
        
        type.name = Sanitizer.sanitize(dto.name());
        type.description = Sanitizer.sanitizeWithLineBreaks(dto.description());
        type.minNozzleTemp = dto.minNozzleTemp();
        type.maxNozzleTemp = dto.maxNozzleTemp();
        type.minBedTemp = dto.minBedTemp();
        type.maxBedTemp = dto.maxBedTemp();
        
        return Response.ok(FilamentTypeDTO.from(type)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        FilamentType type = FilamentType.findById(id);
        if (type == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        if (!type.spools.isEmpty()) {
            return ResponseHelper.conflict("Cannot delete filament type with existing spools", uriInfo);
        }
        
        type.delete();
        return Response.noContent().build();
    }

    // Color management endpoints
    @GET
    @Path("/{id}/colors")
    public Response getColors(@PathParam("id") Long id) {
        FilamentType type = FilamentType.findById(id);
        if (type == null) {
            return ResponseHelper.notFound("Filament type not found", uriInfo);
        }
        
        List<FilamentColorDTO> colors = type.colors.stream()
            .map(FilamentColorDTO::from)
            .toList();
        
        return Response.ok(colors).build();
    }

    @POST
    @Path("/{id}/colors")
    @Transactional
    public Response addColor(@PathParam("id") Long id, @Valid FilamentColorDTO dto) {
        FilamentType type = FilamentType.findById(id);
        if (type == null) {
            return ResponseHelper.notFound("Filament type not found", uriInfo);
        }
        
        FilamentColor color = new FilamentColor();
        color.name = Sanitizer.sanitize(dto.name());
        color.hexCode = dto.hexCode().toUpperCase();
        color.filamentType = type;
        color.persist();
        
        return Response.status(Response.Status.CREATED)
            .entity(FilamentColorDTO.from(color))
            .build();
    }

    @PUT
    @Path("/{typeId}/colors/{colorId}")
    @Transactional
    public Response updateColor(
        @PathParam("typeId") Long typeId,
        @PathParam("colorId") Long colorId,
        @Valid FilamentColorDTO dto
    ) {
        FilamentType type = FilamentType.findById(typeId);
        if (type == null) {
            return ResponseHelper.notFound("Filament type not found", uriInfo);
        }
        
        FilamentColor color = FilamentColor.findById(colorId);
        if (color == null || color.filamentType == null || !color.filamentType.id.equals(typeId)) {
            return ResponseHelper.notFound("Color not found", uriInfo);
        }
        
        color.name = Sanitizer.sanitize(dto.name());
        color.hexCode = dto.hexCode().toUpperCase();
        
        return Response.ok(FilamentColorDTO.from(color)).build();
    }

    @DELETE
    @Path("/{typeId}/colors/{colorId}")
    @Transactional
    public Response deleteColor(
        @PathParam("typeId") Long typeId,
        @PathParam("colorId") Long colorId
    ) {
        FilamentType type = FilamentType.findById(typeId);
        if (type == null) {
            return ResponseHelper.notFound("Filament type not found", uriInfo);
        }
        
        FilamentColor color = FilamentColor.findById(colorId);
        if (color == null || color.filamentType == null || !color.filamentType.id.equals(typeId)) {
            return ResponseHelper.notFound("Color not found", uriInfo);
        }
        
        if (color.spools != null && !color.spools.isEmpty()) {
            return ResponseHelper.conflict("Cannot delete color with existing spools", uriInfo);
        }
        
        color.delete();
        return Response.noContent().build();
    }
}

