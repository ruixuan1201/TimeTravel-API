import { Router } from 'express';

import addressRouter from '../address';
import authRouter from './auth';
import chatRouter from '../chat';
import commonShipmentRouter from '../shipment';
import profileRouter from './profile';
import shipmentRouter from './shipment';
import vehicleRouter from './vehicle';
import { shipperAuthenticated } from '../../middleware/isAuthenticated';

const shipperRouter = Router();

shipperRouter.use('/auth', authRouter);
shipperRouter.use('/profile', shipperAuthenticated, profileRouter);
shipperRouter.use('/vehicle', shipperAuthenticated, vehicleRouter);
shipperRouter.use('/chat', shipperAuthenticated, chatRouter);
shipperRouter.use('/address', shipperAuthenticated, addressRouter);
shipperRouter.use('/shipment', shipperAuthenticated, shipmentRouter);
shipperRouter.use('/shipment', shipperAuthenticated, commonShipmentRouter);

export default shipperRouter;
