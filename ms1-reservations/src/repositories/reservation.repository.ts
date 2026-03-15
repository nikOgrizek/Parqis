import { prisma } from '../config/database';
import { Reservation, ReservationStatus } from '@prisma/client';

export class ReservationRepository {
  /**
   * Create a new reservation
   */
  async create(data: {
    userId: string;
    vehicleId: string;
    parkingLotId: string;
    spotId?: string;
    plateNumber: string;
    startTime: Date;
    endTime: Date;
    totalCost?: number;
  }): Promise<Reservation> {
    return prisma.reservation.create({
      data: {
        ...data,
        status: ReservationStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vehicle: true,
      },
    });
  }

  /**
   * Find reservation by ID
   */
  async findById(id: string): Promise<Reservation | null> {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vehicle: true,
      },
    });
  }

  /**
   * Find active reservation by plate number
   */
  async findActiveByPlateNumber(plateNumber: string): Promise<Reservation | null> {
    return prisma.reservation.findFirst({
      where: {
        plateNumber,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.ACTIVE],
        },
        endTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vehicle: true,
      },
    });
  }

  /**
   * Find reservations by user ID
   */
  async findByUserId(userId: string, limit = 50): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        vehicle: true,
      },
    });
  }

  /**
   * Find reservations by parking lot
   */
  async findByParkingLot(parkingLotId: string, status?: ReservationStatus): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: {
        parkingLotId,
        ...(status && { status }),
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Update reservation
   */
  async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vehicle: true,
      },
    });
  }

  /**
   * Mark reservation as active (vehicle entered)
   */
  async markAsActive(id: string): Promise<Reservation> {
    return this.update(id, {
      status: ReservationStatus.ACTIVE,
      actualEntryTime: new Date(),
    });
  }

  /**
   * Mark reservation as completed
   */
  async markAsCompleted(id: string, exitWindowMinutes = 15): Promise<Reservation> {
    const now = new Date();
    const exitWindowEnd = new Date(now.getTime() + exitWindowMinutes * 60000);

    return this.update(id, {
      status: ReservationStatus.COMPLETED,
      actualExitTime: now,
      exitWindowEnd,
    });
  }

  /**
   * Cancel reservation
   */
  async cancel(id: string): Promise<Reservation> {
    return this.update(id, {
      status: ReservationStatus.CANCELLED,
    });
  }

  /**
   * Extend reservation
   */
  async extend(id: string, newEndTime: Date): Promise<Reservation> {
    return this.update(id, {
      endTime: newEndTime,
    });
  }

  /**
   * Delete reservation
   */
  async delete(id: string): Promise<Reservation> {
    return prisma.reservation.delete({
      where: { id },
    });
  }

  /**
   * Check for overlapping reservations
   */
  async hasOverlap(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    const count = await prisma.reservation.count({
      where: {
        parkingLotId,
        ...(excludeId && { id: { not: excludeId } }),
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.ACTIVE],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lte: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return count > 0;
  }

  /**
   * Find expired reservations
   */
  async findExpired(): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: {
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.ACTIVE],
        },
        endTime: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Mark expired reservations
   */
  async markExpired(): Promise<number> {
    const result = await prisma.reservation.updateMany({
      where: {
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.ACTIVE],
        },
        endTime: {
          lt: new Date(),
        },
      },
      data: {
        status: ReservationStatus.EXPIRED,
      },
    });

    return result.count;
  }
}
