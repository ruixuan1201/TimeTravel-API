import mongoose from 'mongoose';

import { IPackageActivity } from '../entities/package';

const PackageActivity = mongoose.model<IPackageActivity>(
  'PackageActivity',
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
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
  'package_activity',
);

export default PackageActivity;
