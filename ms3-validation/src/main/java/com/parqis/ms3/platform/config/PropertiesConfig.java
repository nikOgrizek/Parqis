package com.parqis.ms3.platform.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        AppSecurityProperties.class,
        Ms2GrpcProperties.class,
        AppKafkaProperties.class
})
public class PropertiesConfig {
}
