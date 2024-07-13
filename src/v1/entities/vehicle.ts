import mongoose from 'mongoose';

export interface IVehicle {
  shipperId: mongoose.Types.ObjectId;
  make: string;
  model: string;
  year: number;
  color: string;
  doors: string;
  pictures?: {
    url: string;
    id?: string;
  }[];
  additionalInfo?: Record<string, unknown>;
}
