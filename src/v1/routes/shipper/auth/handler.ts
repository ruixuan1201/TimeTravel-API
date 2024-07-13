import StatusCodes from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';

import { stripe } from '../../../../v1/services/stripe';
import PhoneConfirmation from '../../../models/phone_confirmation.model';
import Shipper from '../../../models/shipper.model';
import { DATA_NOT_FOUND, INVALID_ID, OTP_NOT_MATCHED, EXPIRE_TOKEN, EXPIRED_OTP } from '../../../utils/constants';
import { validateId, generateToken } from '../../../utils/functions';
import { SHIPPER_STATUS } from '../../../../v1/entities/shipper';
import Address from '../../../models/address.model';

export const verifyOtpForLoginShipper = async (req: Request, res: Response) => {
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

    const shipper = await Shipper.findOne({ phone: phoneConfirmation.phone }).exec();

    if (!shipper) {
      const shipper = await Shipper.create({
        phone: phoneConfirmation.phone,
      });
      return res.status(StatusCodes.OK).json({ id: shipper.id, isNewShipper: true });
    } else {
      const accessToken = generateToken(
        { id: shipper.id },
        process.env.ACCESS_SECRET_KEY ?? '',
        process.env.ACCESS_TOKEN_EXPIRE_TIME,
      );

      const refreshToken = generateToken(
        { id: shipper.id },
        process.env.REFRESH_SECRET_KEY ?? '',
        process.env.REFRESH_TOKEN_EXPIRE_TIME,
      );

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

export async function loginWithRegisterShipper(req: Request, res: Response) {
  try {
    const { id, firstName, lastName, email, address, profileImage, birthDate, geoFenceCollectionName } = req.body;

    if (!validateId(id ?? '')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: INVALID_ID,
      });
    }

    const shipper = await Shipper.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      address,
      profileImage,
      birthDate,
      geoFenceCollectionName,
      shipperStatue: SHIPPER_STATUS.INACTIVE,
    }).exec();

    if (!shipper) {
      return res.status(StatusCodes.EXPECTATION_FAILED).json({
        error: DATA_NOT_FOUND,
      });
    }

    try {
      const shipperAddress = await Address.findById(address).select('country').exec();
      const account = await stripe.accounts.create({
        type: 'custom',
        country: shipperAddress?.country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      shipper.stripeAccountId = account.id;
      await shipper.save();
    } catch (error) {
      console.error('a driver account not created');
    }

    const accessToken = generateToken(
      { id: shipper.id },
      process.env.ACCESS_SECRET_KEY ?? '',
      process.env.ACCESS_TOKEN_EXPIRE_TIME,
    );

    const refreshToken = generateToken(
      { id: shipper.id },
      process.env.REFRESH_SECRET_KEY ?? '',
      process.env.REFRESH_TOKEN_EXPIRE_TIME,
    );

    return res.status(StatusCodes.OK).json({ accessToken, refreshToken });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error?.message ?? error,
    });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY ?? '') as JwtPayload;

    const shipper = await Shipper.findById(payload.id).exec();

    //if not found shipper
    if (!shipper) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: DATA_NOT_FOUND,
      });
    }
    //generate new token for current shipper
    const accessToken = generateToken(
      { id: shipper.id },
      process.env.ACCESS_SECRET_KEY ?? '',
      process.env.ACCESS_TOKEN_EXPIRE_TIME,
    );

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
