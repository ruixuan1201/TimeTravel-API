import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import Shipment from '../../models/shipment.model';
import { DATA_NOT_FOUND, INVALID_ID } from '../../utils/constants';
import { validateId } from '../../utils/functions';

export async function getShipmentLocationHistory(req: Request, res: Response) {
  try {
    const { shipmentId } = req.params;
    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const shipment = await Shipment.findById(shipmentId).select('currentLocation');

    if (!shipment || !shipment.currentLocation || !shipment.currentLocation.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json({ currentLocation: shipment.currentLocation });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getCurrentShipmentLocation(req: Request, res: Response) {
  try {
    const { shipmentId } = req.params;
    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const shipment = await Shipment.findById(shipmentId).select({ currentLocation: { $slice: -1 } });
    if (!shipment || !shipment.currentLocation) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json({ currentLocation: shipment.currentLocation });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getSingleShipment(req: Request, res: Response) {
  try {
    const { shipmentId } = req.params;
    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const shipment = await Shipment.findById(shipmentId)
      .populate({
        path: 'customerId',
        select: 'phone email firstName lastName',
      })
      .populate({
        path: 'addressFrom addressTo addressReturn packages quotes',
        select: '-__v -createdAt -updatedAt',
      })
      .populate({
        path: 'shipperId',
        populate: [
          {
            path: 'vehicleId',
            select: '-__v -createdAt -updatedAt',
          },
        ],
        select: '-__v -createdAt -updatedAt',
      })
      .select('-__v -addressFromGeoId -addressToGeoId -addressReturnGeoId');

    if (!shipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json({
      shipment,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function calculateQuote(req: Request, res: Response) {
  try {
    const { shipmentId, currency } = req.params;
    if (!validateId(shipmentId) || !currency) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const quote = await Shipment.findById(shipmentId)
      .populate({
        path: 'quotes',
        match: {
          currency,
        },
      })
      .select('quotes -_id');
    return res.status(StatusCodes.OK).json({ quote });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}
