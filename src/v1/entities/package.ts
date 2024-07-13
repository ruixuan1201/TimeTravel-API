import mongoose from 'mongoose';

import { IActivity } from '.';

export interface IPackageActivity extends IActivity {
  packageId?: mongoose.Types.ObjectId;
}

export enum DIMENSION_UNIT {
  CENTIMETER = 'CENTIMETER',
  INCHES = 'INCHES',
  FEET = 'FEET',
  MILLIMETER = 'MILLIMETER',
  METER = 'METER',
  YARD = 'YARD',
}

export enum WEIGHT_UNIT {
  GRAM = 'GRAM',
  OUNCE = 'OUNCE',
  POUND = 'POUND',
  KILO = 'KILO',
}

export enum TEMPLATE {
  FedEx_Box_10kg = 'FedEx_Box_10kg',
  FedEx_Box_25kg = 'FedEx_Box_25kg',
  UPS_Box_10kg = 'UPS_Box_10kg',
  UPS_Box_25kg = 'UPS_Box_25kg',
}

export interface IPackage {
  userId: mongoose.Types.ObjectId;
  length: number;
  width: number;
  height: number;
  dimensionUnit: DIMENSION_UNIT;
  flatRateTemplate: TEMPLATE;
  weight: number;
  weightUnit: WEIGHT_UNIT;
  quantity: number;
  value: string;
  additionalInfo?: string;
}
