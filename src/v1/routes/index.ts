import { Router } from 'express';

import customerRouter from './customer';
import shipperRouter from './shipper';
import { healthCheck } from './healthCheck';

const router = Router();

router.use('/customer', customerRouter);
router.use('/shipper', shipperRouter);

router.get('/health_check', healthCheck);

export default router;
