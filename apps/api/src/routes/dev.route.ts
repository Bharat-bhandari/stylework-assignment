import { Router } from 'express';
import { simulateLead } from '../controller/dev.controller.js';

const router = Router();

router.post('/simulate-lead', simulateLead);

export default router;
