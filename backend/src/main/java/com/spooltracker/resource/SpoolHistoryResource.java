package com.spooltracker.resource;

import com.spooltracker.entity.Spool;
import com.spooltracker.entity.SpoolHistory;
import com.spooltracker.util.ResponseHelper;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/spools/{id}/history")
@Produces(MediaType.APPLICATION_JSON)
public class SpoolHistoryResource {

    @Context
    UriInfo uriInfo;

    @GET
    public Response getSpoolHistory(@PathParam("id") Long spoolId) {
        Spool spool = Spool.findById(spoolId);
        if (spool == null) {
            return ResponseHelper.notFound("Spool not found", uriInfo);
        }

        List<SpoolHistory> history = SpoolHistory.findBySpoolOrderByCreatedAtDesc(spoolId);
        
        // Convert to DTO-like structure
        List<HistoryEntry> entries = history.stream()
            .map(h -> new HistoryEntry(
                h.id,
                h.action,
                h.description,
                h.oldValue,
                h.newValue,
                h.createdAt
            ))
            .collect(Collectors.toList());

        return Response.ok(entries).build();
    }

    public record HistoryEntry(
        Long id,
        String action,
        String description,
        String oldValue,
        String newValue,
        java.time.LocalDateTime createdAt
    ) {}
}

