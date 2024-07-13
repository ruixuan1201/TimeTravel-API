import StatusCodes from 'http-status-codes';
import cloudinary from 'cloudinary';
import fs from 'fs-extra';
import randomstring from 'randomstring';
import { Request, Response } from 'express';

import Address from '../../../models/address.model';
import Notification from '../../../models/notification.model';
import Shipment from '../../../models/shipment.model';
import ShipmentHistory from '../../../models/shipment_history.model';
import ShipmentToGeo from '../../../models/shipment_to_geo.model';
import Shipper from '../../../models/shipper.model';
import User from '../../../models/user.model';
import { DATA_NOT_FOUND, EMPTY_FILE, INVALID_ID } from '../../../utils/constants';
import { SHIPMENT_STATUS } from '../../../entities/shipment';
import { SHIPMENT_HISTORY_ACTIVITY } from '../../../entities/shipment_history';
import { deleteMedia, saveMedia } from '../../../utils/functions/cloudinary';
import { dispatchShipment, validateId } from '../../../utils/functions';
import { setFolder, uploadMulti } from '../../../services/multer';

export async function createShipment(req: Request, res: Response) {
  const { id } = req.payload;
  try {
    const { addressFrom, addressTo, addressReturn, packages, quotes, additionalInfo, shipmentType, deadline } =
      req.body;

    if (!validateId(addressFrom) || !validateId(addressTo) || !validateId(addressReturn)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const addressFromLocation = await Address.findById(addressFrom).select('latitude longitude');
    const addressToLocation = await Address.findById(addressFrom).select('latitude longitude');
    const addressReturnLocation = await Address.findById(addressFrom).select('latitude longitude');

    const customer = await User.findById(id).select('firstName lastName');
    const shipmentCode = `${customer?.firstName[0].toUpperCase()}${customer?.lastName[0].toUpperCase()}${randomstring.generate(
      { length: 6, charset: 'numeric', capitalization: 'uppercase' },
    )}`;

    const shipment = await Shipment.create({
      addressFrom,
      addressTo,
      addressReturn,
      packages,
      status: SHIPMENT_STATUS.PENDING,
      quotes,
      additionalInfo,
      customerId: id,
      shipmentType,
      shipmentCode,
      deadline,
    });

    const shipmentToGeoList = await ShipmentToGeo.create([
      {
        shipmentId: shipment.id,
        addressId: addressFrom,
        location: {
          type: 'Point',
          coordinates: [addressFromLocation?.longitude, addressFromLocation?.latitude],
        },
      },
      {
        shipmentId: shipment.id,
        addressId: addressTo,
        location: {
          type: 'Point',
          coordinates: [addressToLocation?.longitude, addressToLocation?.latitude],
        },
      },
      {
        shipmentId: shipment.id,
        addressId: addressReturn,
        location: {
          type: 'Point',
          coordinates: [addressReturnLocation?.longitude, addressReturnLocation?.latitude],
        },
      },
    ]);

    shipment.addressFromGeoId = shipmentToGeoList[0].id;
    shipment.addressToGeoId = shipmentToGeoList[1].id;
    shipment.addressReturnGeoId = shipmentToGeoList[2].id;
    await shipment.save();

    await ShipmentHistory.create({
      shipmentId: shipment.id,
      activity: SHIPMENT_HISTORY_ACTIVITY.CREATED,
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await dispatchShipment(
      () => {},
      (error) => {
        console.error(error);
      },
    );

    return res.status(StatusCodes.OK).json({ shipment });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export const updateShipment = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }
    const { addressFrom, addressTo, addressReturn, packages, quotes, additionalInfo, shipmentType, deadline } =
      req.body;

    const shipment = await Shipment.findById(shipmentId).exec();

    if (!shipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    if (addressFrom) {
      if (!validateId(addressFrom)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Invalid AddressFrom Id',
        });
      }

      const addressFromLocation = await Address.findById(addressFrom).select('latitude longitude');
      if (!addressFromLocation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'AddressFrom data not found',
        });
      }
      await ShipmentToGeo.findByIdAndUpdate(
        shipment.addressFromGeoId,
        {
          shipmentId,
          addressId: addressFrom,
          location: {
            type: 'Point',
            coordinates: [addressFromLocation.longitude, addressFromLocation.latitude],
          },
        },
        {
          new: true,
        },
      );
    }

    if (addressTo) {
      if (!validateId(addressTo)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Invalid AddressTo Id',
        });
      }

      const addressToLocation = await Address.findById(addressTo).select('latitude longitude');
      if (!addressToLocation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'AddressTo data not found',
        });
      }
      await ShipmentToGeo.findByIdAndUpdate(
        shipment.addressToGeoId,
        {
          shipmentId,
          addressId: addressTo,
          location: {
            type: 'Point',
            coordinates: [addressToLocation.longitude, addressToLocation.latitude],
          },
        },
        {
          new: true,
        },
      );
    }

    if (addressReturn) {
      if (!validateId(addressReturn)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Invalid AddressReturn Id',
        });
      }

      const addressReturnLocation = await Address.findById(addressReturn).select('latitude longitude');
      if (!addressReturnLocation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'AddressReturn data not found',
        });
      }
      await ShipmentToGeo.findByIdAndUpdate(
        shipment.addressToGeoId,
        {
          shipmentId,
          addressId: addressReturn,
          location: {
            type: 'Point',
            coordinates: [addressReturnLocation.longitude, addressReturnLocation.latitude],
          },
        },
        {
          new: true,
        },
      );
    }

    const newShipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        addressFrom,
        addressTo,
        addressReturn,
        packages,
        quotes,
        additionalInfo,
        shipmentType,
        deadline,
      },
      {
        new: true,
      },
    ).select('-__v -addressFromGeoId -addressToGeoId -addressReturnGeoId');

    return res.status(StatusCodes.OK).json({ shipment: newShipment });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const rateShipment = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const { value, comment } = req.body;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const shipper = await Shipper.findById(shipment.shipperId);

    if (!shipper) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: `can't add rating because this shipment don't have valid shipperId`,
      });
    }
    shipment.rating.value = value;
    shipment.rating.comment = comment;
    await shipment.save();

    shipper.rating.total = (shipper.rating.total ?? 0) + 1;
    shipper.rating.value = ((shipper.rating.value ?? 0) * (shipper.rating.total - 1) + value) / shipper.rating.total;

    await shipper.save();

    return res.status(StatusCodes.OK).json({ statue: 'Ok' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const tipShipment = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params;
    const { tip } = req.body;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    shipment.tip = tip;
    await shipment.save();

    return res.status(StatusCodes.OK).json({ statue: 'Ok' });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export async function getAllNotifications(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const query = req.query;

    const page = parseInt(query.page?.toString() ?? '1');
    const limit = parseInt(query.limit?.toString() ?? '10');

    const notifications = await Notification.paginate(
      { customerId: id },
      {
        sort: { createdAt: -1 },
        page,
        limit,
        customLabels: { docs: 'records' },
        select: '-__v -customerId -updatedAt',
      },
    );

    if (!notifications) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }
    return res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function dispatchShipmentAPI(req: Request, res: Response) {
  dispatchShipment(
    () => {
      return res.status(StatusCodes.OK).json({ status: 'OK' });
    },
    (error) => {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error?.message ?? error,
      });
    },
  );
}

