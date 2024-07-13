import { Router } from 'express';

import validator from '../../../middleware/validator';
import {
  acceptShipmentSchema,
  deliveredShipmentSchema,
  pickupShipmentSchema,
  saveCurrentLocation,
  validatePickupCodeSchema,
} from './helper';
import {
  acceptShipment,
  deleteDeliveredImage,
  deletePickupImage,
  deliveredShipment,
  getActiveShipments,
  pickupShipment,
  rejectShipment,
  saveCurrentShipmentLocation,
  startShipment,
  uploadDeliveredShipmentImage,
  uploadPickupImages,
  validatePickupCode,
} from './handler';
import { paginationSchema } from '../../../services/yup';

const shipmentRouter = Router();

shipmentRouter.post('/accept/:shipmentId', validator(acceptShipmentSchema), acceptShipment);
shipmentRouter.post('/reject/:shipmentId', rejectShipment);
shipmentRouter.post('/start/:shipmentId', startShipment);
shipmentRouter.post('/pickup/:shipmentId/uploadImages', uploadPickupImages);
shipmentRouter.delete('/pickup/:shipmentId/deleteImage/:imageId', deletePickupImage);
shipmentRouter.post('/pickup/:shipmentId', validator(pickupShipmentSchema), pickupShipment);
shipmentRouter.post('/validatePickupCode/:shipmentId', validator(validatePickupCodeSchema), validatePickupCode);
shipmentRouter.post('/delivered/:shipmentId', validator(deliveredShipmentSchema), deliveredShipment);
shipmentRouter.post('/delivered/:shipmentId/uploadImages', uploadDeliveredShipmentImage);
shipmentRouter.delete('/delivered/:shipmentId/deleteImage/:imageId', deleteDeliveredImage);
shipmentRouter.get('/activeList', validator(paginationSchema), getActiveShipments);
shipmentRouter.post('/currentLocation/:shipmentId', validator(saveCurrentLocation), saveCurrentShipmentLocation);

export default shipmentRouter;
