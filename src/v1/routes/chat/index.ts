import { Router } from 'express';

import validator from '../../middleware/validator';
import { getChatHistory, saveChat } from './handler';
import { paginationSchema } from '../../services/yup';
import { saveChatSchema } from './helper';

const chatRouter = Router();

chatRouter.post('/save', validator(saveChatSchema), saveChat);
chatRouter.get('/list', validator(paginationSchema), getChatHistory);

export default chatRouter;
