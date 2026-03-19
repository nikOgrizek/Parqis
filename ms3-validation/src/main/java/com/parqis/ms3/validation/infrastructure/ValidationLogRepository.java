package com.parqis.ms3.validation.infrastructure;

import com.parqis.ms3.validation.domain.ValidationLog;
import com.parqis.ms3.validation.domain.ValidationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ValidationLogRepository extends JpaRepository<ValidationLog, UUID> {
    List<ValidationLog> findByStatusOrderByCreatedAtDesc(ValidationStatus status);
}
