import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import appsRoutes from './apps';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/apps', appsRoutes);

export default router;
