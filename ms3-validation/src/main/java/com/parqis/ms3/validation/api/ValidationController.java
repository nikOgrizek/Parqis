package com.parqis.ms3.validation.api;

import com.parqis.ms3.validation.application.ValidationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ValidationController {

    private final ValidationService validationService;

    public ValidationController(ValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping("/validate/entry")
    public ResponseEntity<ValidationResponse> validateEntry(@Valid @RequestBody ValidationRequest request) {
        return ResponseEntity.ok(validationService.validateEntry(request.plateNumber(), request.parkingLotId()));
    }

    @PostMapping("/validate/exit")
    public ResponseEntity<ValidationResponse> validateExit(@Valid @RequestBody ValidationRequest request) {
        return ResponseEntity.ok(validationService.validateExit(request.plateNumber(), request.parkingLotId()));
    }

    @GetMapping("/validations/{id}")
    public ResponseEntity<ValidationDetailsResponse> getValidation(@PathVariable UUID id) {
        return ResponseEntity.ok(validationService.getValidation(id));
    }

    @GetMapping("/violations")
    public ResponseEntity<List<ViolationResponse>> getViolations() {
        return ResponseEntity.ok(validationService.getViolations());
    }
}
