import fs from 'fs-extra';
import StatusCodes from 'http-status-codes';
import cloudinary from 'cloudinary';
import { Request, Response } from 'express';

import User from '../../../models/user.model';
import UserActivity from '../../../models/user_activity.model';
import {
  ActivityTypes,
  SubActivityTypes,
  AdditionalInfoTypes,
  EMPTY_FILE,
  DATA_NOT_FOUND,
} from '../../../utils/constants';
import { IActivity } from '../../../entities';
import { IUser } from '../../../entities/user';
import { logActivity } from '../../../utils/functions';
import { saveMedia } from '../../../utils/functions/cloudinary';
import { setFolder, upload } from '../../../services/multer';
import { stripe } from '../../../services/stripe';

const activity: IActivity = {
  activity: '',
};

export async function updateUser(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  activity.activity = ActivityTypes.UPDATE_USER_DATA;
  try {
    const { firstName, lastName, middleName, email, phone, terms }: IUser = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, middleName, email, phone, terms },
      {
        new: true,
      },
    ).select('email phone firstName lastName middleName photoURL terms');

    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('user', UserActivity, activity);
    return res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('user', UserActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.payload;
  activity.userId = id;
  try {
    const user = await User.findById(id).select('email phone firstName lastName middleName photoURL');

    //if not found user
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    //store history to db
    activity.activity = ActivityTypes.READ_USER_DATA;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('user', UserActivity, activity);
    //return result
    return res.status(StatusCodes.OK).json({
      user,
    });
  } catch (error) {
    activity.activity = ActivityTypes.READ_USER_DATA;
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('user', UserActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function paymentSetupIntent(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const user = await User.findById(id);

    //if not found user
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const deletedCustomer = user.stripeCustomerId
      ? (await stripe.customers.retrieve(user.stripeCustomerId)).deleted
      : true;

    if (deletedCustomer) {
      const customer = await stripe.customers.create({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: user.stripeCustomerId },
      { apiVersion: '2022-11-15' },
    );
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
    });

    const paymentInfo = {
      setupIntent: setupIntent.client_secret ?? '',
      ephemeralKey: ephemeralKey.secret ?? '',
      customer: user.stripeCustomerId,
    };

    //return result
    return res.status(StatusCodes.OK).json({
      ...paymentInfo,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function isSetupPaymentMethod(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const user = await User.findById(id).select('stripeCustomerId');

    //if not found user
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
    });

    const isSetupPaymentMethod = paymentMethods.data.length > 0;

    return res.status(StatusCodes.OK).json({
      isSetupPaymentMethod: isSetupPaymentMethod,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function getCards(req: Request, res: Response) {
  try {
    const { id } = req.payload;
    const user = await User.findById(id).select('stripeCustomerId');

    //if not found user
    if (!user || !user.stripeCustomerId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const paymentMethods = await stripe.customers.listPaymentMethods(user.stripeCustomerId, { type: 'card' });

    return res.status(StatusCodes.OK).json({
      cards: paymentMethods.data,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function saveFCMToken(req: Request, res: Response) {
  const { id } = req.payload;
  try {
    const { FCMToken }: IUser = req.body;

    await User.findByIdAndUpdate(id, { FCMToken });

    return res.status(StatusCodes.OK).json({
      statue: 'Ok',
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function uploadAvatar(req: Request, res: Response) {
  const { id } = req.payload;

  setFolder(process.env.IMAGE_UPLOAD_TEMP_PATH ?? '');

  activity.userId = id;
  activity.activity = ActivityTypes.UPDATE_AVATAR;

  upload(id)(req, res, async (err) => {
    const resourceFile = req?.file?.filename;
    if (!resourceFile) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: EMPTY_FILE });
    }
    if (err) {
      activity.subActivity = SubActivityTypes.FAILED;
      activity.additionalInfo = { reason: AdditionalInfoTypes.BAD_REQUEST };
      logActivity('user', UserActivity, activity);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
    const path = process.env.IMAGE_UPLOAD_TEMP_PATH ?? '';
    const dir = process.env.CLOUDINARY_AVATAR_DIR ?? '';
    const result = (await saveMedia(resourceFile, path, dir)) as cloudinary.UploadApiResponse;
    fs.unlink(`${process.env.IMAGE_UPLOAD_TEMP_PATH}/${resourceFile}`);
    const user = await User.findById(id).select('email phone firstName lastName photoURL');
    if (user) {
      user.photoURL = result.url;
      await user.save();
    }
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('user', UserActivity, activity);
    return res.status(StatusCodes.OK).json({ user });
  });
}
