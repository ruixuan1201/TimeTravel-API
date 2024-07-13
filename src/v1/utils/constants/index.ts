import { PREFERRED_DISTANCE } from '../../entities/shipment_preference';

export enum ActivityTypes {
  LOG_IN = 'LOG_IN',
  REGISTER_USER = 'REGISTER_USER',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  CREATE_ADDRESS = 'CREATE_ADDRESS',
  GET_ADDRESS = 'GET_ADDRESS',
  GET_ALL_ADDRESSES = 'GET_ALL_ADDRESSES',
  EDIT_ADDRESS = 'EDIT_ADDRESS',
  UPDATE_USER_DATA = 'UPDATE_USER_DATA',
  UPDATE_AVATAR = 'UPDATE_AVATAR',
  READ_USER_DATA = 'READ_USER_DATA',
  CREATE_PACKAGE = 'CREATE_PACKAGE',
  GET_PACKAGE = 'GET_PACKAGE',
  GET_ALL_PACKAGES = 'GET_ALL_PACKAGES',
  CREATE_SHIPPER = 'CREATE_SHIPPER',
  GET_SHIPPER = 'GET_SHIPPER',
  GET_ALL_SHIPPER = 'GET_ALL_SHIPPER',
  UPDATE_SHIPPER = 'UPDATE_SHIPPER',
}

export enum SubActivityTypes {
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
  INITIATED = 'INITIATED',
  SENT = 'SENT',
}

export enum AdditionalInfoTypes {
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  TOKEN_CREATED = 'TOKEN_CREATED',
  TOKEN_UPDATED = 'TOKEN_UPDATED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_EXIST = 'NOT_EXIST',
}

export const WRONG_TOKEN = 'We were unable to find a valid token';

export const INVALID_TOKEN = 'Invalid token. please try again';
export const INVALID_ID = 'invalid id';

export const EXPIRE_TOKEN = 'Your token has expired';
export const EXPIRED_OTP = 'otp expired';
export const OTP_NOT_EXCEED = 'otp resend duration not exceed';

export const DATA_NOT_FOUND = 'Data not found';
export const OTP_NOT_FOUND = 'otp code not founded';
export const OTP_NOT_MATCHED = 'otp not matched';
export const TOKEN_NOT_FOUND = 'token not found';

export const PHONE_EXIST = 'phone already registered';
export const VEHICLE_EXIST = 'vehicle already existed';

export const EMPTY_FILE = 'Upload a file please!';

export const oneMile = 1609.34;
export const distanceFromMiles: {
  [key in PREFERRED_DISTANCE]: {
    min: number;
    max: number;
  };
} = {
  '<25 miles': {
    min: 0,
    max: 25 * oneMile,
  },
  '25-50 miles': {
    min: 25 * oneMile,
    max: 50 * oneMile,
  },
  '50-100 miles': {
    min: 50 * oneMile,
    max: 100 * oneMile,
  },
  '100-500 miles': {
    min: 100 * oneMile,
    max: 500 * oneMile,
  },
};
