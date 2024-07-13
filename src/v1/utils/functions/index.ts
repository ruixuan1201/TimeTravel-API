import jwt from 'jsonwebtoken';
import logger from 'jet-logger';
import moment from 'moment';
import mongoose from 'mongoose';
import otpGenerator from 'otp-generator';
import { getMessaging } from 'firebase-admin/messaging';

import Dispatcher from '../../models/dispatcher.model';
import Notification from '../../models/notification.model';
import PhoneConfirmation from '../../models/phone_confirmation.model';
import Shipment from '../../models/shipment.model';
import ShipmentHistory from '../../models/shipment_history.model';
import Shipper from '../../models/shipper.model';
import User from '../../models/user.model';
import { DATA_NOT_FOUND } from '../constants';
import { IActivity } from '../../entities';
import { IAddress } from '../../entities/address';
import { IDispatcher, IMatrixDistance } from '../../entities/dispatcher';
import { IShipmentHistory, SHIPMENT_HISTORY_ACTIVITY } from '../../entities/shipment_history';
import { IShipmentPreference } from '../../entities/shipment_preference';
import { SHIPPER_STATUS } from '../../entities/shipper';
import { SHIPMENT_STATUS } from '../../entities/shipment';
import { getDistance } from '../../services/googleMap';
import { runInTransaction } from '../../services/transactionSession';
import { sendSMS } from '../../services/twilio';

export const logActivity = <T extends IActivity>(name: string, model: mongoose.Model<T>, activity: T) => {
  try {
    model.create(activity);
  } catch (e) {
    logger.info(`Error in log ${name} activity`);
  }
};

export const validateId = (id: string) => mongoose.Types.ObjectId.isValid(id);

export const generateToken = (
  data: { [key: string]: string },
  secretKey: string,
  expiresIn?: string,
): string | undefined => {
  if (secretKey) {
    return expiresIn
      ? jwt.sign(data, secretKey, {
          expiresIn,
        })
      : jwt.sign(data, secretKey);
  } else {
    return undefined;
  }
};

export const generateOtp = async (phone: string): Promise<string> => {
  let phoneConfirmation = await PhoneConfirmation.findOne({ phone });
  let otp = '';

  if (process.env.NODE_ENV !== 'PROD') {
    otp = '112233';
  } else {
    otp = otpGenerator.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
    await sendSMS(
      `${otp} is your one time passcode(OTP). Please enter this code to confirm your phone number on trado.com`,
      phone,
    );
  }

  const tokenizedOtp = generateToken({ otp }, process.env.OTP_SECRET_KEY ?? '', process.env.OTP_EXPIRE_TIME) ?? '';
  if (phoneConfirmation) {
    phoneConfirmation.otp = tokenizedOtp;
    phoneConfirmation.otpGenerated = new Date();
    await phoneConfirmation.save();
  } else {
    phoneConfirmation = await PhoneConfirmation.create({
      phone,
      otp: tokenizedOtp,
      otpGenerated: new Date(),
    });
  }

  return phoneConfirmation.id;
};

