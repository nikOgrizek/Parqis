package com.parqis.ms3.integrations.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parqis.ms3.platform.config.AppKafkaProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class ParkingEventsPublisher {

    private static final Logger LOGGER = LoggerFactory.getLogger(ParkingEventsPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final AppKafkaProperties kafkaProperties;

    public ParkingEventsPublisher(KafkaTemplate<String, String> kafkaTemplate,
                                  ObjectMapper objectMapper,
                                  AppKafkaProperties kafkaProperties) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.kafkaProperties = kafkaProperties;
    }

    public void publishParkingEvent(String eventType, Map<String, Object> payload) {
        Map<String, Object> event = Map.of(
                "eventType", eventType,
                "timestamp", Instant.now().toString(),
                "payload", payload
        );

        try {
            String body = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(kafkaProperties.parkingEventsTopic(), eventType, body);
            LOGGER.info("Published event type={}", eventType);
        } catch (JsonProcessingException ex) {
            LOGGER.error("Failed to serialize Kafka event type={}", eventType, ex);
        }
    }
}
