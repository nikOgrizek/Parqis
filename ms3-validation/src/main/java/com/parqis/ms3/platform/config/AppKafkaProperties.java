package com.parqis.ms3.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.kafka")
public record AppKafkaProperties(String parkingEventsTopic, String reservationsTopic) {
}
