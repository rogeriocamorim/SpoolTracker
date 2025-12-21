package com.spooltracker.exception;

import com.spooltracker.dto.ErrorResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.stream.Collectors;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionHandler.class);

    @Context
    UriInfo uriInfo;

    @Override
    public Response toResponse(Exception exception) {
        String path = uriInfo != null ? uriInfo.getPath() : "unknown";
        
        LOG.errorf(exception, "Unhandled exception at path: %s", path);

        if (exception instanceof NotFoundException) {
            return handleNotFoundException((NotFoundException) exception, path);
        }
        
        if (exception instanceof BadRequestException) {
            return handleBadRequestException((BadRequestException) exception, path);
        }
        
        if (exception instanceof ConstraintViolationException) {
            return handleConstraintViolationException((ConstraintViolationException) exception, path);
        }
        
        if (exception instanceof IllegalArgumentException) {
            return handleIllegalArgumentException((IllegalArgumentException) exception, path);
        }

        // Generic exception handler
        return Response
            .status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(new ErrorResponse(
                "An unexpected error occurred",
                "INTERNAL_SERVER_ERROR",
                Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
                path
            ))
            .type(MediaType.APPLICATION_JSON)
            .build();
    }

    private Response handleNotFoundException(NotFoundException exception, String path) {
        String message = exception.getMessage() != null && !exception.getMessage().isEmpty()
            ? exception.getMessage()
            : "Resource not found";
        
        return Response
            .status(Response.Status.NOT_FOUND)
            .entity(new ErrorResponse(message, "NOT_FOUND", Response.Status.NOT_FOUND.getStatusCode(), path))
            .type(MediaType.APPLICATION_JSON)
            .build();
    }

    private Response handleBadRequestException(BadRequestException exception, String path) {
        String message = exception.getMessage() != null && !exception.getMessage().isEmpty()
            ? exception.getMessage()
            : "Bad request";
        
        return Response
            .status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse(message, "BAD_REQUEST", Response.Status.BAD_REQUEST.getStatusCode(), path))
            .type(MediaType.APPLICATION_JSON)
            .build();
    }

    private Response handleConstraintViolationException(ConstraintViolationException exception, String path) {
        List<ErrorResponse.ValidationError> validationErrors = exception.getConstraintViolations()
            .stream()
            .map(this::mapConstraintViolation)
            .collect(Collectors.toList());

        return Response
            .status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse(
                "Validation failed",
                Response.Status.BAD_REQUEST.getStatusCode(),
                path,
                validationErrors
            ))
            .type(MediaType.APPLICATION_JSON)
            .build();
    }

    private Response handleIllegalArgumentException(IllegalArgumentException exception, String path) {
        return Response
            .status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse(
                exception.getMessage() != null ? exception.getMessage() : "Invalid argument",
                "INVALID_ARGUMENT",
                Response.Status.BAD_REQUEST.getStatusCode(),
                path
            ))
            .type(MediaType.APPLICATION_JSON)
            .build();
    }

    private ErrorResponse.ValidationError mapConstraintViolation(ConstraintViolation<?> violation) {
        String field = violation.getPropertyPath().toString();
        // Extract field name from property path (e.g., "create.name" -> "name")
        if (field.contains(".")) {
            field = field.substring(field.lastIndexOf('.') + 1);
        }
        
        return new ErrorResponse.ValidationError(
            field,
            violation.getMessage(),
            violation.getInvalidValue()
        );
    }
}

