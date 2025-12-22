package com.spooltracker.resource;

import com.spooltracker.dto.ManufacturerDTO;
import com.spooltracker.entity.Manufacturer;
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

@Path("/api/manufacturers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ManufacturerResource {

    @Context
    UriInfo uriInfo;

    @GET
    public List<ManufacturerDTO> getAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("pageSize") @DefaultValue("100") int pageSize
    ) {
        io.quarkus.panache.common.Page panachePage = io.quarkus.panache.common.Page.of(page, pageSize);
        return Manufacturer.<Manufacturer>findAll()
            .page(panachePage)
            .stream()
            .map(ManufacturerDTO::from)
            .toList();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        Manufacturer manufacturer = Manufacturer.findById(id);
        if (manufacturer == null) {
            return ResponseHelper.notFound("Manufacturer not found", uriInfo);
        }
        return Response.ok(ManufacturerDTO.from(manufacturer)).build();
    }

    @POST
    @Transactional
    public Response create(@Valid ManufacturerDTO dto) {
        if (Manufacturer.findByName(dto.name()) != null) {
            return ResponseHelper.conflict("Manufacturer with this name already exists", uriInfo);
        }
        Manufacturer manufacturer = dto.toEntity();
        manufacturer.name = Sanitizer.sanitize(manufacturer.name);
        manufacturer.description = Sanitizer.sanitizeWithLineBreaks(manufacturer.description);
        manufacturer.website = Sanitizer.sanitizeUrl(manufacturer.website);
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
            return ResponseHelper.notFound("Manufacturer not found", uriInfo);
        }
        
        Manufacturer existing = Manufacturer.findByName(dto.name());
        if (existing != null && !existing.id.equals(id)) {
            return ResponseHelper.conflict("Another manufacturer with this name already exists", uriInfo);
        }
        
        // Sanitize input before updating
        manufacturer.name = Sanitizer.sanitize(dto.name());
        manufacturer.description = Sanitizer.sanitizeWithLineBreaks(dto.description());
        manufacturer.website = Sanitizer.sanitizeUrl(dto.website());
        manufacturer.logoUrl = Sanitizer.sanitizeUrl(dto.logoUrl());
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
            return ResponseHelper.conflict("Cannot delete manufacturer with existing spools", uriInfo);
        }
        
        manufacturer.delete();
        return Response.noContent().build();
    }
}

