import mongoose from 'mongoose';

export interface INotification {
  shipmentId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  shipmentCode: string;
  message: string;
}
