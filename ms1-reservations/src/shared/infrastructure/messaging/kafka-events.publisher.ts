import { Producer } from 'kafkajs';
import { kafkaConfig } from './kafka.config';
import { logger } from '../../observability/logger';

export interface KafkaEvent {
  eventType: string;
  timestamp: string;
  payload: any;
}

export class KafkaEventsPublisher {
  private producer: Producer | null = null;

  async initialize(): Promise<void> {
    try {
      this.producer = await kafkaConfig.getProducer();
      logger.info('Kafka service initialized');
    } catch (error) {
      logger.error('Failed to initialize Kafka service', { error });
      throw error;
    }
  }

  async publishEvent(topic: string, event: KafkaEvent): Promise<void> {
    if (!this.producer) {
      await this.initialize();
    }

    try {
      await this.producer!.send({
        topic,
        messages: [
          {
            key: event.eventType,
            value: JSON.stringify(event),
            timestamp: new Date(event.timestamp).getTime().toString(),
          },
        ],
      });

      logger.info('Event published to Kafka', {
        topic,
        eventType: event.eventType,
      });
    } catch (error) {
      logger.error('Failed to publish event to Kafka', {
        topic,
        eventType: event.eventType,
        error,
      });
      throw error;
    }
  }

  async publishReservationCreated(reservation: any): Promise<void> {
    await this.publishEvent('reservations', {
      eventType: 'reservation.created',
      timestamp: new Date().toISOString(),
      payload: {
        reservationId: reservation.id,
        userId: reservation.userId,
        plateNumber: reservation.plateNumber,
        parkingLotId: reservation.parkingLotId,
        spotId: reservation.spotId,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        totalCost: reservation.totalCost,
      },
    });
  }

  async publishReservationExtended(reservation: any): Promise<void> {
    await this.publishEvent('reservations', {
      eventType: 'reservation.extended',
      timestamp: new Date().toISOString(),
      payload: {
        reservationId: reservation.id,
        userId: reservation.userId,
        plateNumber: reservation.plateNumber,
        parkingLotId: reservation.parkingLotId,
        newEndTime: reservation.endTime.toISOString(),
      },
    });
  }

  async publishReservationCancelled(reservation: any): Promise<void> {
    await this.publishEvent('reservations', {
      eventType: 'reservation.cancelled',
      timestamp: new Date().toISOString(),
      payload: {
        reservationId: reservation.id,
        userId: reservation.userId,
        plateNumber: reservation.plateNumber,
        parkingLotId: reservation.parkingLotId,
        spotId: reservation.spotId,
      },
    });
  }

  async publishReservationCompleted(reservation: any): Promise<void> {
    await this.publishEvent('reservations', {
      eventType: 'reservation.completed',
      timestamp: new Date().toISOString(),
      payload: {
        reservationId: reservation.id,
        userId: reservation.userId,
        plateNumber: reservation.plateNumber,
        parkingLotId: reservation.parkingLotId,
        spotId: reservation.spotId,
        exitWindowEnd: reservation.exitWindowEnd?.toISOString(),
      },
    });
  }

  async disconnect(): Promise<void> {
    await kafkaConfig.disconnect();
    logger.info('Kafka service disconnected');
  }
}
