import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as activities from '../controllers/activitiesController';

const router = Router();

router.use(authenticate as any);

router.get('/', activities.getActivities as any);
router.post('/', activities.createActivity as any);
router.patch('/:id', activities.updateActivity as any);
router.delete('/:id', activities.deleteActivity as any);
router.post('/merge', activities.mergeActivities as any);

export default router;
