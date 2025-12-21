package com.spooltracker.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.logging.Level;
import java.util.logging.LogRecord;

/**
 * Structured logging utility for SpoolTracker
 * Provides JSON-like structured logging for better log analysis
 */
public class Logger {
    private static final java.util.logging.Logger logger = java.util.logging.Logger.getLogger("SpoolTracker");
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static void info(String message) {
        log(Level.INFO, message, null);
    }

    public static void info(String message, Object... args) {
        log(Level.INFO, String.format(message, args), null);
    }

    public static void warn(String message) {
        log(Level.WARNING, message, null);
    }

    public static void warn(String message, Object... args) {
        log(Level.WARNING, String.format(message, args), null);
    }

    public static void error(String message) {
        log(Level.SEVERE, message, null);
    }

    public static void error(String message, Throwable throwable) {
        log(Level.SEVERE, message, throwable);
    }

    public static void error(String message, Throwable throwable, Object... args) {
        log(Level.SEVERE, String.format(message, args), throwable);
    }

    public static void debug(String message) {
        log(Level.FINE, message, null);
    }

    public static void debug(String message, Object... args) {
        log(Level.FINE, String.format(message, args), null);
    }

    private static void log(Level level, String message, Throwable throwable) {
        String timestamp = LocalDateTime.now().format(formatter);
        String structuredMessage = String.format(
            "[%s] [%s] %s",
            timestamp,
            level.getName(),
            message
        );

        LogRecord record = new LogRecord(level, structuredMessage);
        if (throwable != null) {
            record.setThrown(throwable);
        }
        logger.log(record);
    }

    /**
     * Log structured data as JSON-like string
     */
    public static void logStructured(String action, String resource, Object data) {
        String json = String.format(
            "{\"action\":\"%s\",\"resource\":\"%s\",\"data\":%s,\"timestamp\":\"%s\"}",
            action,
            resource,
            data != null ? data.toString() : "null",
            LocalDateTime.now().format(formatter)
        );
        logger.info(json);
    }
}

