import { CreateReservationDto, ExtendReservationDto } from '../../../models/dto/reservation.dto';
import { ReservationRepository } from '../infrastructure/reservation.repository.prisma';
import { UserRepository } from '../../auth/infrastructure/user.repository.prisma';
import { KafkaEventsPublisher } from '../../../shared/infrastructure/messaging/kafka-events.publisher';
import { CreateReservationUseCase } from './create-reservation.usecase';
import { GetReservationUseCase } from './get-reservation.usecase';
import { ExtendReservationUseCase } from './extend-reservation.usecase';
import { CancelReservationUseCase } from './cancel-reservation.usecase';
import { CompleteReservationUseCase } from './complete-reservation.usecase';
import { AppError } from '../../../app/http/middlewares/error.middleware';
import { logger } from '../../../shared/observability/logger';

export class ReservationsService {
  private readonly reservationRepository: ReservationRepository;
  private readonly userRepository: UserRepository;
  private readonly kafkaService: KafkaEventsPublisher;
  private readonly createUseCase: CreateReservationUseCase;
  private readonly getUseCase: GetReservationUseCase;
  private readonly extendUseCase: ExtendReservationUseCase;
  private readonly cancelUseCase: CancelReservationUseCase;
  private readonly completeUseCase: CompleteReservationUseCase;

  constructor() {
    this.reservationRepository = new ReservationRepository();
    const userRepository = new UserRepository();
    this.userRepository = userRepository;
    void this.userRepository;
    const kafkaPublisher = new KafkaEventsPublisher();
    this.kafkaService = kafkaPublisher;
    void this.kafkaService;

    this.getUseCase = new GetReservationUseCase(this.reservationRepository);
    this.createUseCase = new CreateReservationUseCase(this.reservationRepository, userRepository, kafkaPublisher);
    this.extendUseCase = new ExtendReservationUseCase(this.reservationRepository, kafkaPublisher, this.getUseCase);
    this.cancelUseCase = new CancelReservationUseCase(this.reservationRepository, kafkaPublisher, this.getUseCase);
    this.completeUseCase = new CompleteReservationUseCase(this.reservationRepository, kafkaPublisher);
  }

  async createReservation(userId: string, data: CreateReservationDto): Promise<any> {
    return this.createUseCase.execute(userId, data);
  }

  async getReservation(id: string, userId?: string): Promise<any> {
    return this.getUseCase.execute(id, userId);
  }

  async getReservationByPlateNumber(plateNumber: string): Promise<any> {
    return this.reservationRepository.findActiveByPlateNumber(plateNumber.toUpperCase());
  }

  async getUserReservations(userId: string): Promise<any[]> {
    return this.reservationRepository.findByUserId(userId);
  }

  async extendReservation(id: string, userId: string, data: ExtendReservationDto): Promise<any> {
    return this.extendUseCase.execute(id, userId, data);
  }

  async cancelReservation(id: string, userId: string): Promise<any> {
    return this.cancelUseCase.execute(id, userId);
  }

  async completeReservation(id: string): Promise<any> {
    return this.completeUseCase.execute(id);
  }

  async activateReservation(id: string): Promise<any> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new AppError(404, 'Reservation not found');
    }

    if (reservation.status !== 'PENDING') {
      throw new AppError(400, 'Reservation is not in pending status');
    }

    const updated = await this.reservationRepository.markAsActive(id);
    logger.info('Reservation activated', { reservationId: id });
    return updated;
  }

  async cleanupExpiredReservations(): Promise<number> {
    const count = await this.reservationRepository.markExpired();
    logger.info('Expired reservations marked', { count });
    return count;
  }
}
