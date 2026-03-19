package com.parqis.ms3.validation.api;

import java.util.UUID;

public record ValidationResponse(
        UUID validationId,
        boolean access,
        boolean barrierOpen,
        String reason
) {
}
