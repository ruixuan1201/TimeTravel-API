import * as yup from 'yup';

import { SHIPMENT_STATUS, SHIPMENT_TYPE } from '../../../entities/shipment';
import { requiredNumber, requiredString, yupMixed, yupObject, yupString } from '../../../services/yup';

export const createShipmentSchema = yupObject({
  body: yupObject({
    addressFrom: requiredString,
    addressTo: requiredString,
    addressReturn: yupString,
    packages: yup.array().min(1).required().of(yupString),
    quotes: yup.array().min(1).of(yupString),
    additionalInfo: yupString.max(50),
    shipmentType: yupMixed.oneOf(Object.values(SHIPMENT_TYPE)).required(),
    deadline: yup.date(),
  }),
});

export const updateShipmentSchema = yupObject({
  body: yupObject({
    addressFrom: yupString,
    addressTo: yupString,
    addressReturn: yupString,
    packages: yup.array().min(1).of(yupString),
    status: yupMixed.oneOf(Object.values(SHIPMENT_STATUS)),
    quotes: yup.array().min(1).of(yupString),
    additionalInfo: yupString.max(50),
    shipmentType: yupMixed.oneOf(Object.values(SHIPMENT_TYPE)),
    deadline: yup.date(),
  }),
});

export const rateShipmentSchema = yupObject({
  body: yupObject({
    value: requiredNumber.max(5).min(1),
    comment: yupString,
  }),
});

export const tipShipmentSchema = yupObject({
  body: yupObject({
    tip: requiredNumber,
  }),
});
