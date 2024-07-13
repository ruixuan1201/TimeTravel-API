import mongoose from 'mongoose';

import { IUser } from '../../v1/entities/user';

const User = mongoose.model<IUser>(
  'User',
  new mongoose.Schema(
    {
      firstName: String,
      lastName: String,
      middleName: String,
      email: String,
      stripeCustomerId: String,
      phone: {
        type: String,
        unique: true,
      },
      photoURL: String,
      verificationToken: String,
      FCMToken: String,
      terms: {
        termsAccepted: Boolean,
        acceptedSmsCommunication: Boolean,
      },
      lastLogin: {
        date: String,
        time: String,
      },
    },
    {
      timestamps: true,
    },
  ),
);

export default User;
