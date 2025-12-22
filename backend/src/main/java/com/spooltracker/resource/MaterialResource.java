package com.spooltracker.resource;

import com.spooltracker.dto.MaterialDTO;
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

@Path("/api/materials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MaterialResource {

    @Context
    UriInfo uriInfo;

    @GET
    public List<MaterialDTO> getAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("pageSize") @DefaultValue("100") int pageSize
    ) {
        io.quarkus.panache.common.Page panachePage = io.quarkus.panache.common.Page.of(page, pageSize);
        return Material.<Material>findAll()
            .page(panachePage)
            .stream()
            .map(MaterialDTO::from)
            .toList();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        Material material = Material.findById(id);
        if (material == null) {
            return ResponseHelper.notFound("Material not found", uriInfo);
        }
        return Response.ok(MaterialDTO.from(material)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid MaterialDTO dto) {
        if (Material.findByName(dto.name()) != null) {
            return ResponseHelper.conflict("Material with this name already exists", uriInfo);
        }
        Material material = dto.toEntity();
        material.name = Sanitizer.sanitize(material.name);
        material.description = Sanitizer.sanitizeWithLineBreaks(material.description);
        material.persist();
        return Response.status(Response.Status.CREATED)
            .entity(MaterialDTO.from(material))
            .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, @Valid MaterialDTO dto) {
        Material material = Material.findById(id);
        if (material == null) {
            return ResponseHelper.notFound("Material not found", uriInfo);
        }
        
        Material existing = Material.findByName(dto.name());
        if (existing != null && !existing.id.equals(id)) {
            return ResponseHelper.conflict("Another material with this name already exists", uriInfo);
        }
        
        // Sanitize input before updating
        material.name = Sanitizer.sanitize(dto.name());
        material.description = Sanitizer.sanitizeWithLineBreaks(dto.description());
        material.minNozzleTemp = dto.minNozzleTemp();
        material.maxNozzleTemp = dto.maxNozzleTemp();
        material.minBedTemp = dto.minBedTemp();
        material.maxBedTemp = dto.maxBedTemp();
        material.requiresEnclosure = dto.requiresEnclosure();
        material.requiresDryBox = dto.requiresDryBox();
        return Response.ok(MaterialDTO.from(material)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Material material = Material.findById(id);
        if (material == null) {
            return ResponseHelper.notFound("Material not found", uriInfo);
        }
        
        if (!material.filamentTypes.isEmpty()) {
            return ResponseHelper.conflict("Cannot delete material with existing filament types", uriInfo);
        }
        
        material.delete();
        return Response.noContent().build();
    }
}

