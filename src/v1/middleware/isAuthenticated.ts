import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

import Shipper from '../models/shipper.model';
import User from '../../v1/models/user.model';
import { INVALID_TOKEN, WRONG_TOKEN, EXPIRE_TOKEN } from '../../v1/utils/constants';

declare module 'express-serve-static-core' {
  interface Request {
    payload: JwtPayload;
  }
}

export const customerAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  const { authorization } = req.headers;
  const { UNAUTHORIZED } = StatusCodes;
  if (!authorization) {
    return res.status(UNAUTHORIZED).json({
      error: INVALID_TOKEN,
    });
  }

  const token = authorization.replace(/^Bearer\s/, '');

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.ACCESS_SECRET_KEY ?? '') as JwtPayload;

    const user = await User.findById(payload.id).exec();

    if (!user) {
      return res.status(UNAUTHORIZED).json({
        error: WRONG_TOKEN,
      });
    }

    req.payload = payload;
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(UNAUTHORIZED).json({
        error: EXPIRE_TOKEN,
      });
    } else {
      res.status(UNAUTHORIZED).json({
        error: INVALID_TOKEN,
      });
    }
  }

  return next();
};

export const shipperAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  const { authorization } = req.headers;
  const { UNAUTHORIZED } = StatusCodes;
  if (!authorization) {
    return res.status(UNAUTHORIZED).json({
      error: INVALID_TOKEN,
    });
  }

  const token = authorization.replace(/^Bearer\s/, '');

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.ACCESS_SECRET_KEY ?? '') as JwtPayload;

    const shipper = await Shipper.findById(payload.id).exec();

    if (!shipper) {
      return res.status(UNAUTHORIZED).json({
        error: WRONG_TOKEN,
      });
    }

    req.payload = payload;
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(UNAUTHORIZED).json({
        error: EXPIRE_TOKEN,
      });
    } else {
      res.status(UNAUTHORIZED).json({
        error: INVALID_TOKEN,
      });
    }
  }

  return next();
};
