package com.parqis.ms3.validation.application;

import com.parqis.ms3.integrations.grpc.ParkingSpotsGrpcClient;
import com.parqis.ms3.integrations.kafka.ParkingEventsPublisher;
import com.parqis.ms3.validation.api.ValidationDetailsResponse;
import com.parqis.ms3.validation.api.ValidationResponse;
import com.parqis.ms3.validation.api.ViolationResponse;
import com.parqis.ms3.validation.domain.ValidationDirection;
import com.parqis.ms3.validation.domain.ValidationLog;
import com.parqis.ms3.validation.domain.ValidationStatus;
import com.parqis.ms3.validation.infrastructure.ValidationLogRepository;
import io.grpc.StatusRuntimeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ValidationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ValidationService.class);

    private final ValidationLogRepository validationLogRepository;
    private final ParkingSpotsGrpcClient parkingSpotsGrpcClient;
    private final ParkingEventsPublisher parkingEventsPublisher;

    public ValidationService(ValidationLogRepository validationLogRepository,
                             ParkingSpotsGrpcClient parkingSpotsGrpcClient,
                             ParkingEventsPublisher parkingEventsPublisher) {
        this.validationLogRepository = validationLogRepository;
        this.parkingSpotsGrpcClient = parkingSpotsGrpcClient;
        this.parkingEventsPublisher = parkingEventsPublisher;
    }

    public ValidationResponse validateEntry(String plateNumber, String parkingLotId) {
        try {
            var availability = parkingSpotsGrpcClient.checkAvailability(parkingLotId);
            boolean granted = availability.getHasAvailability();
            String reason = granted ? "Access granted" : "No available spots";

            ValidationLog log = saveValidation(plateNumber, parkingLotId, ValidationDirection.ENTRY,
                    granted ? ValidationStatus.GRANTED : ValidationStatus.DENIED, reason);

            if (granted) {
                parkingEventsPublisher.publishParkingEvent("parking.started", Map.of(
                        "validationId", log.getId().toString(),
                        "plateNumber", plateNumber,
                        "parkingLotId", parkingLotId
                ));
            } else {
                parkingEventsPublisher.publishParkingEvent("parking.violation", Map.of(
                        "validationId", log.getId().toString(),
                        "plateNumber", plateNumber,
                        "parkingLotId", parkingLotId,
                        "reason", reason
                ));
            }

            return new ValidationResponse(log.getId(), granted, granted, reason);
        } catch (StatusRuntimeException ex) {
            LOGGER.error("gRPC availability check failed for lot={}", parkingLotId, ex);
            ValidationLog log = saveValidation(plateNumber, parkingLotId, ValidationDirection.ENTRY,
                    ValidationStatus.DENIED, "Parking availability service unavailable");
            return new ValidationResponse(log.getId(), false, false, log.getReason());
        }
    }

    public ValidationResponse validateExit(String plateNumber, String parkingLotId) {
        ValidationLog log = saveValidation(plateNumber, parkingLotId, ValidationDirection.EXIT,
                ValidationStatus.GRANTED, "Exit granted");

        parkingEventsPublisher.publishParkingEvent("parking.completed", Map.of(
                "validationId", log.getId().toString(),
                "plateNumber", plateNumber,
                "parkingLotId", parkingLotId
        ));

        return new ValidationResponse(log.getId(), true, true, log.getReason());
    }

    public ValidationDetailsResponse getValidation(UUID id) {
        ValidationLog log = validationLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Validation not found"));

        return new ValidationDetailsResponse(
                log.getId(),
                log.getPlateNumber(),
                log.getParkingLotId(),
                log.getDirection(),
                log.getStatus(),
                log.getReason(),
                log.getCreatedAt()
        );
    }

    public List<ViolationResponse> getViolations() {
        return validationLogRepository.findByStatusOrderByCreatedAtDesc(ValidationStatus.DENIED)
                .stream()
                .map(log -> new ViolationResponse(
                        log.getId(),
                        log.getPlateNumber(),
                        log.getParkingLotId(),
                        log.getDirection(),
                        log.getReason(),
                        log.getCreatedAt()))
                .toList();
    }

    private ValidationLog saveValidation(String plateNumber,
                                         String parkingLotId,
                                         ValidationDirection direction,
                                         ValidationStatus status,
                                         String reason) {
        ValidationLog log = new ValidationLog();
        log.setPlateNumber(plateNumber);
        log.setParkingLotId(parkingLotId);
        log.setDirection(direction);
        log.setStatus(status);
        log.setReason(reason);
        return validationLogRepository.save(log);
    }
}
