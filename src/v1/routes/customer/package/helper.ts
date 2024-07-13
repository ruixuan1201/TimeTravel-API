import { DIMENSION_UNIT, WEIGHT_UNIT } from '../../../entities/package';
import {
  requiredMixed,
  requiredNumber,
  requiredString,
  yupMixed,
  yupNumber,
  yupObject,
  yupString,
} from '../../../services/yup';
import { TEMPLATE } from '../../../entities/package';

export const createPackageSchema = yupObject({
  body: yupObject({
    length: requiredNumber,
    width: requiredNumber,
    height: requiredNumber,
    dimensionUnit: requiredMixed.oneOf(Object.values(DIMENSION_UNIT)),
    flatRateTemplate: requiredMixed.oneOf(Object.values(TEMPLATE)),
    weight: requiredNumber,
    weightUnit: requiredMixed.oneOf(Object.values(WEIGHT_UNIT)),
    quantity: requiredNumber,
    value: requiredString,
    additionalInfo: yupString.max(50),
  }),
});

export const updatePackageSchema = yupObject({
  body: yupObject({
    length: yupNumber,
    width: yupNumber,
    height: yupNumber,
    dimensionUnit: yupMixed.oneOf(Object.values(DIMENSION_UNIT)),
    flatRateTemplate: yupMixed.oneOf(Object.values(TEMPLATE)),
    weight: yupNumber,
    weightUnit: yupMixed.oneOf(Object.values(WEIGHT_UNIT)),
    quantity: yupNumber,
    value: yupString,
    additionalInfo: yupString.max(50),
  }),
});
