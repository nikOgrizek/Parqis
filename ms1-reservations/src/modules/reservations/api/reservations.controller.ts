import { Request, Response, NextFunction } from 'express';
import { ReservationsService } from '../application/reservations.service';
import { CreateReservationDto, ExtendReservationDto } from '../../../models/dto/reservation.dto';

export class ReservationsController {
  private reservationsService: ReservationsService;

  constructor() {
    this.reservationsService = new ReservationsService();
  }

  createReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const data: CreateReservationDto = req.body;
      const reservation = await this.reservationsService.createReservation(userId, data);

      res.status(201).json({
        message: 'Reservation created successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  getReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const reservation = await this.reservationsService.getReservation(id, userId);
      res.status(200).json({ data: reservation });
    } catch (error) {
      next(error);
    }
  };

  getReservationByPlate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { plateNumber } = req.params;
      const reservation = await this.reservationsService.getReservationByPlateNumber(plateNumber);

      if (!reservation) {
        res.status(404).json({
          message: 'No active reservation found for this plate number',
          data: null,
        });
        return;
      }

      res.status(200).json({ data: reservation });
    } catch (error) {
      next(error);
    }
  };

  getUserReservations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      if (req.user!.userId !== userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const reservations = await this.reservationsService.getUserReservations(userId);
      res.status(200).json({ data: reservations, count: reservations.length });
    } catch (error) {
      next(error);
    }
  };

  extendReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const data: ExtendReservationDto = req.body;
      const reservation = await this.reservationsService.extendReservation(id, userId, data);

      res.status(200).json({
        message: 'Reservation extended successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const reservation = await this.reservationsService.cancelReservation(id, userId);

      res.status(200).json({
        message: 'Reservation cancelled successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  completeReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reservation = await this.reservationsService.completeReservation(id);

      res.status(200).json({
        message: 'Reservation completed successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };
}
