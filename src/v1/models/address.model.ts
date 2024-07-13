import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { IAddress } from '../entities/address';

export const PointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const AddressSchema = new mongoose.Schema(
  {
    street1: {
      type: String,
      required: true,
    },
    street2: String,
    street3: String,
    city: {
      type: String,
      required: true,
    },
    latitude: Number,
    longitude: Number,
    zip: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    isResidential: Boolean,
    additionalInfo: { type: String, maxLength: 50 },
    validate: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Address = mongoose.model<IAddress, mongoose.PaginateModel<IAddress>>('Address', AddressSchema.plugin(paginate));

export default Address;
