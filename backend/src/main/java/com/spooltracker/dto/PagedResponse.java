package com.spooltracker.dto;

import java.util.List;

public record PagedResponse<T>(
    List<T> data,
    int page,
    int pageSize,
    long totalItems,
    int totalPages,
    boolean hasNext,
    boolean hasPrevious
) {
    public static <T> PagedResponse<T> of(List<T> data, int page, int pageSize, long totalItems) {
        int totalPages = (int) Math.ceil((double) totalItems / pageSize);
        return new PagedResponse<>(
            data,
            page,
            pageSize,
            totalItems,
            totalPages,
            page < totalPages - 1,
            page > 0
        );
    }
}

