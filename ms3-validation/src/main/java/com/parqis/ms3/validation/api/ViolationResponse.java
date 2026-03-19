package com.parqis.ms3.validation.api;

import com.parqis.ms3.validation.domain.ValidationDirection;

import java.time.Instant;
import java.util.UUID;

public record ViolationResponse(
        UUID validationId,
        String plateNumber,
        String parkingLotId,
        ValidationDirection direction,
        String reason,
        Instant createdAt
) {
}
