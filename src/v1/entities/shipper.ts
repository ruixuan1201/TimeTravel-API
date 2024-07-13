import mongoose from 'mongoose';

import { IActivity } from '.';

export enum SHIPPER_STATUS {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
  ONBOARDING = 'ONBOARDING',
  ONBOARDED = 'ONBOARDED',
  REJECTED = 'REJECTED',
  WAITLISTED = 'WAITLISTED',
}

export interface IShipper {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: mongoose.Types.ObjectId;
  lastKnownLocation: {
    latitude: number;
    longitude: number;
    updated: Date;
  };
  profileImage: string;
  rating: { value: number; total: number };
  birthDate: string;
  shipperStatus: SHIPPER_STATUS;
  geoFenceCollectionName: string;
  vehicleId: mongoose.Types.ObjectId;
  stripeAccountId: string;
  shipmentPreference: mongoose.Types.ObjectId;
  FCMToken?: string;
}

export interface IShipperActivity extends IActivity {
  shipperId?: mongoose.Types.ObjectId;
}
