import mongoose from 'mongoose';

import { IPoint } from './address';

export enum SHIPMENT_STATUS {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  CONFIRMED = 'CONFIRMED',
  STARTED = 'STARTED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
}

export interface ICurrentLocation {
  time: Date;
  latitude: number;
  longitude: number;
}

export enum SHIPMENT_TYPE {
  ECONOMY = 'ECONOMY',
  LONG_DISTANCE = 'LONG_DISTANCE',
  SPEED_TRANSPORT = 'SPEED_TRANSPORT',
  OVER_SIZED = 'OVER_SIZED',
  EXTRA_CARE = 'EXTRA_CARE',
}

export interface IShipment {
  addressFrom: mongoose.Types.ObjectId;
  addressFromGeoId: mongoose.Types.ObjectId;
  addressTo: mongoose.Types.ObjectId;
  addressToGeoId: mongoose.Types.ObjectId;
  addressReturn: mongoose.Types.ObjectId;
  addressReturnGeoId: mongoose.Types.ObjectId;
  packages: mongoose.Types.ObjectId[];
  status: SHIPMENT_STATUS;
  tip: number;
  rating: { value: number; comment: string };
  currentLocation: ICurrentLocation[];
  quotes: mongoose.Types.ObjectId[];
  additionalInfo: string;
  timestamps: true;
  customerId: mongoose.Types.ObjectId;
  shipmentType: SHIPMENT_TYPE;
  shipperId: mongoose.Types.ObjectId;
  shipmentPhoto: {
    url: string;
    id?: string;
  }[];
  shipmentCode: string;
  pickupCode: string;
  pickupDetails?: {
    pickupOn?: Date;
    pickupPictures?: {
      url: string;
      id?: string;
    }[];
    pickupNotes?: string;
  };
  deliveryCode: string;
  deliveryDetails: {
    deliveredOn: Date;
    deliveryPictures: {
      url: string;
      id?: string;
    }[];
    deliveryNotes: string;
  };
  deadline: Date;
}

export interface IShipmentToGeo {
  shipmentId: mongoose.Types.ObjectId;
  addressId: mongoose.Types.ObjectId;
  location: IPoint;
}
