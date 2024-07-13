import { requiredBoolean, requiredString, yupBoolean, yupObject, yupString } from '../../../v1/services/yup';

export const addressSchema = yupObject({
  body: yupObject({
    street1: requiredString,
    street2: yupString,
    street3: yupString,
    city: requiredString,
    latitude: yupString,
    longitude: yupString,
    zip: requiredString,
    state: requiredString,
    country: requiredString,
    isResidential: yupBoolean,
    additionalInfo: yupString.max(50),
    validate: requiredBoolean,
  }),
});

export const editAddressSchema = yupObject({
  body: yupObject({
    street1: yupString,
    street2: yupString,
    street3: yupString,
    city: yupString,
    latitude: yupString,
    longitude: yupString,
    zip: yupString,
    state: yupString,
    country: yupString,
    isResidential: yupBoolean,
    additionalInfo: yupString.max(50),
    validate: yupBoolean,
  }),
});
