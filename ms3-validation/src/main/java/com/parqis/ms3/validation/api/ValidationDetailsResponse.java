package com.parqis.ms3.validation.api;

import com.parqis.ms3.validation.domain.ValidationDirection;
import com.parqis.ms3.validation.domain.ValidationStatus;

import java.time.Instant;
import java.util.UUID;

public record ValidationDetailsResponse(
        UUID validationId,
        String plateNumber,
        String parkingLotId,
        ValidationDirection direction,
        ValidationStatus status,
        String reason,
        Instant createdAt
) {
}
