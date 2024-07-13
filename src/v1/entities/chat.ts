import mongoose from 'mongoose';

export enum RECIPIENT_TYPE {
  DRIVER = 'shipper',
  SUPPORT = 'support',
  CUSTOMER = 'customer',
}

export interface IChat {
  shipmentId: mongoose.Types.ObjectId;
  recipientType: RECIPIENT_TYPE;
  message: string;
  channel: string;
  sender: mongoose.Types.ObjectId;
}
