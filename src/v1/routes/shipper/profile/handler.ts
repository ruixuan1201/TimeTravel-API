import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import ShipmentPreference from '../../../models/shipment_preference.model';
import Shipper from '../../../models/shipper.model';
import ShipperActivity from '../../../models/shipper_activity.model';
import { ActivityTypes, DATA_NOT_FOUND, SubActivityTypes } from '../../../utils/constants';
import { IShipmentPreference } from './../../../entities/shipment_preference';
import { IShipper, IShipperActivity, SHIPPER_STATUS } from '../../../entities/shipper';
import { logActivity } from '../../../utils/functions';
import { stripe } from '../../../services/stripe';

const activity: IShipperActivity = {
  activity: '',
};

export async function getShipper(req: Request, res: Response) {
  activity.activity = ActivityTypes.GET_SHIPPER;

  try {
    const { id } = req.payload;

    const shipper = await Shipper.findById(id).select('-__v').populate({
      path: 'address vehicleId shipmentPreference',
      select: '-__v -createdAt -updatedAt',
    });

    activity.shipperId = shipper?._id;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('shipper', ShipperActivity, activity);

    return res.status(StatusCodes.OK).json({
      shipper,
    });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('shipper', ShipperActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function updateShipper(req: Request, res: Response) {
  activity.activity = ActivityTypes.UPDATE_SHIPPER;
  try {
    const { id } = req.payload;

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      profileImage,
      birthDate,
      shipperStatus,
      geoFenceCollectionName,
    }: IShipper = req.body;

    const user = await Shipper.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        phone,
        address,
        profileImage,
        birthDate,
        shipperStatus,
        geoFenceCollectionName,
      },
      {
        new: true,
      },
    ).select('-__v');

    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('shipper', ShipperActivity, activity);
    return res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('shipper', ShipperActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function createPreference(req: Request, res: Response) {
  try {
    const { id } = req.payload;

    const { city, nearBy, distance, isFullTime, preferredShipmentType }: IShipmentPreference = req.body;

    const shipper = await Shipper.findById(id).exec();

    if (!shipper) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    if (shipper.shipmentPreference) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'shipmentPreference already exist',
      });
    }

    const preference = await ShipmentPreference.create({
      shipperId: id,
      city,
      nearBy,
      distance,
      isFullTime,
      preferredShipmentType,
    });

    shipper.shipmentPreference = preference._id;
    await shipper.save();

    return res.status(StatusCodes.OK).json({ preference });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function updatePreference(req: Request, res: Response) {
  try {
    const { id } = req.payload;

    const { city, nearBy, distance, isFullTime, preferredShipmentType }: IShipmentPreference = req.body;

    const shipper = await Shipper.findById(id).select('shipmentPreference').exec();

    const preference = await ShipmentPreference.findByIdAndUpdate(
      shipper?.shipmentPreference,
      {
        shipperId: id,
        city,
        nearBy,
        distance,
        isFullTime,
        preferredShipmentType,
      },
      {
        new: true,
      },
    );

    return res.status(StatusCodes.OK).json({ preference });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getStripeAccountLink(req: Request, res: Response) {
  try {
    const { id } = req.payload;

    const shipper = await Shipper.findById(id).select('stripeAccountId').exec();

    if (!shipper?.stripeAccountId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'can not get AccountLink because current shipper do not have AccountId',
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: shipper?.stripeAccountId,
      refresh_url: `${process.env.APP_DOMAIN}/refresh`,
      return_url: `${process.env.APP_DOMAIN}/return`,
      type: 'account_onboarding',
    });

    return res.status(StatusCodes.OK).json({ accountLink });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function changeShipperStatus(req: Request, res: Response) {
  try {
    const { id } = req.payload;

    const { active } = req.body;

    const shipper = await Shipper.findByIdAndUpdate(
      id,
      {
        shipperStatus: active ? SHIPPER_STATUS.ACTIVE : SHIPPER_STATUS.INACTIVE,
      },
      {
        new: true,
      },
    ).select('shipperStatus');

    return res.status(StatusCodes.OK).json({ shipper });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function saveLastKnownLocation(req: Request, res: Response) {
  try {
    const { id } = req.payload;

    const { latitude, longitude } = req.body;

    const shipper = await Shipper.findByIdAndUpdate(
      id,
      {
        lastKnownLocation: {
          latitude,
          longitude,
          updated: new Date(),
        },
      },
      {
        new: true,
      },
    ).select('lastKnownLocation');

    return res.status(StatusCodes.OK).json({ shipper });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function saveFCMToken(req: Request, res: Response) {
  const { id } = req.payload;
  try {
    const { FCMToken } = req.body;

    await Shipper.findByIdAndUpdate(id, { FCMToken });

    return res.status(StatusCodes.OK).json({
      statue: 'Ok',
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}
