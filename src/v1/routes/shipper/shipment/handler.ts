import { IShipmentPreference } from './../../../entities/shipment_preference';
import StatusCodes from 'http-status-codes';
import cloudinary from 'cloudinary';
import fs from 'fs-extra';
import randomstring from 'randomstring';
import { Request, Response } from 'express';

import Dispatcher from '../../../models/dispatcher.model';
import Shipment from '../../../models/shipment.model';
import ShipmentHistory from '../../../models/shipment_history.model';
import ShipmentToGeo from '../../../models/shipment_to_geo.model';
import Shipper from '../../../models/shipper.model';
import { DATA_NOT_FOUND, distanceFromMiles, EMPTY_FILE, INVALID_ID } from '../../../utils/constants';
import { ICurrentLocation, SHIPMENT_STATUS } from '../../../entities/shipment';
import { SHIPMENT_HISTORY_ACTIVITY } from '../../../entities/shipment_history';
import { runInTransaction } from '../../../services/transactionSession';
import { deleteMedia, saveMedia } from '../../../utils/functions/cloudinary';
import { sendNotification, validateId } from '../../../utils/functions';
import { sendSMS } from '../../../services/twilio';
import { setFolder, uploadMulti } from '../../../services/multer';

export const saveCurrentShipmentLocation = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params;
    const { latitude, longitude } = req.body;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const currentLocation: ICurrentLocation = { latitude, longitude, time: new Date() };

    const updatedShipment = await Shipment.findByIdAndUpdate(shipmentId, { $push: { currentLocation } }, { new: true });

    if (!updatedShipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    return res
      .status(StatusCodes.OK)
      .json({ currentLocation: updatedShipment.currentLocation[updatedShipment.currentLocation.length - 1] });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export async function acceptShipment(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;
    const { expectedPickupTimestamp } = req.body;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const dispatchedShipment = await Dispatcher.findOne({ shipmentId: shipmentId, shipperId: id });
    const shipment = await Shipment.findOne({
      _id: shipmentId,
      status: SHIPMENT_STATUS.DISPATCHED,
      shipperId: id,
    });

    if (!dispatchedShipment || !shipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    if (shipment.deadline <= new Date(expectedPickupTimestamp)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "You can't accept the shipment at your expected time because it is later than deadline of shipment",
      });
    }

    const pickupCode = randomstring.generate({ length: 10, charset: 'alphanumeric', capitalization: 'uppercase' });
    const deliveryCode = randomstring.generate({ length: 10, charset: 'alphanumeric', capitalization: 'uppercase' });

    await runInTransaction(async (session) => {
      shipment.status = SHIPMENT_STATUS.CONFIRMED;
      shipment.shipperId = id;
      shipment.pickupCode = pickupCode;
      shipment.deliveryCode = deliveryCode;
      await shipment.save({ session });

      await Dispatcher.deleteMany({ shipmentId: shipmentId }, { session });

      await ShipmentHistory.create(
        [
          {
            shipmentId: shipmentId,
            shipperId: id,
            activity: SHIPMENT_HISTORY_ACTIVITY.CONFIRMED,
            additionalInfo: {
              shipper: id,
            },
          },
        ],
        { session },
      );

      sendNotification(shipmentId, SHIPMENT_STATUS.CONFIRMED);

      const shipper = await Shipper.findById(id).select('phone');

      sendSMS(
        `1. Pickup Code i.e QR Code: ${pickupCode}\n\n2. Delivery code which driver will enter to confirm the delivery: ${deliveryCode}`,
        shipper?.phone ?? '',
      );
    });

    return res.status(StatusCodes.OK).json({ statue: 'Ok' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function rejectShipment(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    await runInTransaction(async (session) => {
      await Dispatcher.deleteOne({ shipmentId: shipmentId, shipperId: id }, { session });

      await ShipmentHistory.create(
        [
          {
            shipmentId: shipmentId,
            shipperId: id,
            activity: SHIPMENT_HISTORY_ACTIVITY.REJECTED,
            additionalInfo: {
              shipper: id,
            },
          },
        ],
        { session },
      );
    });

    return res.status(StatusCodes.OK).json({ statue: 'Ok' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function validatePickupCode(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;
    const { pickupCode } = req.body;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const shipment = await Shipment.findOne({
      _id: shipmentId,
      shipperId: id,
      pickupCode,
      status: SHIPMENT_STATUS.CONFIRMED,
    });

    if (!shipment) {
      return res.status(StatusCodes.OK).json({
        success: false,
        message: 'Invalid Scan',
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Successfully scanned pickup code',
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function startShipment(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const confirmedShipment = await Shipment.findOne({
      _id: shipmentId,
      status: SHIPMENT_STATUS.CONFIRMED,
      shipperId: id,
    });

    if (!confirmedShipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    await runInTransaction(async (session) => {
      confirmedShipment.status = SHIPMENT_STATUS.STARTED;
      confirmedShipment.save({ session });

      await ShipmentHistory.create(
        [
          {
            shipmentId: shipmentId,
            shipperId: id,
            activity: SHIPMENT_HISTORY_ACTIVITY.PICKED,
            additionalInfo: {
              shipper: id,
            },
          },
        ],
        { session },
      );

      sendNotification(shipmentId, SHIPMENT_STATUS.STARTED);
    });

    return res.status(StatusCodes.OK).json({ statue: 'Ok' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function pickupShipment(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;
    const notes = req.body?.notes;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const shipment = await Shipment.findOne({
      _id: shipmentId,
      shipperId: id,
      status: SHIPMENT_STATUS.STARTED,
    });

    if (!shipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    shipment.status = SHIPMENT_STATUS.IN_TRANSIT;
    shipment.pickupDetails = {
      pickupOn: new Date(),
      pickupNotes: notes,
      pickupPictures: [...(shipment?.pickupDetails?.pickupPictures ?? [])],
    };
    await shipment.save();

    sendNotification(shipmentId, SHIPMENT_STATUS.IN_TRANSIT);

    return res.status(StatusCodes.OK).json({ statue: 'Ok' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export const uploadPickupImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const pickupShipment = await Shipment.findOne({
      _id: shipmentId,
      shipperId: id,
    });

    if (!pickupShipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    setFolder(process.env.IMAGE_UPLOAD_TEMP_PATH as string);

    uploadMulti(shipmentId)(req, res, async (err) => {
      if (err) throw err;
      if (req?.files) {
        const files = req.files as Express.Multer.File[];
        const uploadedFiles = await Promise.all(
          files.map(async (file) => {
            const resourceFile = file.filename;
            const path = process.env.IMAGE_UPLOAD_TEMP_PATH;
            const dir = process.env.CLOUDINARY_SHIPMENT_DIR;
            const result = (await saveMedia(
              resourceFile,
              path ?? '',
              `${dir ?? ''}/${shipmentId}/pickup`,
            )) as cloudinary.UploadApiResponse;
            fs.unlink(`${process.env.IMAGE_UPLOAD_TEMP_PATH}/${resourceFile}`);

            return {
              url: result.url,
            };
          }),
        );

        pickupShipment.pickupDetails = {
          pickupOn: pickupShipment?.pickupDetails?.pickupOn ?? new Date(),
          pickupPictures: [...(pickupShipment?.pickupDetails?.pickupPictures ?? []), ...uploadedFiles],
          pickupNotes: pickupShipment?.pickupDetails?.pickupNotes,
        };
        await pickupShipment.save();

        return res.status(StatusCodes.OK).json({ pickupPictures: uploadedFiles });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send({ message: EMPTY_FILE });
      }
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const deletePickupImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.payload;
    const { shipmentId, imageId } = req.params;
    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: INVALID_ID });
    }

    const shipment = await Shipment.findOne({
      _id: shipmentId,
      shipperId: id,
    });
    if (!shipment || !shipment?.pickupDetails?.pickupPictures) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const deletedIndex = shipment.pickupDetails.pickupPictures.findIndex((item) => item.id === imageId);
    if (deletedIndex < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const dir = process.env.CLOUDINARY_SHIPMENT_DIR ?? '';

    await deleteMedia(
      `${dir ?? ''}/${shipmentId}/pickup`,
      shipment.pickupDetails.pickupPictures[deletedIndex].url.split('/').at(-1)?.split('.')[0] ?? '',
    );

    const newPhotos = shipment.pickupDetails.pickupPictures.filter((_, index) => index !== deletedIndex);
    shipment.pickupDetails.pickupPictures = [...(newPhotos ?? [])];
    await shipment.save();

    return res.status(StatusCodes.OK).json({ shipment });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const uploadDeliveredShipmentImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const deliveredShipment = await Shipment.findOne({
      _id: shipmentId,
      shipperId: id,
    });

    if (!deliveredShipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    setFolder(process.env.IMAGE_UPLOAD_TEMP_PATH as string);

    uploadMulti(shipmentId)(req, res, async (err) => {
      if (err) throw err;
      if (req?.files) {
        const files = req.files as Express.Multer.File[];
        const uploadedFiles = await Promise.all(
          files.map(async (file) => {
            const resourceFile = file.filename;
            const path = process.env.IMAGE_UPLOAD_TEMP_PATH;
            const dir = process.env.CLOUDINARY_SHIPMENT_DIR;
            const result = (await saveMedia(
              resourceFile,
              path ?? '',
              `${dir ?? ''}/${shipmentId}/delivered`,
            )) as cloudinary.UploadApiResponse;
            fs.unlink(`${process.env.IMAGE_UPLOAD_TEMP_PATH}/${resourceFile}`);

            return { url: result.url };
          }),
        );

        deliveredShipment.deliveryDetails = {
          deliveredOn: deliveredShipment?.deliveryDetails?.deliveredOn ?? new Date(),
          deliveryPictures: [...(deliveredShipment?.deliveryDetails?.deliveryPictures ?? []), ...uploadedFiles],
          deliveryNotes: deliveredShipment.deliveryDetails?.deliveryNotes,
        };
        await deliveredShipment.save();

        return res.status(StatusCodes.OK).json({ deliveryPictures: deliveredShipment });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send({ message: EMPTY_FILE });
      }
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const deleteDeliveredImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.payload;
    const { shipmentId, imageId } = req.params;
    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: INVALID_ID });
    }

    const shipment = await Shipment.findOne({
      _id: shipmentId,
      shipperId: id,
    });
    if (!shipment || !shipment?.deliveryDetails?.deliveryPictures) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const deletedIndex = shipment.deliveryDetails.deliveryPictures.findIndex((item) => item.id === imageId);
    if (deletedIndex < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const dir = process.env.CLOUDINARY_SHIPMENT_DIR ?? '';

    await deleteMedia(
      `${dir ?? ''}/${shipmentId}/delivered`,
      shipment.deliveryDetails.deliveryPictures[deletedIndex].url.split('/').at(-1)?.split('.')[0] ?? '',
    );

    const newPhotos = shipment.deliveryDetails.deliveryPictures.filter((_, index) => index !== deletedIndex);
    shipment.deliveryDetails.deliveryPictures = [...(newPhotos ?? [])];
    await shipment.save();

    return res.status(StatusCodes.OK).json({ shipment });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export async function deliveredShipment(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const { shipmentId } = req.params;
    const notes = req.body?.notes;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const deliveredShipment = await Shipment.findOne({
      _id: shipmentId,
      shipperId: id,
      status: SHIPMENT_STATUS.IN_TRANSIT,
    });

    if (!deliveredShipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    await runInTransaction(async (session) => {
      deliveredShipment.status = SHIPMENT_STATUS.DELIVERED;
      deliveredShipment.deliveryDetails = {
        deliveredOn: new Date(),
        deliveryPictures: [...(deliveredShipment?.deliveryDetails?.deliveryPictures ?? [])],
        deliveryNotes: notes,
      };
      await deliveredShipment.save({ session });

      await ShipmentHistory.create(
        [
          {
            shipmentId: shipmentId,
            shipperId: id,
            activity: SHIPMENT_HISTORY_ACTIVITY.DELIVERED,
            additionalInfo: {
              shipper: id,
            },
          },
        ],
        { session },
      );

      sendNotification(shipmentId, SHIPMENT_STATUS.DELIVERED);
    });

    return res.status(StatusCodes.OK).json({ statue: 'Ok' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getDispatchedShipment(req: Request, res: Response) {
  const { id } = req.payload;

  try {
    const query = req.query;

    const latitude = query.latitude?.toString();
    const longitude = query.longitude?.toString();
    const page = parseInt(query.page?.toString() ?? '1');
    const limit = parseInt(query.limit?.toString() ?? '10');

    const shipper = await Shipper.findById(id)
      .populate<{ shipmentPreference: IShipmentPreference }>({ path: 'shipmentPreference' })
      .select('shipmentPreference');

    let addressList: string[] = [];
    if (shipper && shipper.shipmentPreference?.nearBy) {
      const addressGeo = await ShipmentToGeo.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $maxDistance: distanceFromMiles[shipper.shipmentPreference.distance].max,
            $minDistance: distanceFromMiles[shipper.shipmentPreference.distance].min,
          },
        },
      }).select('addressId -_id');
      addressList = [...new Set(addressGeo.map((item) => item.addressId?.toString()))];
    }

    const dispatchedShipments = await Shipment.paginate(
      {
        $or: [
          { status: SHIPMENT_STATUS.DISPATCHED },
          { $and: [{ addressFrom: addressList }, { shipmentType: shipper?.shipmentPreference.preferredShipmentType }] },
        ],
      },
      {
        sort: { createdAt: -1 },
        page,
        limit,
        customLabels: { docs: 'shipment' },
        populate: [
          { path: 'customerId', select: 'phone email firstName lastName' },
          {
            path: 'addressFrom addressTo addressReturn packages quotes',
            select: '-__v -createdAt -updatedAt',
          },
        ],
        select: '-__v -addressFromGeoId -addressToGeoId -addressReturnGeoId',
      },
    );

    return res.status(200).json({ dispatchedShipments });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getActiveShipments(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const query = req.query;
    const page = parseInt(query.page?.toString() ?? '1');
    const limit = parseInt(query.limit?.toString() ?? '10');

    const shipments = await Shipment.paginate(
      { shipperId: id, status: [SHIPMENT_STATUS.CONFIRMED, SHIPMENT_STATUS.STARTED, SHIPMENT_STATUS.IN_TRANSIT] },
      {
        sort: { createdAt: -1 },
        page,
        limit,
        customLabels: { docs: 'shipment' },
        populate: [
          { path: 'customerId', select: 'phone email firstName lastName' },
          {
            path: 'addressFrom addressTo addressReturn packages quotes',
            select: '-__v -createdAt -updatedAt',
          },
        ],
        select: '-__v -addressFromGeoId -addressToGeoId -addressReturnGeoId',
      },
    );

    if (!shipments) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json(shipments);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}
