import { Router } from 'express';

import validator from '../../../middleware/validator';
import { createShipmentSchema, rateShipmentSchema, tipShipmentSchema, updateShipmentSchema } from './helper';
import {
  createShipment,
  deleteShipmentImage,
  dispatchShipmentAPI,
  getAllNotifications,
  getAllShipments,
  rateShipment,
  tipShipment,
  updateShipment,
  uploadShipmentImage,
} from './handler';
import { paginationSchema } from '../../../services/yup';

const shipmentRouter = Router();

shipmentRouter.post('/create', validator(createShipmentSchema), createShipment);
shipmentRouter.get('/notifications/list', validator(paginationSchema), getAllNotifications);

shipmentRouter.post('/dispatch', dispatchShipmentAPI);
shipmentRouter.post('/update/:shipmentId', validator(updateShipmentSchema), updateShipment);
shipmentRouter.post('/rate/:shipmentId', validator(rateShipmentSchema), rateShipment);
shipmentRouter.post('/tip/:shipmentId', validator(tipShipmentSchema), tipShipment);

shipmentRouter.post('/uploadImage/:shipmentId', uploadShipmentImage);
shipmentRouter.delete('/deleteImage/:shipmentId/:imageId', deleteShipmentImage);
shipmentRouter.get('/list', validator(paginationSchema), getAllShipments);

export default shipmentRouter;
