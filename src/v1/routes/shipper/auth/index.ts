import { Router } from 'express';

import validator from '../../../middleware/validator';
import { shipperAuthenticated } from '../../../middleware/isAuthenticated';
import { checkAccessToken, checkRefreshToken, resendOtp, sendOtpForLoginUser } from '../../customer/auth/handler';
import { phoneConfirmationSchema, phoneSchema, resendOtpSchema } from '../../customer/auth/helper';
import { refreshToken, loginWithRegisterShipper, verifyOtpForLoginShipper } from './handler';
import { registerShipperSchema } from './helper';

const authRouter = Router();

authRouter.post('/login/otp', validator(phoneSchema), sendOtpForLoginUser);
authRouter.post('/login/verify', validator(phoneConfirmationSchema), verifyOtpForLoginShipper);
authRouter.post('/login/register', validator(registerShipperSchema), loginWithRegisterShipper);
authRouter.post('/refreshToken', refreshToken);
authRouter.post('/check/refreshToken', checkRefreshToken);
authRouter.get('/check/accessToken', shipperAuthenticated, checkAccessToken);
authRouter.post('/phone/resend', validator(resendOtpSchema), resendOtp);

export default authRouter;
