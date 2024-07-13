import { Router } from 'express';

import addressRouter from '../address';
import authRouter from '../customer/auth';
import chatRouter from '../chat';
import commonShipmentRouter from '../shipment';
import packageRouter from './package';
import profileRouter from '../customer/profile';
import quoteRouter from './quote';
import shipmentRouter from './shipment';
import { customerAuthenticated } from '../../middleware/isAuthenticated';

const customerRouter = Router();

customerRouter.use('/auth', authRouter);
customerRouter.use('/profile', customerAuthenticated, profileRouter);
customerRouter.use('/chat', customerAuthenticated, chatRouter);
customerRouter.use('/address', customerAuthenticated, addressRouter);
customerRouter.use('/package', customerAuthenticated, packageRouter);
customerRouter.use('/quote', customerAuthenticated, quoteRouter);
customerRouter.use('/shipment', customerAuthenticated, shipmentRouter);
customerRouter.use('/shipment', customerAuthenticated, commonShipmentRouter);

export default customerRouter;
