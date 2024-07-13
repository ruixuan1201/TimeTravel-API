import mongoose from 'mongoose';

import { IDispatcher } from '../entities/dispatcher';

const Dispatcher = mongoose.model<IDispatcher>(
  'Dispatcher',
  new mongoose.Schema(
    {
      shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
      },
      shipperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
      },
    },
    {
      timestamps: true,
    },
  ),
);

export default Dispatcher;
