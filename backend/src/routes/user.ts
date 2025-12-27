import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.get('/profile', requireAuth, (req: Request, res: Response) => {
  try {
    res.json({
      user: req.session.userInfo,
      groups: req.session.userGroups,
    });
  } catch (error) {
    logger.error('Error in profile route', { error });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.get('/groups', requireAuth, (req: Request, res: Response) => {
  try {
    res.json({
      groups: req.session.userGroups || [],
    });
  } catch (error) {
    logger.error('Error in groups route', { error });
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

export default router;
