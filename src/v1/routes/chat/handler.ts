import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import Chat from '../../models/chat.model';
import { DATA_NOT_FOUND, INVALID_ID } from '../../utils/constants';
import { validateId } from '../../utils/functions';

export async function saveChat(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const { shipmentId, recipientType, message, channel } = req.body;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const chat = await Chat.create({ shipmentId, recipientType, message, channel, sender: id });

    return res.status(StatusCodes.OK).json({ chat });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
}

export async function getChatHistory(req: Request, res: Response) {
  try {
    const query = req.query;

    const page = parseInt(query.page?.toString() ?? '1');
    const limit = parseInt(query.limit?.toString() ?? '50');
    const order = query.order?.toString() ?? '';
    const channel = query.channel?.toString() ?? '';

    const chat = await Chat.paginate(
      { channel: channel },
      {
        sort: { createdAt: order === 'timestamp' ? 1 : -1 },
        page,
        limit,
        select: '-__v',
      },
    );

    if (!chat.docs.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: DATA_NOT_FOUND });
    }

    return res.status(StatusCodes.OK).json(chat);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
}
