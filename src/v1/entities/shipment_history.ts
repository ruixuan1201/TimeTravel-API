import mongoose from 'mongoose';

export enum SHIPMENT_HISTORY_ACTIVITY {
  CREATED = 'CREATED',
  DISPATCHED = 'DISPATCHED',
  CONFIRMED = 'CONFIRMED',
  PICKED = 'PICKED',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
  CANCELLED_USER = 'CANCELLED_USER',
  CANCELLED_DRIVER = 'CANCELLED_DRIVER',
  CANCELLED_TRADO = 'CANCELLED_TRADO',
}

export interface IShipmentHistory {
  shipmentId: mongoose.Types.ObjectId;
  shipperId?: mongoose.Types.ObjectId;
  activity: SHIPMENT_HISTORY_ACTIVITY;
  additionalInfo?: {
    shipper?: mongoose.Types.ObjectId[] | mongoose.Types.ObjectId;
  };
}
