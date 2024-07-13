import { requiredString, yupObject, yupString } from '../../../services/yup';

export const registerShipperSchema = yupObject({
  body: yupObject({
    firstName: requiredString,
    lastName: requiredString,
    email: requiredString.email(),
    address: requiredString,
    profileImage: yupString,
    birthDate: requiredString,
    geoFenceCollectionName: yupString,
  }),
});
