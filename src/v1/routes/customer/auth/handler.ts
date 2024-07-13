import StatusCodes from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';
import moment from 'moment';
import { Request, Response } from 'express';

import PhoneConfirmation from '../../../models/phone_confirmation.model';
import User from '../../../models/user.model';
import UserActivity from '../../../models/user_activity.model';
import {
  ActivityTypes,
  AdditionalInfoTypes,
  SubActivityTypes,
  DATA_NOT_FOUND,
  INVALID_ID,
  OTP_NOT_MATCHED,
  EXPIRE_TOKEN,
  EXPIRED_OTP,
  OTP_NOT_EXCEED,
} from '../../../utils/constants';
import { IActivity } from '../../../entities';
import { logActivity, validateId, generateOtp, generateToken } from '../../../utils/functions';
import { stripe } from '../../../services/stripe';

const activity: IActivity = {
  activity: '',
};

export async function sendOtpForLoginUser(req: Request, res: Response) {
  activity.activity = ActivityTypes.LOG_IN;
  try {
    const { phone } = req.body;

    const phoneConfirmationId = await generateOtp(phone?.toString() ?? '');
    return res.status(StatusCodes.OK).json({ id: phoneConfirmationId });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export const verifyOtpForLogin = async (req: Request, res: Response) => {
  try {
    const { otp, id } = req.body;
    if (!validateId(id ?? '')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const phoneConfirmation = await PhoneConfirmation.findById(id);

    if (!phoneConfirmation) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const savedOtp = jwt.verify(phoneConfirmation.otp, process.env.OTP_SECRET_KEY ?? '') as JwtPayload;

    if (!(savedOtp.otp === otp)) {
      return res.status(StatusCodes.BAD_REQUEST).send({ error: OTP_NOT_MATCHED });
    }

    const user = await User.findOne({ phone: phoneConfirmation.phone }).exec();

    if (!user) {
      const user = await User.create({
        phone: phoneConfirmation.phone,
      });
      return res.status(StatusCodes.OK).json({ id: user.id, isNewUser: true });
    } else {
      const accessToken = generateToken(
        { id: user.id },
        process.env.ACCESS_SECRET_KEY ?? '',
        process.env.ACCESS_TOKEN_EXPIRE_TIME,
      );

      const refreshToken = generateToken(
        { id: user.id },
        process.env.REFRESH_SECRET_KEY ?? '',
        process.env.REFRESH_TOKEN_EXPIRE_TIME,
      );

      user.lastLogin = {
        date: moment.utc().format('YYYY-MM-DD'),
        time: moment.utc().format('HH:mm:ss'),
      };

      await user.save();

      activity.userId = user._id;
      activity.subActivity = SubActivityTypes.SUCCESS;
      activity.additionalInfo = { status: AdditionalInfoTypes.TOKEN_CREATED };
      logActivity('user', UserActivity, activity);

      return res.status(StatusCodes.OK).json({
        accessToken,
        refreshToken,
      });
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.EXPECTATION_FAILED).json({
        error: EXPIRED_OTP,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error?.message ?? error });
  }
};

export async function loginWithRegister(req: Request, res: Response) {
  try {
    const { id, email, terms, firstName, lastName } = req.body;

    if (!validateId(id ?? '')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const user = await User.findByIdAndUpdate(id, {
      email,
      terms,
      firstName,
      lastName,
    }).exec();

    if (!user) {
      activity.subActivity = SubActivityTypes.FAILED;
      activity.additionalInfo = { reason: AdditionalInfoTypes.NOT_EXIST };
      logActivity('user', UserActivity, activity);

      return res.status(StatusCodes.EXPECTATION_FAILED).json({
        error: DATA_NOT_FOUND,
      });
    }

    try {
      const customer = await stripe.customers.create({ name: `${firstName} ${lastName}`, email: email });
      user.stripeCustomerId = customer.id;
    } catch (error) {
      console.error(error);
    }

    const accessToken = generateToken(
      { id: user.id },
      process.env.ACCESS_SECRET_KEY ?? '',
      process.env.ACCESS_TOKEN_EXPIRE_TIME,
    );

    const refreshToken = generateToken(
      { id: user.id },
      process.env.REFRESH_SECRET_KEY ?? '',
      process.env.REFRESH_TOKEN_EXPIRE_TIME,
    );

    user.lastLogin = {
      date: moment.utc().format('YYYY-MM-DD'),
      time: moment.utc().format('HH:mm:ss'),
    };

    await user.save();

    activity.userId = user._id;
    activity.activity = ActivityTypes.REGISTER_USER;
    activity.subActivity = SubActivityTypes.SUCCESS;
    logActivity('user', UserActivity, activity);

    return res.status(StatusCodes.OK).json({ accessToken, refreshToken });
  } catch (error) {
    activity.subActivity = SubActivityTypes.FAILED;
    logActivity('user', UserActivity, activity);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function refreshToken(req: Request, res: Response) {
  activity.activity = ActivityTypes.REFRESH_TOKEN;
  try {
    const { refreshToken } = req.body;

    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY ?? '') as JwtPayload;

    const user = await User.findById(payload.id).exec();

    //if not found user
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }
    //generate new token for current user
    const accessToken = generateToken(
      { id: user.id },
      process.env.ACCESS_SECRET_KEY ?? '',
      process.env.ACCESS_TOKEN_EXPIRE_TIME,
    );

    //store history to db
    activity.userId = user.id;
    activity.subActivity = SubActivityTypes.SUCCESS;
    activity.additionalInfo = { status: AdditionalInfoTypes.TOKEN_UPDATED };
    logActivity('user', UserActivity, activity);

    //return result
    return res.status(StatusCodes.OK).json({
      accessToken,
    });
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: EXPIRE_TOKEN,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export const checkRefreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY ?? '') as JwtPayload;
    if (payload) return res.status(StatusCodes.OK).json({ isRefreshTokenValid: true });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.OK).json({ isRefreshTokenValid: false });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error?.message ?? error });
  }
};

export const checkAccessToken = async (req: Request, res: Response) => {
  return res.status(StatusCodes.OK).json({ isAccessTokenValid: true });
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!validateId(id ?? '')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const phoneConfirmation = await PhoneConfirmation.findById(id);

    if (!phoneConfirmation) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }

    const timeDiff = moment().diff(moment(phoneConfirmation.otpGenerated), 'minutes');

    if (timeDiff > parseInt(process.env.OTP_RESEND_DELAY_MINUTES || '60')) {
      generateOtp(phoneConfirmation.phone);
      return res.status(StatusCodes.OK).send({ id: phoneConfirmation.id });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: OTP_NOT_EXCEED,
      });
    }
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error?.message ?? error });
  }
};
