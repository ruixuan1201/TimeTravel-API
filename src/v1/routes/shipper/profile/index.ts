import { Router } from 'express';

import validator from '../../../middleware/validator';
import {
  changeShipperStatus,
  createPreference,
  getShipper,
  getStripeAccountLink,
  saveFCMToken,
  saveLastKnownLocation,
  updatePreference,
  updateShipper,
} from './handler';
import {
  changeShipperStatusSchema,
  createPreferenceSchema,
  saveFCMTokenSchema,
  saveLastKnownLocationSchema,
  updatePreferenceSchema,
  updateShipperSchema,
} from './helper';

const profileRouter = Router();

profileRouter.post('/update', validator(updateShipperSchema), updateShipper);

profileRouter.post('/preference', validator(createPreferenceSchema), createPreference);
profileRouter.put('/preference', validator(updatePreferenceSchema), updatePreference);

profileRouter.put('/active', validator(changeShipperStatusSchema), changeShipperStatus);
profileRouter.post('/saveLastKnownLocation', validator(saveLastKnownLocationSchema), saveLastKnownLocation);
profileRouter.post('/fcm_token/save', validator(saveFCMTokenSchema), saveFCMToken);

profileRouter.get('/connectLink', getStripeAccountLink);

profileRouter.get('/', getShipper);

export default profileRouter;
