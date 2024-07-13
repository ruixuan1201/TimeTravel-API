import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';

import Package from '../../models/package.model';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    await Package.find().limit(2).exec();
    return res.status(StatusCodes.OK).json({ status: 'OK' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
