import * as yup from 'yup';

import { requiredNumber, requiredString, yupNumber, yupObject, yupString } from '../../../services/yup';

export const deliveredShipmentSchema = yupObject({
  body: yupObject({
    notes: requiredString.max(200),
  }),
});

export const saveCurrentLocation = yupObject({
  body: yupObject({
    latitude: requiredNumber.max(90).min(-90),
    longitude: requiredNumber.max(180).min(-180),
  }).required(),
});

export const getDispatchedSchema = yupObject({
  query: yupObject({
    latitude: yupString,
    longitude: yupString,
    page: yupNumber.integer().min(1),
    limit: yupNumber.integer().min(1),
  }),
});

export const acceptShipmentSchema = yupObject({
  body: yupObject({
    expectedPickupTimestamp: yup.date().required(),
  }),
});

export const validatePickupCodeSchema = yupObject({
  body: yupObject({
    pickupCode: requiredString,
  }),
});

export const pickupShipmentSchema = yupObject({
  body: yupObject({
    notes: yupString,
  }),
});
