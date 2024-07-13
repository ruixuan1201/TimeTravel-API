import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { INotification } from '../entities/notification';

const NotificationSchema = new mongoose.Schema(
  {
    shipmentId: mongoose.Schema.Types.ObjectId,
    customerId: mongoose.Schema.Types.ObjectId,
    shipmentCode: String,
    message: String,
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model<INotification, mongoose.PaginateModel<INotification>>(
  'Notification',
  NotificationSchema.plugin(paginate),
);

export default Notification;
