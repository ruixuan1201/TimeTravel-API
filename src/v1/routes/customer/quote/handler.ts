import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import Quote from '../../../models/quote.model';
import { DATA_NOT_FOUND, INVALID_ID } from '../../../utils/constants';
import { validateId } from '../../../utils/functions';

export async function getSingleQuote(req: Request, res: Response) {
  try {
    const { quoteId } = req.params;
    if (!validateId(quoteId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const quote = await Quote.findById(quoteId).exec();

    if (!quote) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json({
      quote,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}
