import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { IVehicle } from './../entities/vehicle';

const VehicleSchema = new mongoose.Schema(
  {
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipper',
    },
    make: String,
    model: String,
    year: Number,
    color: String,
    doors: String,
    pictures: [
      {
        url: String,
      },
    ],
    additionalInfo: Object,
  },
  {
    timestamps: true,
  },
);

const Vehicle = mongoose.model<IVehicle, mongoose.PaginateModel<IVehicle>>('Vehicle', VehicleSchema.plugin(paginate));

export default Vehicle;
