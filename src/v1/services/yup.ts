import * as yup from 'yup';
import { ObjectShape } from 'yup/lib/object';

export const phoneRegExp =
  /^((\+[1-9]{1,4}[ \-]*)|(\([0-9]{2,3}\)[ \-]*)|([0-9]{2,4})[ \-]*)*?[0-9]{3,4}?[ \-]*[0-9]{3,4}?$/;

export const yupObject = (object: ObjectShape) => yup.object(object);

export const yupArray = (object: yup.AnySchema) => yup.array().min(1).of(object);
export const requiredArray = (object: yup.AnySchema) => yupArray(object).required();

export const yupString = yup.string();
export const yupBoolean = yup.boolean();
export const yupNumber = yup.number();
export const yupMixed = yup.mixed();

export const requiredString = yupString.required();
export const requiredBoolean = yupBoolean.required();
export const requiredNumber = yupNumber.required();
export const requiredMixed = yupMixed.required();

export const paginationSchema = yupObject({
  query: yupObject({
    page: yupNumber.integer().min(1),
    limit: yupNumber.integer().min(1),
    order: yupString,
  }),
});
