import mongoose from 'mongoose';

import { SHIPMENT_TYPE } from './shipment';

export enum PREFERRED_DISTANCE {
  '<25 miles' = '<25 miles',
  '25-50 miles' = '25-50 miles',
  '50-100 miles' = '50-100 miles',
  '100-500 miles' = '100-500 miles',
}

export interface IShipmentPreference {
  shipperId: mongoose.Types.ObjectId;
  city: string;
  nearBy: boolean;
  distance: PREFERRED_DISTANCE;
  isFullTime: boolean;
  preferredShipmentType: SHIPMENT_TYPE[];
}
