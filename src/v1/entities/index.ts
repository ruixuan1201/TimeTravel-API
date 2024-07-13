import mongoose from 'mongoose';

export interface IActivity {
  userId?: mongoose.Types.ObjectId;
  activity: string;
  subActivity?: string;
  additionalInfo?: Record<string, unknown>;
  status?: string;
}
