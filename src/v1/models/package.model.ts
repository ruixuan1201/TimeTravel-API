import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { DIMENSION_UNIT, IPackage, TEMPLATE, WEIGHT_UNIT } from './../entities/package';

const PackageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    length: Number,
    width: Number,
    height: Number,
    dimensionUnit: {
      type: String,
      enum: Object.values(DIMENSION_UNIT),
    },
    flatRateTemplate: {
      type: String,
      enum: Object.values(TEMPLATE),
    },
    weight: Number,
    weightUnit: {
      type: String,
      enum: Object.values(WEIGHT_UNIT),
    },
    quantity: Number,
    value: String,
    additionalInfo: { type: String, maxLength: 50 },
  },
  {
    timestamps: true,
  },
);
const Package = mongoose.model<IPackage, mongoose.PaginateModel<IPackage>>('Package', PackageSchema.plugin(paginate));

export default Package;
