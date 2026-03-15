import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { env } from './env';
import { logger } from '../utils/logger';

class KafkaConfig {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;

  constructor() {
    this.kafka = new Kafka({
      clientId: env.KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS,
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async getProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
      });
      await this.producer.connect();
      logger.info('Kafka producer connected');
    }
    return this.producer;
  }

  async getConsumer(): Promise<Consumer> {
    if (!this.consumer) {
      this.consumer = this.kafka.consumer({
        groupId: env.KAFKA_GROUP_ID,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });
      await this.consumer.connect();
      logger.info('Kafka consumer connected');
    }
    return this.consumer;
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      logger.info('Kafka producer disconnected');
    }
    if (this.consumer) {
      await this.consumer.disconnect();
      logger.info('Kafka consumer disconnected');
    }
  }
}

export const kafkaConfig = new KafkaConfig();
