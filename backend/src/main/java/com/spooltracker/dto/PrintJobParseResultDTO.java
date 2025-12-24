package com.spooltracker.dto;

import java.util.List;

/**
 * DTO representing the parsed result of a 3MF file
 */
public record PrintJobParseResultDTO(
    String fileName,
    String printerModel,
    int estimatedTimeSeconds,
    double totalWeightGrams,
    boolean usesSupport,
    List<FilamentMatchDTO> filaments
) {}

