import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import Package from '../../../models/package.model';
import PackageActivity from '../../../models/package_activity.model';
import {
  ActivityTypes,
  SubActivityTypes,
  INVALID_ID,
  AdditionalInfoTypes,
  DATA_NOT_FOUND,
} from '../../../utils/constants';
import { IPackage, IPackageActivity } from '../../../entities/package';
import { logActivity, validateId } from '../../../utils/functions';

const activity: IPackageActivity = {
  activity: '',
};

export async function createPackage(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.CREATE_PACKAGE;

  try {
    const {
      length,
      width,
      height,
      dimensionUnit,
      flatRateTemplate,
      weight,
      weightUnit,
      quantity,
      value,
      additionalInfo,
    }: IPackage = req.body;

    const newPackage = await Package.create({
      userId: id,
      length,
      width,
      height,
      dimensionUnit,
      flatRateTemplate,
      weight,
      weightUnit,
      quantity,
      value,
      additionalInfo,
    });

    activity.packageId = newPackage._id;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('package', PackageActivity, activity);

    return res.status(StatusCodes.OK).json({ newPackage });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('package', PackageActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export const updatePackage = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;

    if (!validateId(packageId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const {
      length,
      width,
      height,
      dimensionUnit,
      flatRateTemplate,
      weight,
      weightUnit,
      additionalInfo,
      quantity,
      value,
    }: IPackage = req.body;

    const newPackage = await Package.findByIdAndUpdate(
      packageId,
      {
        length,
        width,
        height,
        dimensionUnit,
        flatRateTemplate,
        weight,
        weightUnit,
        additionalInfo,
        quantity,
        value,
      },
      {
        new: true,
      },
    ).select('-__v');

    return res.status(StatusCodes.OK).json({ newPackage });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error?.message ?? error });
  }
};

export async function getSinglePackage(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.GET_PACKAGE;

  try {
    const { packageId } = req.params;
    if (!validateId(packageId)) {
      activity.subActivity = SubActivityTypes.FAILED;
      activity.additionalInfo = { reason: AdditionalInfoTypes.BAD_REQUEST };
      logActivity('package', PackageActivity, activity);
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const singlePackage = await Package.findById(packageId).exec();

    if (!singlePackage) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    activity.packageId = singlePackage._id;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('package', PackageActivity, activity);
    return res.status(StatusCodes.OK).json({ package: singlePackage });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('package', PackageActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getAllPackages(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.GET_ALL_PACKAGES;

  try {
    const query = req.query;

    const page = parseInt(query.page?.toString() ?? '1');
    const limit = parseInt(query.limit?.toString() ?? '10');

    const packages = await Package.paginate(
      { userId: id },
      { sort: { createdAt: -1 }, page, limit, customLabels: { docs: 'package' } },
    );

    if (!packages) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('package', PackageActivity, activity);
    return res.status(StatusCodes.OK).json(packages);
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('package', PackageActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}
