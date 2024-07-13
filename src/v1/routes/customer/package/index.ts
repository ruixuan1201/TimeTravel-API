import { Router } from 'express';

import validator from '../../../middleware/validator';
import { createPackage, getAllPackages, getSinglePackage, updatePackage } from './handler';
import { createPackageSchema, updatePackageSchema } from './helper';
import { paginationSchema } from '../../../services/yup';

const packageRouter = Router();

packageRouter.post('/create', validator(createPackageSchema), createPackage);
packageRouter.get('/list', validator(paginationSchema), getAllPackages);
packageRouter.get('/:packageId', getSinglePackage);
packageRouter.post('/update/:packageId', validator(updatePackageSchema), updatePackage);

export default packageRouter;
