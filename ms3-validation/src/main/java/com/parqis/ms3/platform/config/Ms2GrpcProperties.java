package com.parqis.ms3.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ms2")
public record Ms2GrpcProperties(String host, int port) {
}
