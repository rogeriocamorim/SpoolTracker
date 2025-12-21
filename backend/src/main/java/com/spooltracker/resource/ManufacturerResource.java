package com.spooltracker.resource;

import com.spooltracker.dto.ManufacturerDTO;
import com.spooltracker.entity.Manufacturer;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/manufacturers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ManufacturerResource {

    @GET
    public List<ManufacturerDTO> getAll() {
        return Manufacturer.<Manufacturer>listAll()
            .stream()
            .map(ManufacturerDTO::from)
            .toList();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        Manufacturer manufacturer = Manufacturer.findById(id);
        if (manufacturer == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(ManufacturerDTO.from(manufacturer)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid ManufacturerDTO dto) {
        if (Manufacturer.findByName(dto.name()) != null) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Manufacturer with this name already exists")
                .build();
        }
        Manufacturer manufacturer = dto.toEntity();
        manufacturer.persist();
        return Response.status(Response.Status.CREATED)
            .entity(ManufacturerDTO.from(manufacturer))
            .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, @Valid ManufacturerDTO dto) {
        Manufacturer manufacturer = Manufacturer.findById(id);
        if (manufacturer == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        Manufacturer existing = Manufacturer.findByName(dto.name());
        if (existing != null && !existing.id.equals(id)) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Another manufacturer with this name already exists")
                .build();
        }
        
        dto.updateEntity(manufacturer);
        return Response.ok(ManufacturerDTO.from(manufacturer)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Manufacturer manufacturer = Manufacturer.findById(id);
        if (manufacturer == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        if (!manufacturer.spools.isEmpty()) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Cannot delete manufacturer with existing spools")
                .build();
        }
        
        manufacturer.delete();
        return Response.noContent().build();
    }
}

