package com.spooltracker.service;

import com.spooltracker.entity.Spool;
import com.spooltracker.entity.SpoolHistory;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@ApplicationScoped
public class SpoolHistoryService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void recordLocationChange(Spool spool, String oldLocation, String newLocation) {
        SpoolHistory history = new SpoolHistory();
        history.spool = spool;
        history.action = "LOCATION_CHANGED";
        history.description = String.format("Location changed from %s to %s", oldLocation, newLocation);
        try {
            history.oldValue = objectMapper.writeValueAsString(Map.of("location", oldLocation));
            history.newValue = objectMapper.writeValueAsString(Map.of("location", newLocation));
        } catch (Exception e) {
            history.oldValue = oldLocation;
            history.newValue = newLocation;
        }
        history.persist();
    }

    @Transactional
    public void recordWeightUpdate(Spool spool, Double oldWeight, Double newWeight) {
        SpoolHistory history = new SpoolHistory();
        history.spool = spool;
        history.action = "WEIGHT_UPDATED";
        history.description = String.format("Weight updated from %.2fg to %.2fg", 
            oldWeight != null ? oldWeight : 0.0, 
            newWeight != null ? newWeight : 0.0);
        try {
            history.oldValue = objectMapper.writeValueAsString(Map.of("currentWeightGrams", oldWeight));
            history.newValue = objectMapper.writeValueAsString(Map.of("currentWeightGrams", newWeight));
        } catch (Exception e) {
            history.oldValue = String.valueOf(oldWeight);
            history.newValue = String.valueOf(newWeight);
        }
        history.persist();
    }

    @Transactional
    public void recordMarkedEmpty(Spool spool) {
        SpoolHistory history = new SpoolHistory();
        history.spool = spool;
        history.action = "MARKED_EMPTY";
        history.description = "Spool marked as empty";
        history.newValue = "{\"isEmpty\": true}";
        history.persist();
    }

    @Transactional
    public void recordSpoolUpdate(Spool spool, String field, Object oldValue, Object newValue) {
        SpoolHistory history = new SpoolHistory();
        history.spool = spool;
        history.action = "FIELD_UPDATED";
        history.description = String.format("%s updated", field);
        try {
            history.oldValue = objectMapper.writeValueAsString(Map.of(field, oldValue));
            history.newValue = objectMapper.writeValueAsString(Map.of(field, newValue));
        } catch (Exception e) {
            history.oldValue = String.valueOf(oldValue);
            history.newValue = String.valueOf(newValue);
        }
        history.persist();
    }

    @Transactional
    public void recordSpoolCreated(Spool spool) {
        SpoolHistory history = new SpoolHistory();
        history.spool = spool;
        history.action = "SPOOL_CREATED";
        history.description = "Spool created";
        try {
            history.newValue = objectMapper.writeValueAsString(Map.of(
                "uid", spool.uid,
                "color", spool.color != null ? spool.color.name : null,
                "filamentType", spool.filamentType != null ? spool.filamentType.name : null
            ));
        } catch (Exception e) {
            history.newValue = "Spool created";
        }
        history.persist();
    }
}

