import * as yup from 'yup';

import { requiredString, yupObject, yupString, requiredNumber, yupNumber } from '../../../services/yup';

export const createVehicleSchema = yupObject({
  body: yupObject({
    make: requiredString,
    model: requiredString,
    year: requiredNumber,
    color: requiredString,
    doors: requiredString,
    pictures: yup.array().min(1).of(yupString),
  }),
});

export const updateVehicleSchema = yupObject({
  body: yupObject({
    make: yupString,
    model: yupString,
    year: yupNumber,
    color: yupString,
    doors: yupString,
  }),
});
