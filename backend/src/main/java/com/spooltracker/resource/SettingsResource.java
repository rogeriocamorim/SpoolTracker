package com.spooltracker.resource;

import com.spooltracker.dto.SettingsDTO;
import com.spooltracker.service.SettingsService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * REST resource for managing application settings.
 * Provides endpoints to retrieve and update application-wide settings such as
 * default weight, currency, and low stock thresholds.
 * 
 * @see SettingsService
 * @see SettingsDTO
 */
@Path("/api/settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@jakarta.enterprise.context.RequestScoped
public class SettingsResource {

    @Inject
    SettingsService settingsService;

    /**
     * Retrieves the current application settings.
     * 
     * @return Response containing the current settings as a SettingsDTO
     */
    @GET
    @Transactional
    public Response get() {
        SettingsDTO dto = settingsService.getSettingsDTO();
        return Response.ok(dto).build();
    }

    /**
     * Updates the application settings.
     * Only provided fields will be updated; null fields are ignored.
     * 
     * @param dto The settings DTO containing the values to update
     * @return Response containing the updated settings as a SettingsDTO
     */
    @PUT
    @Transactional
    public Response update(@Valid SettingsDTO dto) {
        SettingsDTO response = settingsService.updateSettings(dto);
        return Response.ok(response).build();
    }
}

