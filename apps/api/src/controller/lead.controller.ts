import type { Request, Response } from 'express';
import {
  leadIdParamsSchema,
  leadListQuerySchema,
  updateLeadStatusSchema,
} from '../schema/lead.schema.js';
import { getLead, listLeads, updateLeadStatus } from '../service/lead.service.js';
import ApiResponse from '../utils/apiResponse.js';

export const getLeads = async (req: Request, res: Response) => {
  const leads = await listLeads(leadListQuerySchema.parse(req.query));

  res.status(200).json(new ApiResponse(200, leads, 'Leads fetched successfully'));
};

export const getLeadDetail = async (req: Request, res: Response) => {
  const { id } = leadIdParamsSchema.parse(req.params);
  const lead = await getLead(id);

  res.status(200).json(new ApiResponse(200, lead, 'Lead fetched successfully'));
};

export const patchLeadStatus = async (req: Request, res: Response) => {
  const { id } = leadIdParamsSchema.parse(req.params);
  const updated = await updateLeadStatus(id, updateLeadStatusSchema.parse(req.body));

  res.status(200).json(new ApiResponse(200, updated, 'Lead status updated successfully'));
};
