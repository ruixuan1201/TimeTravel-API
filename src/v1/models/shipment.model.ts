import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { IShipment, SHIPMENT_STATUS, SHIPMENT_TYPE } from '../../v1/entities/shipment';

const ShipmentSchema = new mongoose.Schema(
  {
    addressFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    addressFromGeoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShipmentToGeo',
    },
    addressTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    addressToGeoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShipmentToGeo',
    },
    addressReturn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    addressReturnGeoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShipmentToGeo',
    },
    packages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
      },
    ],
    status: {
      type: String,
      enum: Object.values(SHIPMENT_STATUS),
    },
    rating: {
      value: Number,
      comment: String,
    },
    tip: Number,
    currentLocation: [
      {
        time: Date,
        latitude: Number,
        longitude: Number,
      },
    ],
    quotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote',
      },
    ],
    additionalInfo: { type: String, maxLength: 50 },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    shipmentType: {
      type: String,
      enum: Object.values(SHIPMENT_TYPE),
    },
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipper',
    },
    shipmentPhoto: [
      {
        url: String,
      },
    ],
    shipmentCode: String,
    pickupCode: String,
    pickupDetails: {
      pickupOn: Date,
      pickupPictures: [
        {
          url: String,
        },
      ],
      pickupNotes: String,
    },
    deliveryCode: String,
    deliveryDetails: {
      deliveredOn: Date,
      deliveryPictures: [
        {
          url: String,
        },
      ],
      deliveryNotes: String,
    },
    deadline: Date,
  },
  { timestamps: true },
);

const Shipment = mongoose.model<IShipment, mongoose.PaginateModel<IShipment>>(
  'Shipment',
  ShipmentSchema.plugin(paginate),
);

export default Shipment;
