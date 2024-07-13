import fs from 'fs-extra';
import cloudinary from 'cloudinary';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import Shipper from '../../../models/shipper.model';
import Vehicle from '../../../models/vehicle.model';
import { DATA_NOT_FOUND, EMPTY_FILE, VEHICLE_EXIST } from '../../../utils/constants/index';
import { runInTransaction } from '../../../services/transactionSession';
import { deleteMedia, saveMedia } from '../../../utils/functions/cloudinary';
import { setFolder, uploadMulti } from '../../../services/multer';

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.payload;

    const { make, model, year, color, doors, pictures, additionalInfo } = req.body;
    const shipper = await Shipper.findById(id).exec();

    if (!shipper) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: DATA_NOT_FOUND });
    }

    if (shipper.vehicleId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: VEHICLE_EXIST });
    }

    await runInTransaction(async (session) => {
      const newVehicle = await Vehicle.create(
        [{ shipperId: id, make, model, year, color, doors, pictures, additionalInfo }],
        { session },
      );
      shipper.vehicleId = newVehicle[0].id;
      await shipper.save({ session });
    });

    return res.status(StatusCodes.OK).json({ vehicleId: shipper.vehicleId });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.payload;
    const { make, model, year, color, doors, additionalInfo } = req.body;

    const shipper = await Shipper.findById(id).exec();

    const vehicle = await Vehicle.findByIdAndUpdate(
      shipper?.vehicleId ?? '',
      {
        make,
        model,
        year,
        color,
        doors,
        additionalInfo,
      },
      {
        new: true,
      },
    ).select('-__v');

    return res.status(StatusCodes.OK).json({ vehicle });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export const getSingleVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.payload;

    const shipper = await Shipper.findById(id).exec();

    const vehicle = await Vehicle.findById(shipper?.vehicleId ?? '').select('-__v -createdAt -updatedAt');

    if (!vehicle) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: DATA_NOT_FOUND });
    }
    return res.status(StatusCodes.OK).json({ vehicle });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};

export async function uploadVehicleImage(req: Request, res: Response) {
  const { id } = req.payload;

  setFolder(process.env.IMAGE_UPLOAD_TEMP_PATH ?? '');
  const shipper = await Shipper.findById(id).select('vehicleId').exec();
  const vehicleId = shipper?.vehicleId.toString() ?? '';

  uploadMulti(vehicleId)(req, res, async (err) => {
    if (err) throw err;
    if (req?.files) {
      const files = req.files as Express.Multer.File[];
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const resourceFile = file.filename;
          const path = process.env.IMAGE_UPLOAD_TEMP_PATH;
          const dir = process.env.CLOUDINARY_VEHICLE_DIR;
          const result = (await saveMedia(
            resourceFile,
            path ?? '',
            `${dir ?? ''}/${vehicleId}`,
          )) as cloudinary.UploadApiResponse;
          fs.unlink(`${process.env.IMAGE_UPLOAD_TEMP_PATH}/${resourceFile}`);

          return {
            url: result.url,
          };
        }),
      );
      const vehicle = await Vehicle.findById(vehicleId).select('-__v');
      if (vehicle) {
        vehicle.pictures = [...(vehicle.pictures ?? []), ...uploadedFiles];
        await vehicle.save();
      }
      return res.status(StatusCodes.OK).json({ vehicle });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: EMPTY_FILE });
    }
  });
}

export const deleteVehicleImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const { id } = req.payload;

    setFolder(process.env.IMAGE_UPLOAD_TEMP_PATH ?? '');
    const shipper = await Shipper.findById(id).select('vehicleId').exec();

    const vehicleId = shipper?.vehicleId.toString() ?? '';
    const vehicle = await Vehicle.findById(vehicleId).select('-__v');

    if (!vehicle || !vehicle.pictures) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const deletedIndex = vehicle.pictures.findIndex((item) => item.id === imageId);
    if (deletedIndex < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const dir = process.env.CLOUDINARY_VEHICLE_DIR ?? '';

    await deleteMedia(
      `${dir ?? ''}/${vehicleId}`,
      vehicle.pictures[deletedIndex].url.split('/').at(-1)?.split('.')[0] ?? '',
    );

    const newPhotos = vehicle.pictures.filter((_, index) => index !== deletedIndex);
    vehicle.pictures = [...(newPhotos ?? [])];
    await vehicle.save();

    return res.status(StatusCodes.OK).json({ vehicle });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message ?? error });
  }
};
