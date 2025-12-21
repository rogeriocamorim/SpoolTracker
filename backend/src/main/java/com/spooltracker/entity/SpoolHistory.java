package com.spooltracker.entity;

import java.time.LocalDateTime;
import java.util.List;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(
    name = "spool_history",
    indexes = {
        @Index(name = "idx_spool_history_spool", columnList = "spool_id")
    }
)
public class SpoolHistory extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spool_id", nullable = false)
    public Spool spool;

    @Column(nullable = false)
    public String action; // "LOCATION_CHANGED", "WEIGHT_UPDATED", "MARKED_EMPTY", etc.

    @Column(length = 1000)
    public String description;

    // Old values (JSON string for flexibility)
    @Column(columnDefinition = "TEXT")
    public String oldValue;

    // New values (JSON string for flexibility)
    @Column(columnDefinition = "TEXT")
    public String newValue;

    @Column(nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static List<SpoolHistory> findBySpool(Long spoolId) {
        return list("spool.id", spoolId);
    }

    public static List<SpoolHistory> findBySpoolOrderByCreatedAtDesc(Long spoolId) {
        return list("spool.id = ?1 order by createdAt desc", spoolId);
    }
}

