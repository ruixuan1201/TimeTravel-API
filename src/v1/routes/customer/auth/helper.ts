import { requiredString, requiredBoolean, yupObject, phoneRegExp } from '../../../services/yup';

export const registerSchema = yupObject({
  body: yupObject({
    id: requiredString,
    email: requiredString.email(),
    firstName: requiredString,
    lastName: requiredString,
    terms: yupObject({
      termsAccepted: requiredBoolean,
      acceptedSmsCommunication: requiredBoolean,
    }).required(),
  }),
});

export const phoneConfirmationSchema = yupObject({
  body: yupObject({
    id: requiredString,
    otp: requiredString,
  }),
});

export const phoneSchema = yupObject({
  body: yupObject({
    phone: requiredString.matches(phoneRegExp),
  }),
});

export const resendOtpSchema = yupObject({
  body: yupObject({
    id: requiredString,
  }),
});
