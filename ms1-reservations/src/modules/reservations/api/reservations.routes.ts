import { Router } from 'express';
import { ReservationsController } from './reservations.controller';
import { authenticate, authenticateInternal } from '../../../app/http/middlewares/auth.middleware';
import { validate, schemas } from '../../../app/http/middlewares/validation.middleware';

const router = Router();
const reservationsController = new ReservationsController();

/**
 * @openapi
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 */
router.post('/', authenticate, validate(schemas.createReservation), reservationsController.createReservation);

/**
 * @openapi
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 */
router.get('/:id', authenticate, reservationsController.getReservation);

/**
 * @openapi
 * /api/reservations/plate/{plateNumber}:
 *   get:
 *     summary: Get active reservation by plate number (internal API)
 *     tags: [Reservations]
 */
router.get('/plate/:plateNumber', authenticateInternal, reservationsController.getReservationByPlate);

/**
 * @openapi
 * /api/reservations/user/{userId}:
 *   get:
 *     summary: Get user's reservations
 *     tags: [Reservations]
 */
router.get('/user/:userId', authenticate, reservationsController.getUserReservations);

/**
 * @openapi
 * /api/reservations/{id}/extend:
 *   put:
 *     summary: Extend reservation
 *     tags: [Reservations]
 */
router.put('/:id/extend', authenticate, validate(schemas.extendReservation), reservationsController.extendReservation);

/**
 * @openapi
 * /api/reservations/{id}:
 *   delete:
 *     summary: Cancel reservation
 *     tags: [Reservations]
 */
router.delete('/:id', authenticate, reservationsController.cancelReservation);

/**
 * @openapi
 * /api/reservations/{id}/complete:
 *   post:
 *     summary: Complete reservation (internal API)
 *     tags: [Reservations]
 */
router.post('/:id/complete', authenticateInternal, reservationsController.completeReservation);

export default router;
