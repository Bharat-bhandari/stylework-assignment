import type { Request, Response } from 'express';
import { checkHealth } from '../service/health.service.js';
import ApiResponse from '../utils/apiResponse.js';

export const getHealth = async (_req: Request, res: Response) => {
  const health = await checkHealth();

  res.status(200).json(new ApiResponse(200, health, 'OK'));
};
