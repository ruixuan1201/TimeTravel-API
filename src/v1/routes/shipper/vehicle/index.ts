import { Router } from 'express';

import validator from '../../../middleware/validator';
import { createVehicle, getSingleVehicle, updateVehicle, uploadVehicleImage, deleteVehicleImage } from './handler';
import { createVehicleSchema, updateVehicleSchema } from './helper';

const vehicleRouter = Router();

vehicleRouter.post('/create', validator(createVehicleSchema), createVehicle);
vehicleRouter.get('/', getSingleVehicle);
vehicleRouter.post('/update', validator(updateVehicleSchema), updateVehicle);
vehicleRouter.post('/uploadImage', uploadVehicleImage);
vehicleRouter.delete('/deleteImage/:imageId', deleteVehicleImage);

export default vehicleRouter;
