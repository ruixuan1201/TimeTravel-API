import { requiredNumber, yupArray } from './../../../services/yup';

import { PREFERRED_DISTANCE } from './../../../entities/shipment_preference';
import {
  phoneRegExp,
  yupString,
  yupObject,
  yupMixed,
  requiredString,
  yupBoolean,
  requiredBoolean,
  requiredMixed,
  requiredArray,
} from '../../../services/yup';
import { SHIPPER_STATUS } from '../../../entities/shipper';
import { SHIPMENT_TYPE } from '../../../entities/shipment';

export const updateShipperSchema = yupObject({
  body: yupObject({
    firstName: yupString,
    lastName: yupString,
    email: yupString.email(),
    phone: yupString.matches(phoneRegExp, { excludeEmptyString: true }),
    address: yupString,
    profileImage: yupString,
    birthDate: yupString,
    shipperStatus: yupMixed.oneOf(Object.values(SHIPPER_STATUS)),
    geoFenceCollectionName: yupString,
  }),
});

export const createPreferenceSchema = yupObject({
  body: yupObject({
    city: requiredString,
    nearBy: requiredBoolean,
    distance: requiredMixed.oneOf(Object.values(PREFERRED_DISTANCE)),
    isFullTime: requiredBoolean,
    preferredShipmentType: requiredArray(yupMixed.oneOf(Object.values(SHIPMENT_TYPE))),
  }),
});

export const updatePreferenceSchema = yupObject({
  body: yupObject({
    city: yupString,
    nearBy: yupBoolean,
    distance: yupMixed.oneOf(Object.values(PREFERRED_DISTANCE)),
    isFullTime: yupBoolean,
    preferredShipmentType: yupArray(yupMixed.oneOf(Object.values(SHIPMENT_TYPE))),
  }),
});

export const changeShipperStatusSchema = yupObject({
  body: yupObject({
    active: requiredBoolean,
  }),
});

export const saveLastKnownLocationSchema = yupObject({
  body: yupObject({
    latitude: requiredNumber.max(90).min(-90),
    longitude: requiredNumber.max(180).min(-180),
  }).required(),
});

export const saveFCMTokenSchema = yupObject({
  body: yupObject({
    FCMToken: requiredString,
  }).required(),
});
