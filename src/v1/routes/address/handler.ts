import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import Address from '../../../v1/models/address.model';
import AddressActivity from '../../../v1/models/address_activity.model';
import {
  ActivityTypes,
  AdditionalInfoTypes,
  DATA_NOT_FOUND,
  INVALID_ID,
  SubActivityTypes,
} from '../../../v1/utils/constants';
import { IAddress, IAddressActivity } from '../../../v1/entities/address';
import { logActivity, validateId } from '../../../v1/utils/functions';

const activity: IAddressActivity = {
  activity: '',
};

export async function createAddress(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.CREATE_ADDRESS;

  try {
    const {
      street1,
      street2,
      street3,
      city,
      latitude,
      longitude,
      zip,
      state,
      country,
      isResidential,
      additionalInfo,
      validate,
    }: IAddress = req.body;

    const address = await Address.create({
      street1,
      street2,
      street3,
      city,
      latitude,
      longitude,
      zip,
      state,
      country,
      isResidential,
      additionalInfo,
      validate,
    });

    activity.addressId = address._id;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('address', AddressActivity, activity);

    return res.status(StatusCodes.OK).json({ address });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('address', AddressActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getSingleAddress(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.GET_ADDRESS;

  try {
    const { addressId } = req.params;

    if (!validateId(addressId)) {
      activity.subActivity = SubActivityTypes.FAILED;
      activity.additionalInfo = { reason: AdditionalInfoTypes.BAD_REQUEST };
      logActivity('address', AddressActivity, activity);
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const address = await Address.findById(addressId).exec();

    if (!address) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    activity.addressId = address._id;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('address', AddressActivity, activity);

    return res.status(StatusCodes.OK).json({
      address,
    });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('address', AddressActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getAllAddress(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.GET_ALL_ADDRESSES;

  try {
    const query = req.query;

    const page = parseInt(query.page?.toString() ?? '1');
    const limit = parseInt(query.limit?.toString() ?? '10');

    const address = await Address.paginate(
      { userId: id },
      { sort: { createdAt: -1 }, page, limit, customLabels: { docs: 'addresses' } },
    );

    if (!address) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('address', AddressActivity, activity);
    return res.status(StatusCodes.OK).json(address);
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('address', AddressActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export const editAddress = async (req: Request, res: Response) => {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.EDIT_ADDRESS;
  try {
    const { addressId } = req.params;
    const {
      street1,
      street2,
      street3,
      city,
      latitude,
      longitude,
      zip,
      state,
      country,
      isResidential,
      additionalInfo,
      validate,
    }: IAddress = req.body;

    if (!validateId(addressId)) {
      activity.subActivity = SubActivityTypes.FAILED;
      activity.additionalInfo = { reason: AdditionalInfoTypes.BAD_REQUEST };
      logActivity('address', AddressActivity, activity);
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const address = await Address.findByIdAndUpdate(
      addressId,
      {
        street1,
        street2,
        street3,
        city,
        latitude,
        longitude,
        zip,
        state,
        country,
        isResidential,
        additionalInfo,
        validate,
      },
      {
        new: true,
      },
    ).select('-__v');

    activity.addressId = address?._id;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('address', AddressActivity, activity);

    return res.status(StatusCodes.OK).json({
      address,
    });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('address', AddressActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
};

export async function validateAddress(req: Request, res: Response) {
  try {
    // const { addressId } = req.params;
    return res.status(StatusCodes.OK).json({
      statue: 'Ok',
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}
