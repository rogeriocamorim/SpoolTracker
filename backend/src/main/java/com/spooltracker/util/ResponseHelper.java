package com.spooltracker.util;

import com.spooltracker.dto.ErrorResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

/**
 * Utility class for creating standardized error responses.
 */
public class ResponseHelper {

    /**
     * Creates a standardized BAD_REQUEST error response.
     */
    public static Response badRequest(String message, UriInfo uriInfo) {
        String path = uriInfo != null ? uriInfo.getPath() : "unknown";
        return Response.status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse(message, "BAD_REQUEST", Response.Status.BAD_REQUEST.getStatusCode(), path))
            .build();
    }

    /**
     * Creates a standardized NOT_FOUND error response.
     */
    public static Response notFound(String message, UriInfo uriInfo) {
        String path = uriInfo != null ? uriInfo.getPath() : "unknown";
        return Response.status(Response.Status.NOT_FOUND)
            .entity(new ErrorResponse(message, "NOT_FOUND", Response.Status.NOT_FOUND.getStatusCode(), path))
            .build();
    }

    /**
     * Creates a standardized CONFLICT error response.
     */
    public static Response conflict(String message, UriInfo uriInfo) {
        String path = uriInfo != null ? uriInfo.getPath() : "unknown";
        return Response.status(Response.Status.CONFLICT)
            .entity(new ErrorResponse(message, "CONFLICT", Response.Status.CONFLICT.getStatusCode(), path))
            .build();
    }

    /**
     * Creates a standardized INTERNAL_SERVER_ERROR response.
     */
    public static Response internalServerError(String message, UriInfo uriInfo) {
        String path = uriInfo != null ? uriInfo.getPath() : "unknown";
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(new ErrorResponse(message, "INTERNAL_SERVER_ERROR", Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), path))
            .build();
    }
}

