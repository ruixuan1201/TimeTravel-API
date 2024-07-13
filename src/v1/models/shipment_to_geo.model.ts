import mongoose from 'mongoose';

import { IShipmentToGeo } from '../entities/shipment';
import { PointSchema } from './address.model';

const ShipmentToGeo = mongoose.model<IShipmentToGeo>(
  'ShipmentToGeo',
  new mongoose.Schema(
    {
      addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
      },
      shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
      },
      location: {
        type: PointSchema,
        index: '2dsphere',
      },
    },
    {
      timestamps: true,
    },
  ),
  'shipment_to_geo',
);

export default ShipmentToGeo;
