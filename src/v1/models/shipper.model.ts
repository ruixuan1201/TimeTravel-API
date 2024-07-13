import mongoose from 'mongoose';

import { IShipper, SHIPPER_STATUS } from '../entities/shipper';

const Shipper = mongoose.model<IShipper>(
  'Shipper',
  new mongoose.Schema(
    {
      firstName: String,
      lastName: String,
      email: String,
      phone: {
        type: String,
        unique: true,
      },
      address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
      },
      lastKnownLocation: {
        latitude: Number,
        longitude: Number,
        updated: Date,
      },
      profileImage: String,
      birthDate: String,
      shipperStatus: {
        type: String,
        enum: Object.values(SHIPPER_STATUS),
      },
      rating: {
        value: Number,
        total: Number,
      },
      geoFenceCollectionName: String,
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
      },
      stripeAccountId: String,
      shipmentPreference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShipmentPreference',
      },
      FCMToken: String,
    },
    {
      timestamps: true,
    },
  ),
);

export default Shipper;
