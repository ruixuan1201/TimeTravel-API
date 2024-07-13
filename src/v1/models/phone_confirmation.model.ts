import mongoose from 'mongoose';

import { IPhoneConfirmation } from '../entities/phone_confirmation';

const PhoneConfirmation = mongoose.model<IPhoneConfirmation>(
  'PhoneConfirmation',
  new mongoose.Schema(
    {
      phone: {
        type: String,
        unique: true,
      },
      otp: String,
      otpGenerated: Date,
    },
    {
      timestamps: true,
    },
  ),
  'phone_confirmation',
);

export default PhoneConfirmation;
