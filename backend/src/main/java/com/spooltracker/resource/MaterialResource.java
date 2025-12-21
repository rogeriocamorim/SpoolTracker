package com.spooltracker.resource;

import com.spooltracker.dto.MaterialDTO;
import com.spooltracker.entity.Material;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/materials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MaterialResource {

    @GET
    public List<MaterialDTO> getAll() {
        return Material.<Material>listAll()
            .stream()
            .map(MaterialDTO::from)
            .toList();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        Material material = Material.findById(id);
        if (material == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(MaterialDTO.from(material)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid MaterialDTO dto) {
        if (Material.findByName(dto.name()) != null) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Material with this name already exists")
                .build();
        }
        Material material = dto.toEntity();
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
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        Material existing = Material.findByName(dto.name());
        if (existing != null && !existing.id.equals(id)) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Another material with this name already exists")
                .build();
        }
        
        dto.updateEntity(material);
        return Response.ok(MaterialDTO.from(material)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Material material = Material.findById(id);
        if (material == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        if (!material.filamentTypes.isEmpty()) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Cannot delete material with existing filament types")
                .build();
        }
        
        material.delete();
        return Response.noContent().build();
    }
}

