import mongoose from 'mongoose';
import { SHIPMENT_HISTORY_ACTIVITY, IShipmentHistory } from '../entities/shipment_history';

const ShipmentHistory = mongoose.model<IShipmentHistory>(
  'ShipmentHistory',
  new mongoose.Schema(
    {
      shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      shipperId: mongoose.Schema.Types.ObjectId,
      activity: {
        type: String,
        enum: Object.values(SHIPMENT_HISTORY_ACTIVITY),
      },
      additionalInfo: Object,
    },
    {
      timestamps: true,
    },
  ),
  'shipment_history',
);

export default ShipmentHistory;
