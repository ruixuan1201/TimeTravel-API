import { Router } from 'express';

import validator from '../../../middleware/validator';
import {
  getCards,
  getUser,
  isSetupPaymentMethod,
  paymentSetupIntent,
  saveFCMToken,
  updateUser,
  uploadAvatar,
} from './handler';
import { saveFCMTokenSchema, updateUserSchema } from './helper';

const profileRouter = Router();

profileRouter.post('/update', validator(updateUserSchema), updateUser);
profileRouter.get('/get', getUser);
profileRouter.get('/payment/setupIntent', paymentSetupIntent);
profileRouter.get('/payment/check', isSetupPaymentMethod);
profileRouter.get('/payment/card', getCards);
profileRouter.post('/fcm_token/save', validator(saveFCMTokenSchema), saveFCMToken);
profileRouter.post('/avatar', uploadAvatar);

export default profileRouter;
