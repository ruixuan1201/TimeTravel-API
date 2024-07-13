import { phoneRegExp, requiredString, yupObject, yupString } from '../../../services/yup';

export const updateUserSchema = yupObject({
  body: yupObject({
    firstName: yupString,
    lastName: yupString,
    middleName: yupString,
    phone: yupString.matches(phoneRegExp, { excludeEmptyString: true }),
    terms: yupString,
    email: yupString.email(),
  }),
});

export const saveFCMTokenSchema = yupObject({
  body: yupObject({
    FCMToken: requiredString,
  }).required(),
});
