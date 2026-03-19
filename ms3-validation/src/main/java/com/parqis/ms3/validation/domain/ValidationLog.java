package com.parqis.ms3.validation.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "validation_logs")
public class ValidationLog {

    @Id
    private UUID id;

    @Column(nullable = false, length = 32)
    private String plateNumber;

    @Column(nullable = false, length = 64)
    private String parkingLotId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ValidationDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ValidationStatus status;

    @Column(length = 255)
    private String reason;

    @Column(nullable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
    }

    public String getParkingLotId() {
        return parkingLotId;
    }

    public void setParkingLotId(String parkingLotId) {
        this.parkingLotId = parkingLotId;
    }

    public ValidationDirection getDirection() {
        return direction;
    }

    public void setDirection(ValidationDirection direction) {
        this.direction = direction;
    }

    public ValidationStatus getStatus() {
        return status;
    }

    public void setStatus(ValidationStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @PrePersist
    public void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
