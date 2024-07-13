import { RECIPIENT_TYPE } from '../../entities/chat';
import { requiredMixed, requiredString, yupObject } from '../../services/yup';

export const saveChatSchema = yupObject({
  body: yupObject({
    shipmentId: requiredString,
    recipientType: requiredMixed.oneOf(Object.values(RECIPIENT_TYPE)),
    message: requiredString,
    channel: requiredString,
  }),
});
