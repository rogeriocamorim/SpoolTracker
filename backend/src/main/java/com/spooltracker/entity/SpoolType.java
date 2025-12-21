package com.spooltracker.entity;

/**
 * Spool type enum - determines the physical spool construction
 */
public enum SpoolType {
    PLASTIC,    // Standard reusable plastic spool
    REFILL,     // Refill without spool (cardboard or no spool)
    CARDBOARD   // Cardboard spool
}

