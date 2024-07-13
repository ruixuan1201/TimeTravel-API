import { Router } from 'express';

import { customerAuthenticated } from '../../../middleware/isAuthenticated';
import validator from '../../../middleware/validator';
import {
  sendOtpForLoginUser,
  refreshToken,
  loginWithRegister,
  resendOtp,
  verifyOtpForLogin,
  checkRefreshToken,
  checkAccessToken,
} from './handler';
import { phoneConfirmationSchema, phoneSchema, registerSchema, resendOtpSchema } from './helper';

const authRouter = Router();

authRouter.post('/login/otp', validator(phoneSchema), sendOtpForLoginUser);
authRouter.post('/login/verify', validator(phoneConfirmationSchema), verifyOtpForLogin);
authRouter.post('/login/register', validator(registerSchema), loginWithRegister);
authRouter.post('/refreshToken', refreshToken);
authRouter.post('/check/refreshToken', checkRefreshToken);
authRouter.get('/check/accessToken', customerAuthenticated, checkAccessToken);
authRouter.post('/phone/resend', validator(resendOtpSchema), resendOtp);

export default authRouter;
