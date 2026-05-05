import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as analytics from '../controllers/analyticsController';

const router = Router();

router.use(authenticate as any);

router.get('/summary', analytics.getSummary as any);
router.get('/distribution', analytics.getDistribution as any);
router.get('/trend', analytics.getTrend as any);
router.get('/timeline', analytics.getTimeline as any);
router.get('/insights', analytics.getInsights as any);

export default router;
