import mongoose from 'mongoose';

import { IActivity } from '.';

export interface IAddressActivity extends IActivity {
  addressId?: mongoose.Types.ObjectId;
}

export interface IAddress {
  street1: string;
  street2?: string;
  street3?: string;
  city: string;
  zip: string;
  state: string;
  latitude: number;
  longitude: number;
  country: string;
  isResidential?: boolean;
  additionalInfo?: string;
  validate: boolean;
}

export interface IPoint {
  type: string;
  coordinates: number[];
}
