import mongoose from 'mongoose';

import { SHIPMENT_TYPE } from '../entities/shipment';
import { IShipmentPreference } from '../entities/shipment_preference';

const ShipmentPreference = mongoose.model<IShipmentPreference>(
  'ShipmentPreference',
  new mongoose.Schema(
    {
      shipperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipper',
      },
      city: String,
      nearBy: Boolean,
      distance: String,
      isFullTime: Boolean,
      preferredShipmentType: [
        {
          type: String,
          enum: Object.values(SHIPMENT_TYPE),
        },
      ],
    },
    {
      timestamps: true,
    },
  ),
);

export default ShipmentPreference;
