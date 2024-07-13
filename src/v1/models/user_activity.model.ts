import mongoose from 'mongoose';
import { IActivity } from '../entities';

const UserActivity = mongoose.model<IActivity>(
  'UserActivity',
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
  'user_activity',
);

export default UserActivity;
