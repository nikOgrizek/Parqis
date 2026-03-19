package com.parqis.ms3.validation.api;

import jakarta.validation.constraints.NotBlank;

public record ValidationRequest(
        @NotBlank String plateNumber,
        @NotBlank String parkingLotId
) {
}
