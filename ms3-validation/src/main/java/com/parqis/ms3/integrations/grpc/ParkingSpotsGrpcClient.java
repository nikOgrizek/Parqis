package com.parqis.ms3.integrations.grpc;

import com.parqis.ms3.platform.config.Ms2GrpcProperties;
import com.parqis.ms3.integrations.proto.AvailabilityRequest;
import com.parqis.ms3.integrations.proto.AvailabilityResponse;
import com.parqis.ms3.integrations.proto.ParkingSpotServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class ParkingSpotsGrpcClient {

    private final Ms2GrpcProperties grpcProperties;
    private ManagedChannel channel;
    private ParkingSpotServiceGrpc.ParkingSpotServiceBlockingStub stub;

    public ParkingSpotsGrpcClient(Ms2GrpcProperties grpcProperties) {
        this.grpcProperties = grpcProperties;
    }

    @PostConstruct
    void initialize() {
        channel = ManagedChannelBuilder
                .forAddress(grpcProperties.host(), grpcProperties.port())
                .usePlaintext()
                .build();
        stub = ParkingSpotServiceGrpc.newBlockingStub(channel);
    }

    @PreDestroy
    void shutdown() throws InterruptedException {
        if (channel != null) {
            channel.shutdown().awaitTermination(2, TimeUnit.SECONDS);
        }
    }

    public AvailabilityResponse checkAvailability(String parkingLotId) {
        AvailabilityRequest request = AvailabilityRequest.newBuilder().setParkingLotId(parkingLotId).build();
        return stub.checkAvailability(request);
    }
}
