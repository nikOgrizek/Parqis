import { ReservationRepository } from '../infrastructure/reservation.repository.prisma';
import { KafkaEventsPublisher } from '../../../shared/infrastructure/messaging/kafka-events.publisher';
import { AppError } from '../../../app/http/middlewares/error.middleware';
import { logger } from '../../../shared/observability/logger';

export class CompleteReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly kafkaPublisher: KafkaEventsPublisher
  ) {}

  async execute(id: string): Promise<any> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new AppError(404, 'Reservation not found');
    }

    const updated = await this.reservationRepository.markAsCompleted(id);
    logger.info('Reservation completed', { reservationId: id });

    try {
      await this.kafkaPublisher.publishReservationCompleted(updated);
    } catch (error) {
      logger.error('Failed to publish reservation completed event', { error });
    }

    return updated;
  }
}
