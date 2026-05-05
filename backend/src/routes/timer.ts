import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as timer from '../controllers/timerController';

const router = Router();

router.use(authenticate as any);

router.get('/status', timer.getStatus as any);
router.post('/start', timer.startTimer as any);
router.post('/stop', timer.stopTimer as any);
router.post('/heartbeat', timer.heartbeatTimer as any);
router.post('/switch', timer.switchTimer as any);
router.get('/stream', timer.timerStream as any);

export default router;
