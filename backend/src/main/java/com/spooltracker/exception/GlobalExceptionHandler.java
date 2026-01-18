package com.spooltracker.exception;

import com.spooltracker.dto.ErrorResponse;
import jakarta.persistence.PersistenceException;
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
        
        LOG.errorf(exception, "Unhandled exception at path: %s - Type: %s - Message: %s", 
            path, exception.getClass().getName(), exception.getMessage());

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
        
        // Handle JPA/Hibernate persistence exceptions
        if (exception instanceof PersistenceException) {
            return handlePersistenceException((PersistenceException) exception, path);
        }
        
        // Check for Hibernate constraint violation wrapped in other exceptions
        Throwable cause = exception.getCause();
        while (cause != null) {
            if (cause instanceof org.hibernate.exception.ConstraintViolationException) {
                return handleHibernateConstraintViolation(
                    (org.hibernate.exception.ConstraintViolationException) cause, path);
            }
            if (cause instanceof ConstraintViolationException) {
                return handleConstraintViolationException((ConstraintViolationException) cause, path);
            }
            cause = cause.getCause();
        }

        // Generic exception handler - include more details for debugging
        String errorMessage = exception.getMessage() != null 
            ? "Error: " + exception.getMessage()
            : "An unexpected error occurred";
        
        return Response
            .status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(new ErrorResponse(
                errorMessage,
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
    
    private Response handlePersistenceException(PersistenceException exception, String path) {
        String message = "Database operation failed";
        Throwable cause = exception.getCause();
        
        if (cause != null) {
            if (cause instanceof org.hibernate.exception.ConstraintViolationException) {
                return handleHibernateConstraintViolation(
                    (org.hibernate.exception.ConstraintViolationException) cause, path);
            }
            message = cause.getMessage() != null ? cause.getMessage() : message;
        }
        
        LOG.errorf(exception, "PersistenceException at path: %s - Message: %s", path, message);
        
        return Response
            .status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse(
                message,
                "DATABASE_ERROR",
                Response.Status.BAD_REQUEST.getStatusCode(),
                path
            ))
            .type(MediaType.APPLICATION_JSON)
            .build();
    }
    
    private Response handleHibernateConstraintViolation(
            org.hibernate.exception.ConstraintViolationException exception, String path) {
        String constraintName = exception.getConstraintName();
        String message = "Database constraint violation";
        
        if (constraintName != null) {
            String lowerConstraint = constraintName.toLowerCase();
            if (lowerConstraint.contains("unique") || lowerConstraint.contains("duplicate")) {
                message = "A record with this value already exists";
            } else if (lowerConstraint.contains("foreign")) {
                message = "Referenced record does not exist";
            } else if (lowerConstraint.contains("not_null") || lowerConstraint.contains("notnull")) {
                message = "Required field is missing";
            } else if (lowerConstraint.contains("primary")) {
                message = "A record with this ID already exists";
            }
        }
        
        // Also check the exception message for MariaDB/MySQL specific error patterns
        String exMsg = exception.getMessage() != null ? exception.getMessage().toLowerCase() : "";
        if (exMsg.contains("duplicate entry") || exMsg.contains("duplicate key")) {
            message = "A record with this value already exists";
        }
        
        LOG.errorf(exception, "Hibernate ConstraintViolationException at path: %s - Constraint: %s", 
            path, constraintName);
        
        return Response
            .status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse(
                message,
                "CONSTRAINT_VIOLATION",
                Response.Status.BAD_REQUEST.getStatusCode(),
                path
            ))
            .type(MediaType.APPLICATION_JSON)
            .build();
    }
}

