package com.parqis.ms3.integrations.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ReservationsEventsListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReservationsEventsListener.class);

    @KafkaListener(topics = "${app.kafka.reservations-topic}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeReservationEvent(String eventPayload) {
        LOGGER.info("Received reservation event payload={}", eventPayload);
    }
}
