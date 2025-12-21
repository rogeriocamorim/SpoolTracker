package com.spooltracker.entity;

public enum SpoolLocation {
    AMS("AMS"),
    PRINTER("Printer"),
    RACK("Rack"),
    STORAGE("Storage"),
    IN_USE("In Use"),
    EMPTY("Empty");

    private final String displayName;

    SpoolLocation(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

