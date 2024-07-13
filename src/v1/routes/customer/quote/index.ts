import { Router } from 'express';

import { getSingleQuote } from './handler';

const quoteRouter = Router();

quoteRouter.get('/:quoteId', getSingleQuote);

export default quoteRouter;
