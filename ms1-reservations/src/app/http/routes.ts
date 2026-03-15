import { Router } from 'express';
import authRoutes from '../../modules/auth/api/auth.routes';
import reservationsRoutes from '../../modules/reservations/api/reservations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/reservations', reservationsRoutes);

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ms1-reservations',
  });
});

export default router;
