import { ReservationRepository } from '../infrastructure/reservation.repository.prisma';
import { KafkaEventsPublisher } from '../../../shared/infrastructure/messaging/kafka-events.publisher';
import { AppError } from '../../../app/http/middlewares/error.middleware';
import { logger } from '../../../shared/observability/logger';
import { GetReservationUseCase } from './get-reservation.usecase';

export class CancelReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly kafkaPublisher: KafkaEventsPublisher,
    private readonly getReservationUseCase: GetReservationUseCase
  ) {}

  async execute(id: string, userId: string): Promise<any> {
    const reservation = await this.getReservationUseCase.execute(id, userId);

    if (reservation.status === 'CANCELLED') {
      throw new AppError(400, 'Reservation is already cancelled');
    }

    if (reservation.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot cancel completed reservation');
    }

    if (reservation.status === 'ACTIVE') {
      throw new AppError(400, 'Cannot cancel active reservation (vehicle already entered)');
    }

    const updated = await this.reservationRepository.cancel(id);
    logger.info('Reservation cancelled', { reservationId: id, userId });

    try {
      await this.kafkaPublisher.publishReservationCancelled(updated);
    } catch (error) {
      logger.error('Failed to publish reservation cancelled event', { error });
    }

    return updated;
  }
}
