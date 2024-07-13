import { Router } from 'express';

import { calculateQuote, getCurrentShipmentLocation, getShipmentLocationHistory, getSingleShipment } from './handler';

const commonShipmentRouter = Router();

commonShipmentRouter.get('/locationHistory/:shipmentId', getShipmentLocationHistory);
commonShipmentRouter.get('/currentLocation/:shipmentId', getCurrentShipmentLocation);

commonShipmentRouter.get('/:shipmentId/quotes/:currency', calculateQuote);
commonShipmentRouter.get('/:shipmentId', getSingleShipment);

export default commonShipmentRouter;
