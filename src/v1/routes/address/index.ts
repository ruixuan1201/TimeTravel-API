import { Router } from 'express';

import validator from '../../../v1/middleware/validator';
import { paginationSchema } from '../../../v1/services/yup';
import { createAddress, editAddress, getAllAddress, getSingleAddress, validateAddress } from './handler';
import { addressSchema, editAddressSchema } from './helper';

const addressRouter = Router();

addressRouter.post('/create', validator(addressSchema), createAddress);
addressRouter.get('/list', validator(paginationSchema), getAllAddress);
addressRouter.get('/:addressId/validate', validateAddress);
addressRouter.get('/:addressId', getSingleAddress);
addressRouter.put('/edit/:addressId', validator(editAddressSchema), editAddress);

export default addressRouter;
