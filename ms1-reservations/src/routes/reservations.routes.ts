import { Router } from 'express';
import { ReservationsController } from '../controllers/reservations.controller';
import { authenticate, authenticateInternal } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();
const reservationsController = new ReservationsController();

/**
 * @openapi
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parkingLotId
 *               - plateNumber
 *               - startTime
 *               - endTime
 *             properties:
 *               parkingLotId:
 *                 type: string
 *                 format: uuid
 *               plateNumber:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  validate(schemas.createReservation),
  reservationsController.createReservation
);

/**
 * @openapi
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation found
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', authenticate, reservationsController.getReservation);

/**
 * @openapi
 * /api/reservations/plate/{plateNumber}:
 *   get:
 *     summary: Get active reservation by plate number (internal API)
 *     tags: [Reservations]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: plateNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation found or not found
 *       401:
 *         description: Invalid API key
 */
router.get('/plate/:plateNumber', authenticateInternal, reservationsController.getReservationByPlate);

/**
 * @openapi
 * /api/reservations/user/{userId}:
 *   get:
 *     summary: Get user's reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservations found
 *       403:
 *         description: Access denied
 */
router.get('/user/:userId', authenticate, reservationsController.getUserReservations);

/**
 * @openapi
 * /api/reservations/{id}/extend:
 *   put:
 *     summary: Extend reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEndTime
 *             properties:
 *               newEndTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Reservation extended successfully
 *       404:
 *         description: Reservation not found
 */
router.put(
  '/:id/extend',
  authenticate,
  validate(schemas.extendReservation),
  reservationsController.extendReservation
);

/**
 * @openapi
 * /api/reservations/{id}:
 *   delete:
 *     summary: Cancel reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       404:
 *         description: Reservation not found
 */
router.delete('/:id', authenticate, reservationsController.cancelReservation);

/**
 * @openapi
 * /api/reservations/{id}/complete:
 *   post:
 *     summary: Complete reservation (internal API)
 *     tags: [Reservations]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation completed successfully
 *       404:
 *         description: Reservation not found
 */
router.post('/:id/complete', authenticateInternal, reservationsController.completeReservation);

export default router;