export const uploadShipmentImage = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params;

    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const newShipment = await Shipment.findById(shipmentId).select(
      '-__v -addressFromGeoId -addressToGeoId -addressReturnGeoId',
    );

    if (!newShipment) {
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
              `${dir ?? ''}/${shipmentId}`,
            )) as cloudinary.UploadApiResponse;
            fs.unlink(`${process.env.IMAGE_UPLOAD_TEMP_PATH}/${resourceFile}`);

            return {
              url: result.url,
            };
          }),
        );

        newShipment.shipmentPhoto = [...(newShipment?.shipmentPhoto ?? []), ...uploadedFiles];
        await newShipment.save();

        return res.status(StatusCodes.OK).json({ shipment: newShipment });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send({ message: EMPTY_FILE });
      }
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const deleteShipmentImage = async (req: Request, res: Response) => {
  try {
    const { shipmentId, imageId } = req.params;
    if (!validateId(shipmentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: INVALID_ID });
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment || !shipment.shipmentPhoto) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const deletedIndex = shipment.shipmentPhoto.findIndex((item) => item.id === imageId);
    if (deletedIndex < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const dir = process.env.CLOUDINARY_SHIPMENT_DIR ?? '';

    await deleteMedia(
      `${dir ?? ''}/${shipmentId}`,
      shipment.shipmentPhoto[deletedIndex].url.split('/').at(-1)?.split('.')[0] ?? '',
    );

    const newPhotos = shipment.shipmentPhoto.filter((_, index) => index !== deletedIndex);
    shipment.shipmentPhoto = [...(newPhotos ?? [])];
    await shipment.save();

    return res.status(StatusCodes.OK).json({ shipment });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export async function getAllShipments(req: Request, res: Response) {
  const { id } = req.payload;

  try {
    const query = req.query;

    const page = parseInt(query.page?.toString() ?? '1');
    const limit = parseInt(query.limit?.toString() ?? '10');

    const shipments = await Shipment.paginate(
      { customerId: id },
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
          {
            path: 'shipperId',
            populate: [
              {
                path: 'vehicleId',
                select: '-__v -createdAt -updatedAt',
              },
            ],
            select: '-__v -createdAt -updatedAt',
          },
        ],
        select: '-__v',
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
