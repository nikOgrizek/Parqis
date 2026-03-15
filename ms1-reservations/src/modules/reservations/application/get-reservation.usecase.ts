import { ReservationRepository } from '../infrastructure/reservation.repository.prisma';
import { AppError } from '../../../app/http/middlewares/error.middleware';

export class GetReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(id: string, userId?: string): Promise<any> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new AppError(404, 'Reservation not found');
    }

    if (userId && reservation.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return reservation;
  }
}
