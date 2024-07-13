import mongoose from 'mongoose';

import { IAddressActivity } from '../entities/address';

const AddressActivity = mongoose.model<IAddressActivity>(
  'AddressActivity',
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
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
  'address_activity',
);

export default AddressActivity;
