import { Router } from 'express';
import authRoutes from './auth.routes';
import reservationsRoutes from './reservations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/reservations', reservationsRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ms1-reservations',
  });
});

export default router;
