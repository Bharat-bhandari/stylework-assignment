import { Router } from 'express';
import { getLeadDetail, getLeads, patchLeadStatus } from '../controller/lead.controller.js';

const router = Router();

router.get('/', getLeads);
router.get('/:id', getLeadDetail);
router.patch('/:id/status', patchLeadStatus);

export default router;