export async function sendNotification(shipmentId: string, status: SHIPMENT_STATUS) {
  try {
    const shipment = await Shipment.findById(shipmentId);

    const customerId = shipment?.customerId;
    const shipmentCode = shipment?.shipmentCode;

    if (!customerId) throw DATA_NOT_FOUND;

    const customer = await User.findById(customerId).select('FCMToken');
    const FCMToken = customer?.FCMToken;

    if (!FCMToken) throw DATA_NOT_FOUND;

    const message = {
      notification: {
        title: 'Shipment status updated',
        body: `Shipment ${shipmentCode} is now ${status}`,
      },
      data: {
        shipmentId,
      },
      token: FCMToken ?? '',
    };

    await getMessaging().send(message);

    await Notification.create({
      shipmentId,
      customerId,
      shipmentCode: shipmentCode ?? 'not defined',
      message: `Your shipment status updated to ${status}`,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function dispatchShipment(callback: () => void, errorCallback: (error: any) => void): Promise<void> {
  try {
    const shipments = await Shipment.find({ status: SHIPMENT_STATUS.PENDING })
      .populate<{ addressFrom: IAddress }>({
        path: 'addressFrom',
        select: 'latitude longitude -_id',
      })
      .select('addressFrom customerId')
      .exec();

    const shippers = await Shipper.find({ shipperStatus: SHIPPER_STATUS.ACTIVE })
      .populate<{ address: IAddress; shipmentPreference: IShipmentPreference }>({
        path: 'address shipmentPreference',
        select: '-_id',
      })
      .select('address shipmentPreference lastKnownLocation')
      .exec();

    const filteredShipment = shipments.filter((shipment) => {
      if (shipment.addressFrom) {
        const address = shipment.addressFrom;
        return !!address?.latitude && !!address?.longitude;
      }
      return false;
    });
    const shipmentGeoLocationArray: string[] = filteredShipment.map((shipment) => {
      const { latitude, longitude } = shipment.addressFrom;
      return `${latitude},${longitude}`;
    });

    const filteredShipper = shippers.filter((shipper) => {
      if (
        shipper?.shipmentPreference?.nearBy &&
        shipper?.lastKnownLocation &&
        moment().diff(moment(shipper.lastKnownLocation.updated), 'hours', true) < 24
      ) {
        return !!shipper.lastKnownLocation?.latitude && !!shipper.lastKnownLocation?.longitude;
      } else if (shipper.address) {
        const address = shipper.address;
        return !!address?.latitude && !!address?.longitude;
      }
      return false;
    });
    const shipperGeoLocationArray: string[] = filteredShipper.map((shipper) => {
      if (
        shipper.shipmentPreference.nearBy &&
        shipper.lastKnownLocation &&
        moment().diff(moment(shipper.lastKnownLocation.updated), 'hours', true) < 24
      ) {
        const { latitude, longitude } = shipper.lastKnownLocation;
        return `${latitude},${longitude}`;
      }
      const { latitude, longitude } = shipper.address;
      return `${latitude},${longitude}`;
    });

    if (shipmentGeoLocationArray.length && shipperGeoLocationArray.length) {
      getDistance(shipmentGeoLocationArray, shipperGeoLocationArray, (distances: IMatrixDistance) => {
        const dispatchedArray: IDispatcher[] = [];
        const shipmentHistoryArray: IShipmentHistory[] = [];
        const driverLimit = parseInt(process.env.DISPATCH_LIMIT ?? '10');
        runInTransaction(async (session) => {
          await Promise.all(
            filteredShipment.map(async (shipment, shipmentIndex) => {
              const dispatchedItems: IDispatcher[] =
                distances?.rows[shipmentIndex]?.elements
                  ?.map((item, index) => ({ ...item, shipperId: filteredShipper[index].id }))
                  ?.sort((a, b) => (a.distance.value > b.distance.value ? 1 : -1))
                  ?.slice(0, driverLimit)
                  ?.map((item) => ({ shipmentId: shipment.id, shipperId: item.shipperId })) ?? [];
              dispatchedArray.push(...dispatchedItems);

              await Dispatcher.deleteMany({ shipmentId: shipment.id }, { session });

              if (dispatchedItems.length >= driverLimit) {
                shipment.status = SHIPMENT_STATUS.DISPATCHED;
                await shipment.save({ session });

                shipmentHistoryArray.push({
                  shipmentId: shipment.id,
                  activity: SHIPMENT_HISTORY_ACTIVITY.DISPATCHED,
                  additionalInfo: { shipper: dispatchedItems.map((item) => item.shipperId) },
                });

                sendNotification(shipment.id, SHIPMENT_STATUS.DELIVERED);
              }
            }),
          );
          await ShipmentHistory.create(shipmentHistoryArray, { session });
          await Dispatcher.create(dispatchedArray, { session });
        });
      });
    }
    callback();
  } catch (error) {
    errorCallback(error);
  }
}
