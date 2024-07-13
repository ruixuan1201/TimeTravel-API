import mongoose from 'mongoose';

import { IShipperActivity } from '../entities/shipper';

const ShipperActivity = mongoose.model<IShipperActivity>(
  'ShipperActivity',
  new mongoose.Schema(
    {
      shipperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
      },
      activity: String,
      subActivity: String,
      additionalInfo: Object,
      status: String,
    },
    {
      timestamps: true,
    },
  ),
  'shipper_activity',
);

export default ShipperActivity;
