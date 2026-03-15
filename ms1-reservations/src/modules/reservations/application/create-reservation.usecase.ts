import { CreateReservationDto } from '../../../models/dto/reservation.dto';
import { ReservationRepository } from '../infrastructure/reservation.repository.prisma';
import { UserRepository } from '../../auth/infrastructure/user.repository.prisma';
import { KafkaEventsPublisher } from '../../../shared/infrastructure/messaging/kafka-events.publisher';
import { AppError } from '../../../app/http/middlewares/error.middleware';
import { logger } from '../../../shared/observability/logger';
import { validateReservationTimes } from '../domain/reservation-policy';

export class CreateReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly userRepository: UserRepository,
    private readonly kafkaPublisher: KafkaEventsPublisher
  ) {}

  async execute(userId: string, data: CreateReservationDto): Promise<any> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    validateReservationTimes(startTime, endTime);

    const hasOverlap = await this.reservationRepository.hasOverlap(data.parkingLotId, startTime, endTime);
    if (hasOverlap) {
      throw new AppError(409, 'Parking lot is fully booked for this time slot');
    }

    const vehicle = await this.userRepository.getOrCreateVehicle(userId, data.plateNumber);

    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalCost = Math.ceil(hours) * 2;

    const reservation = await this.reservationRepository.create({
      userId,
      vehicleId: vehicle.id,
      parkingLotId: data.parkingLotId,
      plateNumber: data.plateNumber,
      startTime,
      endTime,
      totalCost,
    });

    logger.info('Reservation created', {
      reservationId: reservation.id,
      userId,
      plateNumber: data.plateNumber,
    });

    try {
      await this.kafkaPublisher.publishReservationCreated(reservation);
    } catch (error) {
      logger.error('Failed to publish reservation created event', { error });
    }

    return reservation;
  }
}
