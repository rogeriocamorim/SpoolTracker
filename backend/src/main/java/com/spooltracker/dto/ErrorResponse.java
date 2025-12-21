package com.spooltracker.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ErrorResponse(
    String message,
    String code,
    int status,
    LocalDateTime timestamp,
    String path,
    List<ValidationError> validationErrors,
    Map<String, Object> details
) {
    public ErrorResponse(String message, String code, int status, String path) {
        this(message, code, status, LocalDateTime.now(), path, null, null);
    }

    public ErrorResponse(String message, int status, String path) {
        this(message, null, status, LocalDateTime.now(), path, null, null);
    }

    public ErrorResponse(String message, int status, String path, List<ValidationError> validationErrors) {
        this(message, "VALIDATION_ERROR", status, LocalDateTime.now(), path, validationErrors, null);
    }

    public record ValidationError(
        String field,
        String message,
        Object rejectedValue
    ) {}
}

