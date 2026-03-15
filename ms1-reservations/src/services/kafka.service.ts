import { Producer } from 'kafkajs';
import { kafkaConfig } from '../config/kafka';
import { logger } from '../utils/logger';

export interface KafkaEvent {
  eventType: string;
  timestamp: string;
  payload: any;
}

export class KafkaService {
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

  /**
   * Publish event to Kafka topic
   */
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

  /**
   * Publish reservation created event
   */
  async publishReservationCreated(reservation: any): Promise<void> {
    const event: KafkaEvent = {
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
    };

    await this.publishEvent('reservations', event);
  }

  /**
   * Publish reservation extended event
   */
  async publishReservationExtended(reservation: any): Promise<void> {
    const event: KafkaEvent = {
      eventType: 'reservation.extended',
      timestamp: new Date().toISOString(),
      payload: {
        reservationId: reservation.id,
        userId: reservation.userId,
        plateNumber: reservation.plateNumber,
        parkingLotId: reservation.parkingLotId,
        newEndTime: reservation.endTime.toISOString(),
      },
    };

    await this.publishEvent('reservations', event);
  }

  /**
   * Publish reservation cancelled event
   */
  async publishReservationCancelled(reservation: any): Promise<void> {
    const event: KafkaEvent = {
      eventType: 'reservation.cancelled',
      timestamp: new Date().toISOString(),
      payload: {
        reservationId: reservation.id,
        userId: reservation.userId,
        plateNumber: reservation.plateNumber,
        parkingLotId: reservation.parkingLotId,
        spotId: reservation.spotId,
      },
    };

    await this.publishEvent('reservations', event);
  }

  /**
   * Publish reservation completed event
   */
  async publishReservationCompleted(reservation: any): Promise<void> {
    const event: KafkaEvent = {
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
    };

    await this.publishEvent('reservations', event);
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    await kafkaConfig.disconnect();
    logger.info('Kafka service disconnected');
  }
}
