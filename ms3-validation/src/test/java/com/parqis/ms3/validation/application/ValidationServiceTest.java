package com.parqis.ms3.validation.application;

import com.parqis.ms3.integrations.grpc.ParkingSpotsGrpcClient;
import com.parqis.ms3.integrations.kafka.ParkingEventsPublisher;
import com.parqis.ms3.validation.domain.ValidationDirection;
import com.parqis.ms3.validation.domain.ValidationLog;
import com.parqis.ms3.validation.domain.ValidationStatus;
import com.parqis.ms3.validation.infrastructure.ValidationLogRepository;
import com.parqis.ms3.integrations.proto.AvailabilityResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ValidationServiceTest {

    @Mock
    private ValidationLogRepository validationLogRepository;

    @Mock
    private ParkingSpotsGrpcClient parkingSpotsGrpcClient;

    @Mock
    private ParkingEventsPublisher parkingEventsPublisher;

    private ValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new ValidationService(validationLogRepository, parkingSpotsGrpcClient, parkingEventsPublisher);
    }

    @Test
    void validateEntryPublishesParkingStartedWhenSpotAvailable() {
        when(parkingSpotsGrpcClient.checkAvailability("lot-1")).thenReturn(AvailabilityResponse.newBuilder()
                .setParkingLotId("lot-1")
                .setHasAvailability(true)
                .setAvailableSpots(5)
                .build());
        when(validationLogRepository.save(any())).thenAnswer(invocation -> {
            ValidationLog log = invocation.getArgument(0);
            log.setId(UUID.randomUUID());
            return log;
        });

        var response = validationService.validateEntry("LJ-XY-123", "lot-1");

        assertTrue(response.access());
        verify(parkingEventsPublisher).publishParkingEvent(eq("parking.started"), any());
    }

    @Test
    void validateExitPersistsExitValidation() {
        when(validationLogRepository.save(any())).thenAnswer(invocation -> {
            ValidationLog log = invocation.getArgument(0);
            log.setId(UUID.randomUUID());
            return log;
        });

        validationService.validateExit("MB-AA-001", "lot-2");

        ArgumentCaptor<ValidationLog> captor = ArgumentCaptor.forClass(ValidationLog.class);
        verify(validationLogRepository).save(captor.capture());
        assertEquals(ValidationDirection.EXIT, captor.getValue().getDirection());
        assertEquals(ValidationStatus.GRANTED, captor.getValue().getStatus());
    }

    @Test
    void getValidationReturnsPersistedEntry() {
        UUID validationId = UUID.randomUUID();
        ValidationLog log = new ValidationLog();
        log.setId(validationId);
        log.setPlateNumber("LJ-XY-123");
        log.setParkingLotId("lot-1");
        log.setDirection(ValidationDirection.ENTRY);
        log.setStatus(ValidationStatus.GRANTED);
        log.setReason("Access granted");

        when(validationLogRepository.findById(validationId)).thenReturn(Optional.of(log));

        var response = validationService.getValidation(validationId);

        assertEquals(validationId, response.validationId());
        assertEquals(ValidationStatus.GRANTED, response.status());
    }
}
