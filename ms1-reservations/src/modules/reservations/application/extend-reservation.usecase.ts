import { ExtendReservationDto } from '../../../models/dto/reservation.dto';
import { ReservationRepository } from '../infrastructure/reservation.repository.prisma';
import { KafkaEventsPublisher } from '../../../shared/infrastructure/messaging/kafka-events.publisher';
import { AppError } from '../../../app/http/middlewares/error.middleware';
import { logger } from '../../../shared/observability/logger';
import { GetReservationUseCase } from './get-reservation.usecase';
import { validateExtensionTime } from '../domain/reservation-policy';

export class ExtendReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly kafkaPublisher: KafkaEventsPublisher,
    private readonly getReservationUseCase: GetReservationUseCase
  ) {}

  async execute(id: string, userId: string, data: ExtendReservationDto): Promise<any> {
    const reservation = await this.getReservationUseCase.execute(id, userId);

    const newEndTime = new Date(data.newEndTime);
    validateExtensionTime(reservation.endTime, newEndTime);

    const hasOverlap = await this.reservationRepository.hasOverlap(
      reservation.parkingLotId,
      reservation.endTime,
      newEndTime,
      id
    );

    if (hasOverlap) {
      throw new AppError(409, 'Cannot extend: time slot is already booked');
    }

    const updated = await this.reservationRepository.extend(id, newEndTime);

    logger.info('Reservation extended', {
      reservationId: id,
      userId,
      newEndTime: newEndTime.toISOString(),
    });

    try {
      await this.kafkaPublisher.publishReservationExtended(updated);
    } catch (error) {
      logger.error('Failed to publish reservation extended event', { error });
    }

    return updated;
  }
}
