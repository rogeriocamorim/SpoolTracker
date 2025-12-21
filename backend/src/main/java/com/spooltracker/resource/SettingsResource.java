package com.spooltracker.resource;

import com.spooltracker.dto.SettingsDTO;
import com.spooltracker.entity.Settings;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SettingsResource {

    @GET
    @Transactional
    public Response get() {
        Settings settings = Settings.getInstance();
        SettingsDTO dto = new SettingsDTO(
            settings.defaultWeightGrams,
            settings.defaultCurrency,
            settings.lowStockThreshold
        );
        return Response.ok(dto).build();
    }

    @PUT
    @Transactional
    public Response update(@Valid SettingsDTO dto) {
        Settings settings = Settings.getInstance();
        
        if (dto.defaultWeightGrams != null) {
            settings.defaultWeightGrams = dto.defaultWeightGrams;
        }
        if (dto.defaultCurrency != null) {
            settings.defaultCurrency = dto.defaultCurrency;
        }
        if (dto.lowStockThreshold != null) {
            settings.lowStockThreshold = dto.lowStockThreshold;
        }
        
        SettingsDTO response = new SettingsDTO(
            settings.defaultWeightGrams,
            settings.defaultCurrency,
            settings.lowStockThreshold
        );
        return Response.ok(response).build();
    }
}

