import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { appsService } from '../services/apps.service';
import { configService } from '../services/config.service';
import logger from '../utils/logger';

const router = Router();

router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const userGroups = req.session.userGroups || [];
    const categoriesWithApps = appsService.getAppsForUser(userGroups);

    res.json({
      categories: categoriesWithApps,
    });
  } catch (error) {
    logger.error('Error in apps route', { error });
    res.status(500).json({ error: 'Failed to fetch apps' });
  }
});

router.get('/categories', requireAuth, (req: Request, res: Response) => {
  try {
    const categories = configService.getCategories();

    res.json({
      categories,
    });
  } catch (error) {
    logger.error('Error in categories route', { error });
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/search', requireAuth, (req: Request, res: Response) => {
  try {
    const query = req.query.q;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const userGroups = req.session.userGroups || [];
    const results = appsService.searchApps(query, userGroups);

    res.json({
      results,
    });
  } catch (error) {
    logger.error('Error in search route', { error });
    res.status(500).json({ error: 'Failed to search apps' });
  }
});

export default router;
