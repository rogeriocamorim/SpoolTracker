package com.spooltracker.resource;

import com.spooltracker.dto.FilamentColorDTO;
import com.spooltracker.dto.FilamentTypeDTO;
import com.spooltracker.entity.FilamentColor;
import com.spooltracker.entity.FilamentType;
import com.spooltracker.entity.Manufacturer;
import com.spooltracker.entity.Material;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/filament-types")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FilamentTypeResource {

    @GET
    public List<FilamentTypeDTO> getAll(
        @QueryParam("materialId") Long materialId,
        @QueryParam("manufacturerId") Long manufacturerId
    ) {
        List<FilamentType> types;
        
        if (materialId != null && manufacturerId != null) {
            types = FilamentType.findByMaterialAndManufacturer(materialId, manufacturerId);
        } else if (materialId != null) {
            types = FilamentType.findByMaterial(materialId);
        } else if (manufacturerId != null) {
            types = FilamentType.findByManufacturer(manufacturerId);
        } else {
            types = FilamentType.listAll();
        }
        
        return types.stream()
            .map(FilamentTypeDTO::from)
            .toList();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        FilamentType type = FilamentType.findById(id);
        if (type == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(FilamentTypeDTO.from(type)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid FilamentTypeDTO dto) {
        Material material = Material.findById(dto.materialId());
        if (material == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Material not found")
                .build();
        }
        
        Manufacturer manufacturer = Manufacturer.findById(dto.manufacturerId());
        if (manufacturer == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Manufacturer not found")
                .build();
        }
        
        FilamentType type = new FilamentType();
        type.name = dto.name();
        type.description = dto.description();
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
        
        type.name = dto.name();
        type.description = dto.description();
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
            return Response.status(Response.Status.CONFLICT)
                .entity("Cannot delete filament type with existing spools")
                .build();
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
            return Response.status(Response.Status.NOT_FOUND).build();
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
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        FilamentColor color = new FilamentColor();
        color.name = dto.name();
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
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Filament type not found")
                .build();
        }
        
        FilamentColor color = FilamentColor.findById(colorId);
        if (color == null || !color.filamentType.id.equals(typeId)) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Color not found")
                .build();
        }
        
        color.name = dto.name();
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
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Filament type not found")
                .build();
        }
        
        FilamentColor color = FilamentColor.findById(colorId);
        if (color == null || !color.filamentType.id.equals(typeId)) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Color not found")
                .build();
        }
        
        if (color.spools != null && !color.spools.isEmpty()) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Cannot delete color with existing spools")
                .build();
        }
        
        color.delete();
        return Response.noContent().build();
    }
}

